import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from './schemas/notification.schema';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
        private readonly gateway: NotificationGateway,
    ) { }

    // Broadcast to all users (e.g., sale live)
    async notifyAll(title: string, message: string, relatedEntity?: Types.ObjectId) {
        const notification = await this.notificationModel.create({
            title,
            message,
            type: NotificationType.SALE,
            relatedEntity,
        });
        this.gateway.server.emit('notification', notification);
        return notification;
    }

    // Notify specific user (e.g., loyalty points, order updates)
    async notifyUser(userId: string, title: string, message: string, type: NotificationType, relatedEntity?: Types.ObjectId) {
        const notification = await this.notificationModel.create({
            user: userId,
            title,
            message,
            type,
            relatedEntity,
        });
        this.gateway.server.to(userId).emit('notification', notification);
        return notification;
    }

    async markAsRead(notificationId: string) {
        return this.notificationModel.findByIdAndUpdate(notificationId, { read: true }, { new: true });
    }

    async getUserNotifications(userId: string) {
        return this.notificationModel.find({ user: userId }).sort({ createdAt: -1 }).exec();
    }
}
