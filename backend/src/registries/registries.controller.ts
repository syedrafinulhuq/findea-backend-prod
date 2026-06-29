import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RegistriesService } from './registries.service';
import {
  AddRegistryItemDto,
  CreateRegistryDto,
  RegistryQueryDto,
  ReserveItemDto,
  UpdateRegistryDto,
  UpdateRegistryItemDto,
} from './dto';

type AuthUser = { id: string; email: string; role: string };

@ApiTags('Registries') @Controller('registries')
export class RegistriesController {
  constructor(private registries: RegistriesService) {}

  // ---- public browse ----
  @Get() browse(@Query() q: RegistryQueryDto) { return this.registries.browse(q); }

  // ---- owner (static segments first) ----
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreateRegistryDto) { return this.registries.create(user.id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get('me') mine(@CurrentUser() user: AuthUser) { return this.registries.myRegistries(user.id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get('me/reservations') myReservations(@CurrentUser() user: AuthUser) { return this.registries.myReservations(user.id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post('reservations/:id/cancel') cancelReservation(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.registries.cancelReservation(user.id, id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get('owner/:id') ownerDetail(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.registries.ownerDetail(user.id, id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch(':id') update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateRegistryDto) { return this.registries.update(user.id, id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Delete(':id') remove(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.registries.remove(user.id, id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post(':id/items') addItem(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AddRegistryItemDto) { return this.registries.addItem(user.id, id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch(':id/items/:itemId') updateItem(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: UpdateRegistryItemDto) { return this.registries.updateItem(user.id, id, itemId, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Delete(':id/items/:itemId') removeItem(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('itemId') itemId: string) { return this.registries.removeItem(user.id, id, itemId); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get(':id/reservations') registryReservations(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.registries.reservations(user.id, id); }

  // ---- gift-giver: reserve an item on a public registry (guest-friendly) ----
  @Post(':slug/reserve') reserve(@Req() req: { user?: AuthUser }, @Param('slug') slug: string, @Body() dto: ReserveItemDto) {
    return this.registries.reserve(req.user?.id, slug, dto);
  }

  // ---- public detail (last, so it doesn't shadow the static/two-segment routes) ----
  @Get(':slug') publicDetail(@Param('slug') slug: string) { return this.registries.publicDetail(slug); }
}
