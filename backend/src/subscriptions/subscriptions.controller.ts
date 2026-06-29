import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SubscriptionsService } from './subscriptions.service';
import { CreatePlanDto, SubscribeDto, UpdatePlanDto } from './dto';

type AuthUser = { id: string; email: string; role: string };

@ApiTags('Subscriptions') @Controller()
export class SubscriptionsController {
  constructor(private subscriptions: SubscriptionsService) {}

  // ---- public plans ----
  @Get('subscription-plans') listPlans() { return this.subscriptions.listPlans(); }

  // ---- admin plans ----
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Post('subscription-plans') createPlan(@Body() dto: CreatePlanDto) { return this.subscriptions.createPlan(dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Patch('subscription-plans/:id') updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) { return this.subscriptions.updatePlan(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Delete('subscription-plans/:id') deactivatePlan(@Param('id') id: string) { return this.subscriptions.deactivatePlan(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Get('subscriptions/admin/all') adminList() { return this.subscriptions.adminListSubscriptions(); }

  // ---- subscriber ----
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post('subscriptions') subscribe(@CurrentUser() user: AuthUser, @Body() dto: SubscribeDto) { return this.subscriptions.subscribe(user.id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get('subscriptions/me') mine(@CurrentUser() user: AuthUser) { return this.subscriptions.mySubscriptions(user.id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post('subscriptions/:id/pay') pay(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.subscriptions.pay(user.id, id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post('subscriptions/:id/cancel') cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.subscriptions.cancel(user.id, id); }
}
