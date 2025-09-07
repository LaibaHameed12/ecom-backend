import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from 'src/product/schemas/product.schema';
import { User } from 'src/users/schemas/user.schema';

export type OrderDocument = Order & Document;

export enum OrderStatus {
    PENDING = 'pending',
    PAID = 'paid',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
}

@Schema({ _id: false })
class OrderItem {
    @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
    product: Types.ObjectId;

    @Prop({ required: true })
    size: string;

    @Prop({ required: true })
    color: string;

    @Prop({ type: Number, required: true, min: 1 })
    quantity: number;

    @Prop({ type: Number, required: true, min: 0 })
    price: number; // snapshot price

    @Prop({ type: Number, required: false, min: 0 })
    pointsUsed?: number; // if purchased with points
}

@Schema({ _id: false })
class OrderStatusHistory {
    @Prop({
        type: String,
        enum: Object.values(OrderStatus),
        required: true,
    })
    status: OrderStatus;

    @Prop({ type: Date, default: Date.now })
    changedAt: Date;

    @Prop({ type: String, required: false })
    image?: string; // e.g. proof of delivery, invoice screenshot
}

@Schema({ timestamps: true })
export class Order {
    _id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    user: Types.ObjectId;

    @Prop({ type: [OrderItem], required: true })
    items: OrderItem[];

    @Prop({ type: Number, required: true, min: 0 })
    totalAmount: number;

    @Prop({ type: Number, default: 0, min: 0 })
    totalPointsUsed: number;

    @Prop({
        type: String,
        enum: Object.values(OrderStatus),
        default: OrderStatus.PENDING,
    })
    status: OrderStatus;

    @Prop({ type: [OrderStatusHistory], default: [] })
    statusHistory: OrderStatusHistory[];

    @Prop({ type: String, required: false })
    shippingAddress?: string;

    @Prop({ type: String, required: false })
    paymentMethod?: string; // "card", "paypal", "points", "hybrid"

    @Prop({ type: String, required: false })
    paymentIntentId?: string; // Stripe payment ID

    @Prop({ type: Date, required: false })
    deliveredAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
