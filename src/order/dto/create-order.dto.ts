import {
    IsArray,
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../schemas/order.schema';

class CreateOrderItemDto {
    @IsMongoId()
    @IsNotEmpty()
    product: string;

    @IsString()
    @IsNotEmpty()
    size: string;

    @IsString()
    @IsNotEmpty()
    color: string;

    @IsNumber()
    @IsPositive()
    quantity: number;

    @IsNumber()
    @Min(0)
    price: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    pointsUsed?: number;
}

export class CreateOrderDto {
    // user is taken from request.user (auth guard), not from client
    // so we don't expose it in DTO

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];

    // totalAmount should be computed on backend
    // so we don’t trust client input
    @IsOptional()
    @IsNumber()
    @Min(0)
    totalAmount?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    totalPointsUsed?: number;

    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @IsOptional()
    @IsString()
    shippingAddress: string;

    @IsOptional()
    @IsString()
    paymentMethod: string; 

    @IsOptional()
    @IsString()
    paymentIntentId?: string;
}
