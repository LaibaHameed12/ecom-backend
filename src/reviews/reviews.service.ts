// src/reviews/reviews.service.ts
import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { Order, OrderDocument, OrderStatus } from 'src/order/schemas/order.schema';
import { Product, ProductDocument } from 'src/product/schemas/product.schema';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    ) { }

    async create(userId: string, productId: string, dto: CreateReviewDto) {
        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestException('Invalid product ID');
        }
        if (!Types.ObjectId.isValid(dto.orderId)) {
            throw new BadRequestException('Invalid order ID');
        }

        // find delivered order that belongs to user (don't check product in DB query)
        const order = await this.orderModel.findOne({
            _id: new Types.ObjectId(dto.orderId),
            user: new Types.ObjectId(userId),
            status: OrderStatus.DELIVERED,
        });

        if (!order) {
            throw new ForbiddenException('You can only review products from delivered orders');
        }

        // check that the product is in the order
        const hasProduct = order.items.some(
            (item) => item.product.toString() === productId.toString(),
        );
        if (!hasProduct) {
            throw new ForbiddenException('This product is not part of the order');
        }

        // prevent duplicate review (best-effort check; unique index still enforces)
        const existing = await this.reviewModel.findOne({
            user: new Types.ObjectId(userId),
            product: new Types.ObjectId(productId),
            order: new Types.ObjectId(dto.orderId),
        });
        if (existing) {
            throw new BadRequestException('You already reviewed this product in this order');
        }

        // create review with proper ObjectId types
        const reviewDoc = new this.reviewModel({
            user: new Types.ObjectId(userId),
            product: new Types.ObjectId(productId),
            order: new Types.ObjectId(dto.orderId),
            rating: dto.rating,
            title: dto.title,
            comment: dto.comment,
        });

        try {
            const saved = await reviewDoc.save();
            // recalc ratings (same as before)
            await this.recalculateProductRating(productId);
            return saved;
        } catch (err: any) {
            // Mongo duplicate key
            if (err?.code === 11000) {
                throw new BadRequestException('You already reviewed this product in this order');
            }
            // something unexpected
            throw new InternalServerErrorException(err?.message || 'Failed to save review');
        }
    }

    async getReviews(productId: string) {
        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestException('Invalid product ID');
        }
        // flexible query (matches either string or ObjectId) — good if your DB still has string entries
        return this.reviewModel
            .find({
                product: { $in: [productId, new Types.ObjectId(productId)] },
            })
            .populate('user', 'fullName email')
            .sort({ createdAt: -1 })
            .exec();
    }

    async canReview(userId: string, productId: string) {
        if (!Types.ObjectId.isValid(productId)) {
            return { canReview: false, pendingOrders: [], hasPurchased: false };
        }

        // fetch all delivered orders for user
        const orders = await this.orderModel.find({
            user: new Types.ObjectId(userId),
            status: OrderStatus.DELIVERED,
        }).lean();

        // filter orders that actually contain this product (string/ObjectId tolerant)
        const relevantOrders = (orders || []).filter((o: any) =>
            (o.items || []).some((i: any) => i.product?.toString() === productId.toString()),
        );

        const hasPurchased = relevantOrders.length > 0;
        if (!hasPurchased) {
            return { canReview: false, pendingOrders: [], hasPurchased: false };
        }

        const orderIds = relevantOrders.map((o) => o._id);
        const reviewed = await this.reviewModel.find({
            user: new Types.ObjectId(userId),
            product: new Types.ObjectId(productId),
            order: { $in: orderIds },
        }).lean();

        const reviewedIds = (reviewed || []).map((r) => r.order.toString());
        const pendingOrders = relevantOrders.filter((o) => !reviewedIds.includes(o._id.toString()));

        return {
            canReview: pendingOrders.length > 0,
            pendingOrders: pendingOrders.map((o) => o._id.toString()),
            hasPurchased: true,
        };
    }

    private async recalculateProductRating(productId: string) {
        const stats = await this.reviewModel.aggregate([
            { $match: { product: new Types.ObjectId(productId) } },
            {
                $group: {
                    _id: null,
                    avg: { $avg: '$rating' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const avg = stats[0]?.avg ?? 0;
        const count = stats[0]?.count ?? 0;
        await this.productModel.findByIdAndUpdate(productId, {
            averageRating: avg,
            ratingCount: count,
        });
    }

    // src/reviews/reviews.service.ts

    async getAllReviews(limit = 20) {
        return this.reviewModel
            .find()
            .populate('user', 'fullName email')
            .populate('product', 'title images')
            .sort({ createdAt: -1 })
            .limit(limit) // optional limit so you don’t fetch thousands at once
            .exec();
    }

}
