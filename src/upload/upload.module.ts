import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryProvider } from 'src/cloudinary.config';

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [UploadService, CloudinaryProvider],
  exports: [UploadService, CloudinaryProvider]
})
export class UploadModule {}
