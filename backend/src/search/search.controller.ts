import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { GlobalSearchDto } from './dto';

@ApiTags('Search') @Controller('search')
export class SearchController {
  constructor(private search: SearchService) {}

  @Get() global(@Query() dto: GlobalSearchDto) { return this.search.search(dto); }
}
