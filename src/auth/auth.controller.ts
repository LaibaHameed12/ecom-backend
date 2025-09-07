import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.fullName, dto.email, dto.password);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.authService.login(user);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Req() req: any) {
    return this.authService.login(req.user);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: { email: string; otp: string }) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }

  @Post('resend-otp')
  async resendOtp(@Body() dto: { email: string }) {
    return this.authService.resendOtp(dto.email);
  }
}
