import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CouponType } from '@prisma/client';

export class CreateCouponDto {
  @ApiProperty() @IsString() code: string;
  @ApiProperty({ enum: CouponType }) @IsEnum(CouponType) type: CouponType;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) value: number;
  @ApiProperty({ required: false }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minOrder?: number;
  @ApiProperty({ required: false }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) maxUses?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() expiresAt?: string;
}

export class UpdateCouponDto {
  @ApiProperty({ required: false }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) value?: number;
  @ApiProperty({ required: false }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minOrder?: number;
  @ApiProperty({ required: false }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) maxUses?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() expiresAt?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isActive?: boolean;
}
