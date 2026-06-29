import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEmail, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';
import { BookingStatus, BoutiqueStatus } from '@prisma/client';

// ---- provider profile ----

export class CreateProviderDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bio?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() logoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() bannerUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
}

export class UpdateProviderDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bio?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() logoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() bannerUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
}

export class UpdateProviderStatusDto {
  @ApiProperty({ enum: BoutiqueStatus }) @IsEnum(BoutiqueStatus) status: BoutiqueStatus;
  @ApiPropertyOptional({ description: 'Commission rate percentage (0–100), applied on approval' })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100) commissionRate?: number;
}

// ---- categories ----

export class CreateServiceCategoryDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() slug: string;
}

// ---- services ----

export class CreateServiceDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) price: number;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) durationMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsUrl() imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
}

export class UpdateServiceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) price?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) durationMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsUrl() imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
}

// ---- queries ----

export class ServiceQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ description: 'Service category slug' }) @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number;
  @ApiPropertyOptional({ enum: ['price_asc', 'price_desc', 'newest', 'rating_desc'] })
  @IsOptional() @IsEnum(['price_asc', 'price_desc', 'newest', 'rating_desc'])
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating_desc';
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
}

export class ProviderQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
}

export class AdminProviderQueryDto extends ProviderQueryDto {
  @ApiPropertyOptional({ enum: BoutiqueStatus }) @IsOptional() @IsEnum(BoutiqueStatus) status?: BoutiqueStatus;
}

// ---- bookings ----

export class CreateBookingDto {
  @ApiProperty() @IsString() serviceId: string;
  @ApiProperty({ description: 'ISO date-time of the requested slot' }) @IsDateString() scheduledAt: string;
  @ApiProperty() @IsString() customerName: string;
  @ApiProperty() @IsEmail() customerEmail: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus }) @IsEnum(BookingStatus) status: BookingStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() cancelReason?: string;
}
