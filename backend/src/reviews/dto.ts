import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ required: false, description: 'Exactly one of productId, boutiqueId or serviceProviderId must be set' })
  @IsOptional() @IsString() productId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() boutiqueId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() serviceProviderId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() orderId?: string;
  @ApiProperty({ minimum: 1, maximum: 5 }) @Type(() => Number) @IsInt() @Min(1) @Max(5) rating: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() comment?: string;
}

export class UpdateReviewDto {
  @ApiProperty({ required: false, minimum: 1, maximum: 5 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) rating?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() comment?: string;
}
