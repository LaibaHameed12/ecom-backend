import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

export type PurchaseType = 'money' | 'points' | 'hybrid';
export type DiscountType = 'percent' | 'flat';
export type DressStyle = 'casual' | 'party' | 'gym' | 'formal';
export type Sizes = 'small' | 'medium' | 'large';
export type Colors = 'green' | 'white' | 'black';
export type Garment = 't-shirt' | 'shorts' | 'hoodie' | 'shirt' | 'jeans';

@Schema({ _id: false })
class Sale {
    @Prop({ default: false })
    isOnSale: boolean;

    @Prop({ enum: ['percent', 'flat'], required: false })
    discountType?: DiscountType;

    @Prop({ type: Number, required: false, min: 0 })
    discountValue?: number;

    @Prop({ type: Date, required: false })
    startsAt?: Date;

    @Prop({ type: Date, required: false })
    endsAt?: Date;
}

@Schema({ _id: false })
export class Variant {
    @Prop({ enum: ['small', 'medium', 'large'], required: true })
    size: Sizes;

    @Prop({ enum: ['green', 'white', 'black'], required: true })
    color: Colors;

    @Prop({ type: Number, required: true, min: 0 })
    stock: number;
}

@Schema({
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})
export class Product {
    _id: Types.ObjectId;

    @Prop({ required: true, trim: true , unique: true})
    title: string;

    @Prop({ required: true, trim: true })
    description: string;

    @Prop({ type: [Variant], default: [] })
    variants: Variant[];

    @Prop({ type: Number, default: 0, min: 0, max: 5 })
    averageRating: number;

    @Prop({ type: Number, default: 0, min: 0 })
    ratingCount: number;

    @Prop({ type: [String], default: [] })
    images: string[];

    @Prop({ type: Number, required: true, min: 0 })
    price: number;

    @Prop({ type: [String], required: true })
    purchaseType: PurchaseType[];

    @Prop({ type: Number, required: false, min: 0 })
    pointsPrice?: number;

    @Prop({ type: Sale, default: {} })
    sale: Sale;

    @Prop({ type: [String], required: true })
    dressStyle: DressStyle[];

    @Prop({ type: [String], required: true })
    categories: Garment[];

    effectivePrice?: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ title: 'text', description: 'text', categories: 'text' });
ProductSchema.index({ price: 1, dressStyle: 1 });
