import { forwardRef, Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ProductModule } from 'src/product/product.module';
import { StripeModule } from 'src/stripe/stripe.module';

@Module({
  imports: [
    NotificationsModule,
    ProductModule,
    forwardRef(() => StripeModule),
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService, MongooseModule],
})
export class OrderModule { }
