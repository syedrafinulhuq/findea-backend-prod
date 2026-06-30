import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const SEARCH_TYPES = ['products', 'services', 'boutiques', 'providers', 'registries'] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

const toArray = ({ value }: { value: unknown }) => {
  if (value === undefined) return value;
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((v) => String(v).split(',')).map((v) => v.trim()).filter(Boolean);
};

export class GlobalSearchDto {
  @ApiPropertyOptional({ description: 'Free-text query matched against names/titles/descriptions' })
  @IsOptional() @IsString() q?: string;

  @ApiPropertyOptional({ type: [String], enum: SEARCH_TYPES, description: 'Limit results to these entity types. Repeat or comma-separate, e.g. ?type=products,services' })
  @IsOptional() @Transform(toArray) @IsArray() @IsIn(SEARCH_TYPES, { each: true }) type?: SearchType[];

  @ApiPropertyOptional({ default: 5, description: 'Max results returned per entity type' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number = 5;
}
