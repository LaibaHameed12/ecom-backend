import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { ProductSaleScheduler } from './sale.scheduler';
import { UploadModule } from 'src/upload/upload.module';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { SalesGateway } from './realtime/sales.gateway';

@Module({
  imports: [MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]), UploadModule, NotificationsModule],
  controllers: [ProductController],
  providers: [ProductService, CloudinaryService, ProductSaleScheduler, SalesGateway],
  exports: [ProductService],
})
export class ProductModule { }
