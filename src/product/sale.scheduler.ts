import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
// import { SalesGateway } from '../realtime/sales.gateway'; // optional

@Injectable()
export class ProductSaleScheduler {
    private readonly logger = new Logger(ProductSaleScheduler.name);

    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        // private salesGateway: SalesGateway, // optional
    ) { }

    // Run every minute
    @Cron(CronExpression.EVERY_MINUTE)
    async tick() {
        const now = new Date();

        // Start sales whose time has come (and not already active)
        const startRes = await this.productModel.updateMany(
            {
                'sale.isOnSale': false,
                'sale.startsAt': { $lte: now },
                $or: [
                    { 'sale.endsAt': { $exists: false } },
                    { 'sale.endsAt': { $gte: now } },
                ],
                'sale.discountType': { $exists: true },
                'sale.discountValue': { $exists: true },
            },
            { $set: { 'sale.isOnSale': true } },
        );

        // End sales past end time
        const endRes = await this.productModel.updateMany(
            { 'sale.isOnSale': true, 'sale.endsAt': { $lte: now } },
            { $set: { 'sale.isOnSale': false } },
        );

        if (startRes.modifiedCount || endRes.modifiedCount) {
            this.logger.log(`Sales started: ${startRes.modifiedCount}, ended: ${endRes.modifiedCount}`);
            // Optionally notify clients:
            // if (startRes.modifiedCount) this.salesGateway.broadcastSaleStarted();
            // if (endRes.modifiedCount) this.salesGateway.broadcastSaleEnded();
        }
    }
}
