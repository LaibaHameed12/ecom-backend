import {
    ArrayNotEmpty,
    IsArray,
    IsBoolean,
    IsDate,
    IsIn,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import * as productConstants from './../constants/product.constants';
import {
    toArray,
    toBoolean,
    toDateOrUndefined,
    toNumberOrUndefined,
} from './transforms';

export class SaleDto {
    @IsOptional()
    @IsBoolean()
    @Transform(toBoolean)
    isOnSale?: boolean;

    @IsOptional()
    @IsIn(productConstants.DISCOUNT_TYPES)
    discountType?: productConstants.DiscountType;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Transform(toNumberOrUndefined)
    discountValue?: number;

    @IsOptional()
    @IsDate()
    @Transform(toDateOrUndefined)
    startsAt?: Date;

    @IsOptional()
    @IsDate()
    @Transform(toDateOrUndefined)
    endsAt?: Date;
}

export class VariantDto {
    @IsIn(productConstants.SIZES)
    size: productConstants.Sizes;

    @IsIn(productConstants.COLORS)
    color: productConstants.Colors;

    @IsNumber()
    @Min(0)
    @Transform(toNumberOrUndefined)
    stock: number;
}

export class CreateProductDto {
    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(5)
    @Transform(toNumberOrUndefined)
    averageRating?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Transform(toNumberOrUndefined)
    ratingCount?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    @IsNumber()
    @Min(0)
    @Transform(toNumberOrUndefined)
    price: number;

    @IsArray()
    @Transform(toArray)
    @IsIn(productConstants.PURCHASE_TYPES, { each: true })
    purchaseType: productConstants.PurchaseType[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Transform(toNumberOrUndefined)
    pointsPrice?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => SaleDto)
    sale?: SaleDto;

    @IsArray()
    @Transform(toArray)
    @IsIn(productConstants.DRESS_STYLES, { each: true })
    dressStyle: productConstants.DressStyle[];

    @IsArray()
    @Transform(toArray)
    @IsIn(productConstants.GARMENTS, { each: true })
    categories: productConstants.Garment[];

    @IsArray()
    @ArrayNotEmpty()
    @Transform(({ value }) => {
        // console.log("Raw variants value:", value, typeof value);
        
        // If it's already an array of objects, return as is
        if (Array.isArray(value)) {
            // console.log("Variants is already an array:", value);
            return value;
        }
        
        // If it's a string, try to parse it
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                // console.log("Parsed variants from string:", parsed);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch (error) {
                // console.error("JSON parse error:", error);
                return [];
            }
        }
        
        // If it's a single object, wrap it in an array
        if (value && typeof value === 'object') {
            // console.log("Converting single object to array:", value);
            return [value];
        }
        
        // console.log("Returning empty array for variants");
        return [];
    })
    @Type(() => VariantDto)
    variants: VariantDto[];
}