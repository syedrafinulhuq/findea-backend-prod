import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEmail, IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';
import { RegistryType } from '@prisma/client';

export class CreateRegistryDto {
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional({ enum: RegistryType }) @IsOptional() @IsEnum(RegistryType) type?: RegistryType;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() coverImageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() eventDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shippingLine1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shippingCity?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shippingCountry?: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() isPublic?: boolean;
}

export class UpdateRegistryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional({ enum: RegistryType }) @IsOptional() @IsEnum(RegistryType) type?: RegistryType;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() coverImageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() eventDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shippingLine1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shippingCity?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shippingCountry?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublic?: boolean;
}

export class AddRegistryItemDto {
  @ApiProperty() @IsString() productId: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) desiredQty?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class UpdateRegistryItemDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) desiredQty?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class ReserveItemDto {
  @ApiProperty() @IsString() registryItemId: string;
  @ApiProperty() @IsString() guestName: string;
  @ApiProperty() @IsEmail() guestEmail: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) quantity?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() message?: string;
}

export class RegistryQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: RegistryType }) @IsOptional() @IsEnum(RegistryType) type?: RegistryType;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
}
