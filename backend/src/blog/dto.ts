import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';

const toArray = ({ value }: { value: unknown }) => {
  if (value === undefined) return value;
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((v) => String(v).split(',')).map((v) => v.trim()).filter(Boolean);
};

export class CreateBlogPostDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() content: string;
  @ApiPropertyOptional() @IsOptional() @IsString() excerpt?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() coverImageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() authorName?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @Transform(toArray) @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() isPublished?: boolean;
}

export class UpdateBlogPostDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() content?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() excerpt?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() coverImageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() authorName?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @Transform(toArray) @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
}

export class BlogQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ description: 'Filter by tag' }) @IsOptional() @IsString() tag?: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional({ default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number = 10;
}
