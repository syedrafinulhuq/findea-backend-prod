import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { CancelOrderDto, CreateOrderDto, OrderQueryDto, UpdateOrderStatusDto } from './dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders') @Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post() create(@Body() dto: CreateOrderDto, @CurrentUser() user?: JwtUser) { return this.orders.create(dto, user?.id); }

  @Get('track/:orderNumber') track(@Param('orderNumber') orderNumber: string, @Query('email') email: string) { return this.orders.track(orderNumber, email); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Get('mine') mine(@CurrentUser() user: JwtUser) { return this.orders.mine(user.id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Get() all(@Query() q: OrderQueryDto) { return this.orders.all(q); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post(':orderNumber/cancel') cancel(@Param('orderNumber') orderNumber: string, @Body() dto: CancelOrderDto, @CurrentUser() user: JwtUser) { return this.orders.cancel(orderNumber, dto.reason, user.id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Patch(':orderNumber/status') updateStatus(@Param('orderNumber') orderNumber: string, @Body() dto: UpdateOrderStatusDto) { return this.orders.updateStatus(orderNumber, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Post(':orderNumber/refund') refund(@Param('orderNumber') orderNumber: string) { return this.orders.refund(orderNumber); }
}
