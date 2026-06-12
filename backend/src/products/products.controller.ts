import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { AddProductImageDto, CreateCategoryDto, CreateProductDto, ProductQueryDto, UpdateProductDto } from './dto';
import { ProductsService } from './products.service';

@ApiTags('Products') @Controller('products')
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get('categories') categories() { return this.products.categories(); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Post('categories') createCategory(@Body() dto: CreateCategoryDto) { return this.products.createCategory(dto); }

  @Get() list(@Query() q: ProductQueryDto) { return this.products.list(q); }
  @Get('filters') filters(@Query() q: ProductQueryDto) { return this.products.filters(q); }
  @Get(':slug') detail(@Param('slug') slug: string) { return this.products.detail(slug); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Post() create(@Body() dto: CreateProductDto) { return this.products.create(dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateProductDto) { return this.products.update(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Delete(':id') remove(@Param('id') id: string) { return this.products.remove(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Post(':id/images') addImage(@Param('id') id: string, @Body() dto: AddProductImageDto) { return this.products.addImage(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Delete(':id/images/:imageId') removeImage(@Param('id') id: string, @Param('imageId') imageId: string) { return this.products.removeImage(id, imageId); }
}
