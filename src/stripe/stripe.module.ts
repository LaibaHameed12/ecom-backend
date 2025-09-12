import { Module, forwardRef } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { ProductModule } from '../product/product.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrderModule } from 'src/order/order.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from 'src/order/schemas/order.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';

@Module({
  imports: [
    forwardRef(() => OrderModule),
    ProductModule,                
    UsersModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule { }
