import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { UpdateOrderDto } from './dto/update-order.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/schemas/notification.schema';
import { ProductService } from 'src/product/product.service';
import { StripeService } from 'src/stripe/stripe.service';

@Injectable()
export class OrderService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private readonly notificationService: NotificationsService,
        private readonly productService: ProductService,
        private readonly stripeService: StripeService,
    ) { }

    async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
        if (!createOrderDto.items || createOrderDto.items.length === 0) {
            throw new BadRequestException('Order must contain at least one item');
        }

        // ✅ Fetch user
        const user = await this.userModel.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        // Prevent admins and superadmins from placing orders
        if (user.roles?.includes('admin') || user.roles?.includes('superadmin')) {
            throw new ForbiddenException('Admins cannot place orders');
        }

        // ✅ Calculate total amount
        const totalAmount = createOrderDto.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
        );

        if (createOrderDto.paymentMethod === 'points') {
            // 🟢 Points flow
            const requiredPoints = Math.ceil(totalAmount / 250);
            if (user.loyaltyPoints < requiredPoints) {
                throw new BadRequestException('Insufficient points balance');
            }

            // Deduct points
            user.loyaltyPoints -= requiredPoints;
            await user.save();

            // Create order directly as PAID
            const order = new this.orderModel({
                ...createOrderDto,
                totalAmount,
                totalPointsUsed: requiredPoints,
                user: new Types.ObjectId(userId),
                status: OrderStatus.PAID,
                statusHistory: [{ status: OrderStatus.PAID, changedAt: new Date() }],
            });

            // Decrement stock
            for (const item of createOrderDto.items) {
                await this.productService.updateVariantStock(
                    String(item.product),
                    item.size,
                    item.color,
                    item.quantity,
                );
            }

            // Notify user
            await this.notificationService.notifyUser(
                userId,
                'Loyalty Points Deducted',
                `${requiredPoints} points have been deducted from your account for this order.`,
                NotificationType.LOYALTY,
                order._id,
            );

            return await order.save();
        }

        // ⚠️ DO NOT create PaymentIntent manually here.
        // Stripe Checkout Session (in stripe.service.ts) will handle paymentIntent creation.
        throw new BadRequestException(
            'Card payments must go through Stripe checkout session',
        );
    }

    async findAll(user: any): Promise<Order[]> {
        if (user.roles.includes('admin') || user.roles.includes('superadmin')) {
            return this.orderModel
                .find()
                .populate('user', 'name email loyaltyPoints')
                .populate('items.product', 'title price images')
                .exec();
        }

        return this.orderModel
            .find({ user: new Types.ObjectId(user.sub) })
            .populate('items.product', 'title price images')
            .exec();
    }

    async findById(user: any, id: string): Promise<Order> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid order ID');
        }

        const order = await this.orderModel
            .findById(id)
            .populate('user', 'name email loyaltyPoints')
            .populate('items.product', 'title price images')
            .exec();

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (
            !user.roles.includes('admin') &&
            !user.roles.includes('superadmin') &&
            order.user._id.toString() !== user._id.toString()
        ) {
            throw new ForbiddenException('You are not allowed to access this order');
        }

        return order;
    }

    async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid order ID');
        }

        const order = await this.orderModel.findById(id).exec();
        if (!order) throw new NotFoundException('Order not found');

        const prevStatus = order.status;
        const updateData: any = {};

        if (updateOrderDto.status !== undefined) {
            // ❌ Prevent status change if already delivered or cancelled
            if ([OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status)) {
                throw new BadRequestException(
                    `Order status cannot be changed once it is ${order.status}.`,
                );
            }

            updateData.status = updateOrderDto.status;

            if (prevStatus !== updateOrderDto.status) {
                updateData.$push = {
                    statusHistory: {
                        status: updateOrderDto.status,
                        changedAt: new Date(),
                    },
                };
            }

            // ✅ Notify about status change
            await this.notificationService.notifyUser(
                order.user.toString(),
                'Order Status Updated',
                `Your order #${order._id} status has been updated to ${updateOrderDto.status}.`,
                NotificationType.ORDER,
                order._id,
            );

            // ✅ If delivered, grant points
            if (
                prevStatus !== OrderStatus.DELIVERED &&
                updateOrderDto.status === OrderStatus.DELIVERED
            ) {
                if (order.paymentMethod !== 'points') {
                    const user = await this.userModel.findById(order.user);
                    if (user) {
                        const earnedPoints = Math.floor(order.totalAmount / 500);
                        user.loyaltyPoints += earnedPoints;
                        await user.save();

                        await this.notificationService.notifyUser(
                            String(user._id),
                            'Loyalty Points Granted',
                            `You earned ${earnedPoints} loyalty points for completing your order.`,
                            NotificationType.LOYALTY,
                            order._id,
                        );
                    }
                }
                updateData.deliveredAt = new Date();
            }
        }

        const updatedOrder = await this.orderModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .populate('user', 'name email loyaltyPoints')
            .populate('items.product', 'title price images')
            .exec();

        if (!updatedOrder) {
            throw new NotFoundException('Order not found after update');
        }

        return updatedOrder;
    }

    async delete(id: string): Promise<void> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid order ID');
        }

        const result = await this.orderModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException('Order not found');
        }
    }
}
