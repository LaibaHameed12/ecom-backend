import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryProductDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    minPrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    maxPrice?: number;

    @IsOptional()
    @IsArray()
    @IsEnum(['t-shirt', 'shorts', 'hoodie', 'shirt', 'jeans'], { each: true })
    @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
    categories?: string[];

    @IsOptional()
    @IsArray()
    @IsEnum(['casual', 'party', 'gym', 'formal'], { each: true })
    @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
    dressStyle?: string[];

    @IsOptional()
    @IsArray()
    @IsEnum([ 'small', 'medium', 'large'], { each: true })
    @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
    sizes?: string[];

    @IsOptional()
    @IsArray()
    @IsEnum(['green','white', 'black'], { each: true })
    @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
    colors?: string[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(5)
    @Type(() => Number)
    minRating?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';
}