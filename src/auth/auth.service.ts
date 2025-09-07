import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { generateOtp, getOtpExpiry } from '../utils/otp.util';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private jwtService: JwtService,
        private configService: ConfigService,
        private mailService: MailService,
    ) { }

    // Validate user credentials for login
    async validateUser(email: string, password: string): Promise<UserDocument | null> {
        const user = await this.userModel.findOne({ email });
        if (!user) return null;

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return null;

        return user;
    }

    // Login and return access/refresh tokens
    async login(user: UserDocument) {
        if (!user.isVerified) {
            throw new UnauthorizedException('Please verify your email before logging in');
        }

        const payload = { sub: user._id, roles: user.roles };

        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15d'),
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
        });

        return { accessToken, refreshToken, user };
    }

    // Register new user (with OTP generation)
    async register(fullName: string, email: string, password: string) {
        const existing = await this.userModel.findOne({ email });
        if (existing) {
            throw new BadRequestException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const otp = generateOtp();
        const otpExpiry = getOtpExpiry(5);

        const user = new this.userModel({
            fullName,
            email,
            password: hashedPassword,
            roles: ['user'],
            loyaltyPoints: 0,
            isVerified: false,
            otpCode: otp,
            otpExpiresAt: otpExpiry,
        });

        await user.save();

        // send OTP email
        await this.mailService.sendOtpEmail(email, otp);

        return { message: 'User registered. Please verify OTP sent to email.' };
    }

    // Verify OTP
    async verifyOtp(email: string, otp: string) {
        const user = await this.userModel.findOne({ email });
        if (!user) throw new NotFoundException('User not found');

        if (user.isVerified) {
            return { message: 'User already verified' };
        }

        if (!user.otpCode || !user.otpExpiresAt) {
            throw new BadRequestException('No OTP found. Please request a new one.');
        }

        if (new Date() > user.otpExpiresAt) {
            throw new BadRequestException('OTP expired. Please request a new one.');
        }

        if (user.otpCode !== otp) {
            throw new BadRequestException('Invalid OTP');
        }

        user.isVerified = true;
        user.otpCode = undefined;
        user.otpExpiresAt = undefined;
        await user.save();

        return { message: 'Email verified successfully' };
    }

    // Resend OTP
    async resendOtp(email: string) {
        const user = await this.userModel.findOne({ email });
        if (!user) throw new NotFoundException('User not found');

        if (user.isVerified) {
            return { message: 'User already verified' };
        }

        const otp = generateOtp();
        const otpExpiry = getOtpExpiry(5);

        user.otpCode = otp;
        user.otpExpiresAt = otpExpiry;
        await user.save();

        await this.mailService.sendOtpEmail(email, otp);

        return { message: 'New OTP sent to email' };
    }
}
