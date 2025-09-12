import { ConfigService } from '@nestjs/config';
import { forwardRef, Inject, Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from 'src/order/schemas/order.schema';
import { ProductService } from 'src/product/product.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/schemas/notification.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class StripeService {
    private stripe: Stripe;
    private webhookSecret: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly productService: ProductService,
        private readonly notificationService: NotificationsService,
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) {
        this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY', ''), {
            apiVersion: '2025-08-27.basil',
        });
        this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET', '');
    }

    // Create Stripe Checkout Session (no draft order)
    async createCheckoutSession(userId: string, items: any[], shippingAddress?: string) {
        if (!userId) throw new BadRequestException('User not found');
        if (!items || items.length === 0) throw new BadRequestException('Cart is empty');

        const user = await this.userModel.findById(userId).lean();
        if (!user) throw new BadRequestException('User not found');

        const line_items = items.map((item) => ({
            price_data: {
                currency: 'usd',
                unit_amount: Math.round((item.price || 0) * 100),
                product_data: {
                    name: item.title || item.name || 'Product',
                    description: `size:${item.size || ''} color:${item.color || ''}`,
                    metadata: { productId: String(item.product) },
                },
            },
            quantity: item.quantity || 1,
        }));

        const clientUrl = this.configService.get<string>('NEXT_PUBLIC_CLIENT_URL') || 'http://localhost:3000';

        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items,
            success_url: `${clientUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${clientUrl}/order/cancel?session_id={CHECKOUT_SESSION_ID}`,
            metadata: {
                userId: userId.toString(),
                cart: JSON.stringify(items.map(i => ({
                    productId: i.product,
                    quantity: i.quantity,
                    size: i.size,
                    color: i.color,
                    price: i.price,
                }))),
                shippingAddress: shippingAddress || '',
            },
            customer_email: user.email,
        });

        return { url: session.url };
    }

    // Handle Stripe Webhook
    async handleWebhook(rawBody: Buffer, signature: string) {
        let event: Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
        } catch (err) {
            console.error('Webhook Error:', err?.message ?? err);
            throw new BadRequestException('Webhook signature verification failed');
        }

        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case 'checkout.session.expired':
            case 'payment_intent.payment_failed':
                await this.handleCheckoutFailed(event.data.object as Stripe.Checkout.Session);
                break;
        }

        return { received: true };
    }

    // Create order only when payment succeeded
    private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
        const metadata = session.metadata;
        if (!metadata?.userId || !metadata?.cart) return;

        const userId = metadata.userId;
        const shippingAddress = metadata.shippingAddress;
        const cartItems = JSON.parse(metadata.cart);

        const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const order = new this.orderModel({
            user: new Types.ObjectId(userId),
            items: cartItems.map(item => ({
                product: item.productId,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                price: item.price,
            })),
            totalAmount,
            status: OrderStatus.PAID,
            statusHistory: [{ status: OrderStatus.PAID, changedAt: new Date() }],
            paymentMethod: 'money',
            paymentIntentId: session.payment_intent,
            shippingAddress,
        });

        await order.save();

        // Decrement stock
        for (const item of cartItems) {
            try {
                await this.productService.updateVariantStock(
                    String(item.productId),
                    item.size,
                    item.color,
                    item.quantity,
                );
            } catch (err) {
                console.error('Failed to decrement stock for item', item, err);
            }
        }

        // Notify user
        await this.notificationService.notifyUser(
            userId,
            'Payment received',
            `Your payment is successful and order ${order._id} is confirmed.`,
            NotificationType.ORDER,
            order._id,
        );
    }

    private async handleCheckoutFailed(session: Stripe.Checkout.Session) {
        const userId = session.metadata?.userId;
        if (!userId) return;

        console.warn('Payment failed or session expired for user:', userId);

        // Send notification to user
        await this.notificationService.notifyUser(
            userId,
            'Payment Failed',
            'Your payment could not be completed. Please try again.',
            NotificationType.ORDER,
            // null, // no order ID since order was not created
        );
    }

}
