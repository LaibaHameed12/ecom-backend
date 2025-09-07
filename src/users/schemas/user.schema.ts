import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    fullName: string;

    @Prop({ required: true, unique: true, lowercase: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ type: [String], enum: ['user', 'admin', 'superadmin'], default: ['user'] })
    roles: string[];

    @Prop({ default: 0, min: 0 })
    loyaltyPoints: number;

    @Prop({ default: true })
    isActive: boolean;

    // 🔑 New fields for OTP verification
    @Prop({ default: false })
    isVerified: boolean;

    @Prop()
    otpCode?: string;

    @Prop()
    otpExpiresAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
