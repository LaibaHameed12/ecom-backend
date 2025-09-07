import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const cloudName = configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('❌ Cloudinary ENV variables are missing!');
    } else {
      console.log('✅ Cloudinary config loaded:', {
        cloud_name: cloudName,
        api_key: apiKey,
      });
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    return cloudinary;
  },
};
