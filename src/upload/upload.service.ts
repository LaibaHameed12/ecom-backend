import { Inject, Injectable } from '@nestjs/common';
import { v2 as Cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class UploadService {
    constructor(@Inject('CLOUDINARY') private cloudinary: typeof Cloudinary) { }

    async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = this.cloudinary.uploader.upload_stream(
                { folder: 'Garments' },
                (error, result) => {
                    if (error) return reject(error);
                    if (!result) return reject(new Error('Cloudinary upload failed'));
                    resolve(result);
                },
            );
            uploadStream.end(file.buffer);
        });
    }
}
