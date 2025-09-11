import { UploadService } from './../upload/upload.service';
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  UploadedFiles,
  Patch,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { QueryProductDto } from './dto/query-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Product } from './schemas/product.schema';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly UploadService: UploadService
  ) { }

  // Get all products with optional filtering
  @Get()
  async getProducts(@Query() query: QueryProductDto) {
    return this.productService.findAll(query);
  }

  // Get single product by ID
  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  // Get related products
  @Get(':id/related')
  async getRelatedProducts(
    @Param('id') id: string,
    @Query('limit') limit: number = 4,
  ) {
    return this.productService.findRelatedProducts(id, limit);
  }

  // Admin endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Post()
  @UseInterceptors(
    FilesInterceptor('images'),
  )
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<Product> {

    // console.log(createProductDto);
    let imageUrls: string[] = [];

    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    if (files && files.length > 0) {
      const uploads = await Promise.all(
        files.map(file => this.UploadService.uploadFile(file))
      );
      imageUrls = uploads.map(upload => upload.secure_url);
    }

    const productData = {
      ...createProductDto,
      images: imageUrls,
    };

    // console.log("productData::::::", productData);

    return this.productService.create(productData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('images'),
  )
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<Product> {

    let imageUrls: string[] = [];

    if (files && files.length > 0) {
      const uploads = await Promise.all(
        files.map(file => this.UploadService.uploadFile(file))
      );
      imageUrls = uploads.map(upload => upload.secure_url);
    }

    const productData = {
      ...updateProductDto,
      ...(files && files.length > 0 && { images: imageUrls }),
    };

    return this.productService.update(id, productData);
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    return this.productService.delete(id);
  }

  // Admin sales management
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Post(':id/sale')
  async setProductSale(
    @Param('id') id: string,
    @Body() saleData: any,
  ) {
    return this.productService.setSale(id, saleData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Delete(':id/sale')
  async removeProductSale(@Param('id') id: string) {
    return this.productService.removeSale(id);
  }
}