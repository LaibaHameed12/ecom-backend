import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from './schemas/review.schema';
import { ReviewsService } from './reviews.service';
import { ReviewsController, ReviewsRootController } from './reviews.controller';
import { Product, ProductSchema } from 'src/product/schemas/product.schema';
import { Order, OrderSchema } from 'src/order/schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  providers: [ReviewsService],
  controllers: [ReviewsController, ReviewsRootController],
})
export class ReviewsModule {}
