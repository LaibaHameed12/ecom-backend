import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrderService } from './order.service';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post()
  async create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(req.user.sub, createOrderDto);
  }

  @Get()
  async findAll(@Request() req) {
    return this.orderService.findAll(req.user);
  }

  /**
   * Get single order by ID
   * - Admins can see all
   * - Normal users can only see their own
   */
  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.orderService.findById(req.user, id);
  }

  @Roles('admin', 'superadmin')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    console.log("updateOrderDto::::", updateOrderDto)
    return this.orderService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @Roles('admin', 'superadmin')
  async remove(@Param('id') id: string) {
    return this.orderService.delete(id);
  }
}
