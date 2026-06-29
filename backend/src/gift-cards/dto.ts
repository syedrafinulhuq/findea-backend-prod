import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEmail, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { GiftCardStatus } from '@prisma/client';

export class PurchaseGiftCardDto {
  @ApiProperty({ description: 'Face value of the gift card' }) @Type(() => Number) @IsNumber() @Min(1) amount: number;
  @ApiPropertyOptional() @IsOptional() @IsString() senderName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() recipientName?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() recipientEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() message?: string;
  @ApiPropertyOptional({ description: 'ISO expiry date' }) @IsOptional() @IsDateString() expiresAt?: string;
}

export class RedeemGiftCardDto {
  @ApiProperty() @IsString() code: string;
  @ApiProperty({ description: 'Amount to deduct from the card balance' }) @Type(() => Number) @IsNumber() @Min(0.01) amount: number;
  @ApiPropertyOptional() @IsOptional() @IsString() orderId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class GiftCardQueryDto {
  @ApiPropertyOptional({ enum: GiftCardStatus }) @IsOptional() @IsEnum(GiftCardStatus) status?: GiftCardStatus;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 20;
}
