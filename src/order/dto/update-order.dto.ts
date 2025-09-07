// import { IsEnum, IsOptional } from 'class-validator';
// import { OrderStatus } from '../schemas/order.schema';

import { PartialType } from "@nestjs/mapped-types";
import { CreateOrderDto } from "./create-order.dto";

// export class UpdateOrderDto {
//     @IsOptional()
//     @IsEnum(OrderStatus)
//     status?: OrderStatus;
// }

export class UpdateOrderDto extends PartialType(CreateOrderDto) {}