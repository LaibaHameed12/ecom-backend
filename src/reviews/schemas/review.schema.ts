// src/reviews/schemas/review.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Order } from 'src/order/schemas/order.schema';
import { Product } from 'src/product/schemas/product.schema';
import { User } from 'src/users/schemas/user.schema';


export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
    @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
    product: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: Order.name, required: true })
    order: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    user: Types.ObjectId;

    @Prop({ required: true, min: 1, max: 5 })
    rating: number;

    @Prop()
    title?: string;

    @Prop()
    comment?: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true }); // enforce one review per order-product
