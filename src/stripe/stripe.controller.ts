// src/stripe/stripe.controller.ts
import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
type RawBodyRequest = Request & { rawBody: Buffer };

// stripe.controller.ts
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) { }

  @UseGuards(JwtAuthGuard)
  @Post('create-checkout-session')
  async createCheckoutSession(@Req() req, @Body() body: { items: any[], shippingAddress?: string }) {
    const userId = req.user?.sub || req.user?._id;
    return this.stripeService.createCheckoutSession(userId, body.items, body.shippingAddress);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('No raw body provided');
    }
    return this.stripeService.handleWebhook(req.rawBody, signature);
  }
}

