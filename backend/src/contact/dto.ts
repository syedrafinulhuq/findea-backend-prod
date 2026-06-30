import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ContactType } from '@prisma/client';

export class CreateContactMessageDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() message: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subject?: string;
  @ApiPropertyOptional({ enum: ContactType, default: ContactType.CONTACT }) @IsOptional() @IsEnum(ContactType) type?: ContactType;
}

export class ContactQueryDto {
  @ApiPropertyOptional({ enum: ContactType }) @IsOptional() @IsEnum(ContactType) type?: ContactType;
  @ApiPropertyOptional({ description: 'Filter by resolved state' })
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean() resolved?: boolean;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
}
