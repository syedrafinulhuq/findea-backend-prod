import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto';

@ApiTags('Cart') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('cart')
export class CartController {
  constructor(private cart: CartService) {}

  @Get() get(@CurrentUser() user: JwtUser) { return this.cart.getCart(user.id); }
  @Post('items') add(@CurrentUser() user: JwtUser, @Body() dto: AddToCartDto) { return this.cart.addItem(user.id, dto); }
  @Patch('items/:id') update(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateCartItemDto) { return this.cart.updateItem(user.id, id, dto); }
  @Delete('items/:id') remove(@CurrentUser() user: JwtUser, @Param('id') id: string) { return this.cart.removeItem(user.id, id); }
  @Delete() clear(@CurrentUser() user: JwtUser) { return this.cart.clearCart(user.id); }
}
