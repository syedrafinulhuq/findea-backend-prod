import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsEnum, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { DeliveryMethod, OrderStatus, PaymentMethod } from '@prisma/client';

class OrderItemDto {
  @ApiProperty() @IsString() productId: string;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) quantity: number;
}

export class CreateOrderDto {
  @ApiProperty() @IsEmail() customerEmail: string;
  @ApiProperty() @IsString() customerName: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() customerPhone?: string;
  @ApiProperty() @IsString() shippingLine1: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() shippingLine2?: string;
  @ApiProperty() @IsString() shippingCity: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() shippingState?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() shippingCountry?: string;
  @ApiProperty({ required: false, enum: DeliveryMethod }) @IsOptional() @IsEnum(DeliveryMethod) deliveryMethod?: DeliveryMethod;
  @ApiProperty({ required: false }) @IsOptional() @IsString() deliveryNotes?: string;
  @ApiProperty({ required: false, enum: PaymentMethod }) @IsOptional() @IsEnum(PaymentMethod) paymentMethod?: PaymentMethod;
  @ApiProperty({ required: false }) @IsOptional() @IsString() couponCode?: string;
  @ApiProperty({ type: [OrderItemDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemDto) items: OrderItemDto[];
}

export class CancelOrderDto { @ApiProperty() @IsString() reason: string; }

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus }) @IsEnum(OrderStatus) status: OrderStatus;
  @ApiProperty({ required: false }) @IsOptional() @IsString() trackingNumber?: string;
}

export class OrderQueryDto {
  @ApiProperty({ required: false, default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiProperty({ required: false, default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
  @ApiProperty({ required: false, enum: OrderStatus }) @IsOptional() @IsEnum(OrderStatus) status?: OrderStatus;
}
