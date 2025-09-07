import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter;

    constructor(private readonly configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.configService.get<string>('MAIL_USER'),
                pass: this.configService.get<string>('MAIL_PASS'),
            },
        });
    }

    async sendOtpEmail(email: string, otp: string) {
        try {
            await this.transporter.sendMail({
                from:this.configService.get<string>('MAIL_USER'),
                to: email,
                subject: 'Your OTP Code',
                text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
            });
            this.logger.log(`OTP sent to ${email}`);
        } catch (error) {
            this.logger.error('Error sending OTP email', error.stack);
            throw error;
        }
    }
}
