import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { WishlistService } from './wishlist.service';

@ApiTags('Wishlist') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('wishlist')
export class WishlistController {
  constructor(private wishlist: WishlistService) {}

  @Get() get(@CurrentUser() user: JwtUser) { return this.wishlist.get(user.id); }
  @Post(':productId') add(@CurrentUser() user: JwtUser, @Param('productId') productId: string) { return this.wishlist.add(user.id, productId); }
  @Delete(':productId') remove(@CurrentUser() user: JwtUser, @Param('productId') productId: string) { return this.wishlist.remove(user.id, productId); }
}
