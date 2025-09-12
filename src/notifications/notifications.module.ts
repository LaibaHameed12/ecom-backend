import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { NotificationsService } from './notifications.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationsController } from './notifications.controller.spec';
import { SalesGateway } from 'src/product/realtime/sales.gateway';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
  forwardRef(() => AuthModule)],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationGateway, SalesGateway],
  exports: [NotificationsService, NotificationGateway, SalesGateway],
})
export class NotificationsModule { }
