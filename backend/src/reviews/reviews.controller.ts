import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto } from './dto';

@ApiTags('Reviews') @Controller('reviews')
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  @Get('product/:productId') forProduct(@Param('productId') productId: string) { return this.reviews.forProduct(productId); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post() create(@CurrentUser() user: JwtUser, @Body() dto: CreateReviewDto) { return this.reviews.create(user.id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch(':id') update(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateReviewDto) { return this.reviews.update(user.id, id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Delete(':id') remove(@CurrentUser() user: JwtUser, @Param('id') id: string) { return this.reviews.remove(user.id, id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Delete('admin/:id') adminRemove(@CurrentUser() user: JwtUser, @Param('id') id: string) { return this.reviews.remove(user.id, id, true); }
}
