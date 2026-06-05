import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty() @IsString() productId: string;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) quantity: number;
}
