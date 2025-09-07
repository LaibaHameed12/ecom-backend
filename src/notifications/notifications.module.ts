import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { NotificationsService } from './notifications.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationsController } from './notifications.controller.spec';

@Module({
  imports: [MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }])],
  providers: [NotificationsService, NotificationGateway],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule { }
