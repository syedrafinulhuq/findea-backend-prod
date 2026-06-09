import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';
import { ProductType } from '@prisma/client';

export class ProductQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() brand?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;

  @ApiPropertyOptional({ enum: ProductType, description: 'Filter by entity type' })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @ApiPropertyOptional({ description: 'Inclusive minimum price' })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number;

  @ApiPropertyOptional({ description: 'Inclusive maximum price' })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number;

  @ApiPropertyOptional({ description: 'Minimum average review rating (1–5)' })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(5) minRating?: number;

  @ApiPropertyOptional({ description: 'When true, only products with stock > 0' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  inStock?: boolean;

  @ApiPropertyOptional({ description: 'When true, only booked/reserved items' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  booked?: boolean;

  @ApiPropertyOptional({ enum: ['price_asc', 'price_desc', 'newest', 'popular', 'rating_desc'] })
  @IsOptional()
  @IsEnum(['price_asc', 'price_desc', 'newest', 'popular', 'rating_desc'])
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'rating_desc';

  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
}

export class CreateProductDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() slug: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() brand?: string;
  @ApiPropertyOptional({ enum: ProductType }) @IsOptional() @IsEnum(ProductType) type?: ProductType;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isBooked?: boolean;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) price: number;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) stock: number;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateProductDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() brand?: string;
  @ApiPropertyOptional({ enum: ProductType }) @IsOptional() @IsEnum(ProductType) type?: ProductType;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isBooked?: boolean;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) price?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) stock?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateCategoryDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() slug: string;
}

export class AddProductImageDto {
  @ApiProperty() @IsUrl() url: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
}
