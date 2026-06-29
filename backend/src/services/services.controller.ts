import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ServicesService } from './services.service';
import {
  AdminProviderQueryDto,
  CreateProviderDto,
  CreateServiceCategoryDto,
  CreateServiceDto,
  ProviderQueryDto,
  ServiceQueryDto,
  UpdateBookingStatusDto,
  UpdateProviderDto,
  UpdateProviderStatusDto,
  UpdateServiceDto,
} from './dto';

type AuthUser = { id: string; email: string; role: string };

@ApiTags('Services') @Controller()
export class ServicesController {
  constructor(private services: ServicesService) {}

  // ---- public: categories & services ----
  @Get('services/categories') categories() { return this.services.categories(); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Post('services/categories') createCategory(@Body() dto: CreateServiceCategoryDto) { return this.services.createCategory(dto); }

  @Get('services') listServices(@Query() q: ServiceQueryDto) { return this.services.listServices(q); }

  // ---- public: providers ----
  @Get('service-providers') listProviders(@Query() q: ProviderQueryDto) { return this.services.listProviders(q); }

  // ---- provider (self) ----
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post('service-providers') apply(@CurrentUser() user: AuthUser, @Body() dto: CreateProviderDto) { return this.services.apply(user.id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.VENDOR)
  @Get('service-providers/me') me(@CurrentUser() user: AuthUser) { return this.services.myProvider(user.id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.VENDOR)
  @Patch('service-providers/me') updateMine(@CurrentUser() user: AuthUser, @Body() dto: UpdateProviderDto) { return this.services.updateMine(user.id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.VENDOR)
  @Get('service-providers/me/services') myServices(@CurrentUser() user: AuthUser) { return this.services.myServices(user.id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.VENDOR)
  @Post('service-providers/me/services') createService(@CurrentUser() user: AuthUser, @Body() dto: CreateServiceDto) { return this.services.createService(user.id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.VENDOR)
  @Patch('service-providers/me/services/:serviceId') updateService(@CurrentUser() user: AuthUser, @Param('serviceId') serviceId: string, @Body() dto: UpdateServiceDto) { return this.services.updateService(user.id, serviceId, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.VENDOR)
  @Delete('service-providers/me/services/:serviceId') removeService(@CurrentUser() user: AuthUser, @Param('serviceId') serviceId: string) { return this.services.removeService(user.id, serviceId); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.VENDOR)
  @Get('service-providers/me/bookings') providerBookings(@CurrentUser() user: AuthUser) { return this.services.myBookings(user.id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.VENDOR)
  @Patch('service-providers/me/bookings/:bookingId/status') setBookingStatus(@CurrentUser() user: AuthUser, @Param('bookingId') bookingId: string, @Body() dto: UpdateBookingStatusDto) { return this.services.setBookingStatus(user.id, bookingId, dto); }

  // ---- admin ----
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Get('service-providers/admin/all') adminList(@Query() q: AdminProviderQueryDto) { return this.services.adminListProviders(q); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Patch('service-providers/:id/status') setProviderStatus(@Param('id') id: string, @Body() dto: UpdateProviderStatusDto) { return this.services.setProviderStatus(id, dto); }

  // ---- public detail routes (last, so they don't shadow static segments above) ----
  @Get('services/:slug') serviceDetail(@Param('slug') slug: string) { return this.services.serviceDetail(slug); }
  @Get('service-providers/:slug') providerDetail(@Param('slug') slug: string) { return this.services.providerDetail(slug); }
}
