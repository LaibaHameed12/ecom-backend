import { IsBoolean, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSaleDto {
    @IsBoolean()
    isOnSale: boolean;

    @IsOptional()
    @IsEnum(['percent', 'flat'])
    discountType?: 'percent' | 'flat';

    @IsOptional()
    @IsNumber() @Min(0)
    discountValue?: number;

    @IsOptional() @Type(() => Date)
    startsAt?: Date;

    @IsOptional() @Type(() => Date)
    endsAt?: Date;
}
