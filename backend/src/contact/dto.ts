import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ContactStatus } from '@prisma/client';

export class CreateContactMessageDto {
  @ApiProperty() @IsString() @MaxLength(120) name: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) subject?: string;
  @ApiProperty() @IsString() @MaxLength(5000) message: string;
}

export class UpdateContactStatusDto {
  @ApiProperty({ enum: ContactStatus }) @IsEnum(ContactStatus) status: ContactStatus;
}

export class ContactQueryDto {
  @ApiPropertyOptional({ enum: ContactStatus }) @IsOptional() @IsEnum(ContactStatus) status?: ContactStatus;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
}
