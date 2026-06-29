import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';
import { BoutiqueStatus } from '@prisma/client';

export class CreateBoutiqueDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() logoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() bannerUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
}

export class UpdateBoutiqueDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() logoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() bannerUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
}

export class UpdateBoutiqueStatusDto {
  @ApiProperty({ enum: BoutiqueStatus }) @IsEnum(BoutiqueStatus) status: BoutiqueStatus;
  @ApiPropertyOptional({ description: 'Commission rate percentage (0–100), applied on approval' })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100) commissionRate?: number;
}

export class BoutiqueQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
}

export class AdminBoutiqueQueryDto extends BoutiqueQueryDto {
  @ApiPropertyOptional({ enum: BoutiqueStatus }) @IsOptional() @IsEnum(BoutiqueStatus) status?: BoutiqueStatus;
}

export class CreateBoutiqueProductDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) price: number;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) stock?: number;
  @ApiPropertyOptional() @IsOptional() @IsUrl() imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() brand?: string;
}

export class UpdateBoutiqueProductDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) price?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) stock?: number;
  @ApiPropertyOptional() @IsOptional() @IsUrl() imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() brand?: string;
}
