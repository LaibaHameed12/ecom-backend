import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);

    constructor(private readonly configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
        });
    }

    async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'nestjs_uploads' }, // customize folder if needed
                (error, result) => {
                    if (error) {
                        this.logger.error('Cloudinary upload failed', error);
                        reject(error);
                    } else {
                        resolve(result as UploadApiResponse);
                    }
                },
            );

            Readable.from(file.buffer).pipe(uploadStream);
        });
    }

    async deleteFile(publicId: string): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId);
            this.logger.log(`Deleted file with publicId: ${publicId}`);
        } catch (error) {
            this.logger.error(`Failed to delete file ${publicId}`, error);
            throw error;
        }
    }
}
