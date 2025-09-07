// src/reviews/dto/create-review.dto.ts
import { IsInt, Min, Max, IsOptional, IsString, IsMongoId } from 'class-validator';

export class CreateReviewDto {
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    comment?: string;

    @IsMongoId()
    orderId: string;
}
