// src/reviews/reviews.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('products/:productId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async getReviews(@Param('productId') productId: string) {
    return this.reviewsService.getReviews(productId);
  }

  @Get('/can-review')
  @UseGuards(JwtAuthGuard)
  async canReview(@Request() req, @Param('productId') productId: string) {
    return this.reviewsService.canReview(req.user.sub, productId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Request() req,
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(req.user.sub, productId, dto);
  }
}

@Controller('reviews')
export class ReviewsRootController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async getAll(@Query('limit') limit?: string) {
    const parsed = parseInt(limit || '20', 10);
    return this.reviewsService.getAllReviews(parsed);
  }
}