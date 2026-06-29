import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { BlogService } from './blog.service';
import { BlogQueryDto, CreateBlogPostDto, UpdateBlogPostDto } from './dto';

@ApiTags('Blog') @Controller('blog')
export class BlogController {
  constructor(private blog: BlogService) {}

  // ---- public ----
  @Get() list(@Query() q: BlogQueryDto) { return this.blog.list(q); }

  // ---- admin ----
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Get('admin/all') adminList() { return this.blog.adminList(); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Post() create(@Body() dto: CreateBlogPostDto) { return this.blog.create(dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) { return this.blog.update(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Delete(':id') remove(@Param('id') id: string) { return this.blog.remove(id); }

  // ---- public detail (last, so it doesn't shadow admin/all) ----
  @Get(':slug') detail(@Param('slug') slug: string) { return this.blog.detail(slug); }
}
