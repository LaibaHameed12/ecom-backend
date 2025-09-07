import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { QueryProductDto } from './dto/query-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { SalesGateway } from './realtime/sales.gateway';

@Injectable()
export class ProductService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        private readonly notificationService: NotificationsService,
        private readonly salesGateway: SalesGateway,
    ) { }

    async create(createProductDto: CreateProductDto): Promise<Product> {
        try {
            if (!createProductDto.images || createProductDto.images.length === 0) {
                throw new BadRequestException('At least one image is required');
            }
            const pointsPrice = Math.ceil(createProductDto.price / 250);
            const createdProduct = new this.productModel({ ...createProductDto, pointsPrice });
            return await createdProduct.save();
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(error.message);
        }
    }

    async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid product ID');
        }

        // If images are being updated, validate they're not empty
        if (updateProductDto.images !== undefined) {
            if (updateProductDto.images.length === 0) {
                throw new BadRequestException('At least one image is required');
            }
        }

        const updateData: any = { ...updateProductDto };
        if (updateProductDto.price !== undefined) {
            updateData.pointsPrice = Math.ceil(updateProductDto.price / 250);
        }

        const product = await this.productModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .exec();

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return product;
    }

    async findAll(query: QueryProductDto): Promise<{
        products: Product[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const {
            search,
            minPrice,
            maxPrice,
            categories,
            dressStyle,
            sizes,
            colors,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = query;

        const filter: any = {};

        // ✅ Text search
        if (search) {
            filter.$text = { $search: search };
        }

        // ✅ Price range
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined) filter.price.$gte = minPrice;
            if (maxPrice !== undefined) filter.price.$lte = maxPrice;
        }

        // ✅ Category filter
        if (categories && categories.length > 0) {
            filter.categories = { $in: categories };
        }

        // ✅ Dress style
        if (dressStyle && dressStyle.length > 0) {
            filter.dressStyle = { $in: dressStyle };
        }

        // ✅ Sizes inside variants
        if (sizes && sizes.length > 0) {
            filter['variants.size'] = { $in: sizes };
        }

        // ✅ Colors inside variants
        if (colors && colors.length > 0) {
            filter['variants.color'] = { $in: colors };
        }

        const skip = (page - 1) * limit;

        // ✅ Sorting
        const sortOptions: Record<string, 1 | -1> = {};
        const sortFields = sortBy.split(',');
        const sortOrders = sortOrder.split(',');

        sortFields.forEach((field, index) => {
            const order = sortOrders[index] || 'desc';
            sortOptions[field.trim()] = order === 'desc' ? -1 : 1;
        });

        if (Object.keys(sortOptions).length === 0) {
            sortOptions['createdAt'] = -1;
        }

        // ✅ Query products
        const [products, total] = await Promise.all([
            this.productModel.find(filter).sort(sortOptions).skip(skip).limit(limit).exec(),
            this.productModel.countDocuments(filter).exec(),
        ]);

        return {
            products,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findById(id: string): Promise<Product> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid product ID');
        }

        const product = await this.productModel.findById(id).exec();
        if (!product) {
            throw new NotFoundException('Product not found');
        }
        return product;
    }

    async delete(id: string): Promise<void> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid product ID');
        }

        const result = await this.productModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException('Product not found');
        }
    }

    async findRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestException('Invalid product ID');
        }

        const product = await this.productModel.findById(productId).exec();
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return this.productModel
            .find({
                _id: { $ne: productId },
                $or: [
                    { categories: { $in: product.categories } },
                    { dressStyle: { $in: product.dressStyle } },
                ],
            })
            .limit(limit)
            .exec();
    }

    async setSale(id: string, saleData: any): Promise<Product> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid product ID');
        }

        const product = await this.productModel.findById(id).exec();
        if (!product) throw new NotFoundException('Product not found');

        product.sale = { isOnSale: true, ...saleData };
        await product.save();

        // 🔔 Notify all users that sale is live
        this.notificationService.notifyAll(
            'Sale Live!',
            `${product.title} is now on sale!`,
            product._id,
        );
        this.salesGateway.broadcastSaleStarted();
        
        return product;
    }

    async removeSale(id: string): Promise<Product> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid product ID');
        }

        const product = await this.productModel.findById(id).exec();
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        product.sale = {
            isOnSale: false,
            discountType: undefined,
            discountValue: undefined,
            startsAt: undefined,
            endsAt: undefined,
        };

        return await product.save();
    }

    async getProductsByIds(ids: string[]): Promise<Product[]> {
        const objectIds = ids.map(id => new Types.ObjectId(id));
        return this.productModel.find({ _id: { $in: objectIds } }).exec();
    }

    async updateVariantStock(
        productId: string,
        size: string,
        color: string,
        quantity: number,
    ): Promise<Product> {
        if (!Types.ObjectId.isValid(productId)) {
            throw new BadRequestException('Invalid product ID');
        }

        const product = await this.productModel.findById(productId).exec();
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        // Find the variant
        const variant = product.variants.find(
            (v) => v.size === size && v.color === color,
        );

        if (!variant) {
            throw new NotFoundException(
                `Variant with size "${size}" and color "${color}" not found`,
            );
        }

        if (variant.stock < quantity) {
            throw new BadRequestException('Insufficient stock for this variant');
        }

        variant.stock -= quantity;

        await product.save();
        return product;
    }

}