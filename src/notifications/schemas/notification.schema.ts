import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
    SALE = 'sale',
    LOYALTY = 'loyalty',
    ORDER = 'order',
    ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class Notification {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    message: string;

    @Prop({ enum: NotificationType, required: true })
    type: NotificationType;

    @Prop({ type: Types.ObjectId, ref: User.name, required: false })
    user?: Types.ObjectId; // null for broadcast

    @Prop({ type: Types.ObjectId, required: false })
    relatedEntity?: Types.ObjectId; // Sale, Order, LoyaltyTransaction

    @Prop({ default: false })
    read: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
