import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { GiftCardsService } from './gift-cards.service';
import { GiftCardQueryDto, PurchaseGiftCardDto, RedeemGiftCardDto } from './dto';

type AuthUser = { id: string; email: string; role: string };

@ApiTags('Gift Cards') @Controller('gift-cards')
export class GiftCardsController {
  constructor(private giftCards: GiftCardsService) {}

  // ---- public ----
  @Get('balance/:code') balance(@Param('code') code: string) { return this.giftCards.balance(code); }

  // ---- customer ----
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post() purchase(@CurrentUser() user: AuthUser, @Body() dto: PurchaseGiftCardDto) { return this.giftCards.purchase(user.id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get('me') mine(@CurrentUser() user: AuthUser) { return this.giftCards.myGiftCards(user.id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post('redeem') redeem(@Body() dto: RedeemGiftCardDto) { return this.giftCards.redeem(dto); }

  // ---- admin ----
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Get('admin/all') adminList(@Query() q: GiftCardQueryDto) { return this.giftCards.adminList(q); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Patch(':id/disable') disable(@Param('id') id: string) { return this.giftCards.disable(id); }
}
