import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { BoutiquesService } from './boutiques.service';
import {
  AdminBoutiqueQueryDto,
  BoutiqueQueryDto,
  CreateBoutiqueDto,
  CreateBoutiqueProductDto,
  UpdateBoutiqueDto,
  UpdateBoutiqueProductDto,
  UpdateBoutiqueStatusDto,
} from './dto';

type AuthUser = { id: string; email: string; role: string };

@ApiTags('Boutiques') @Controller('boutiques')
export class BoutiquesController {
  constructor(private boutiques: BoutiquesService) {}

  // ---- public ----
  @Get() list(@Query() q: BoutiqueQueryDto) { return this.boutiques.list(q); }

  // ---- vendor (self) ----
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post() apply(@CurrentUser() user: AuthUser, @Body() dto: CreateBoutiqueDto) { return this.boutiques.apply(user.id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.VENDOR)
  @Get('me') me(@CurrentUser() user: AuthUser) { return this.boutiques.myBoutique(user.id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.VENDOR)
  @Patch('me') updateMine(@CurrentUser() user: AuthUser, @Body() dto: UpdateBoutiqueDto) { return this.boutiques.updateMine(user.id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.VENDOR)
  @Get('me/products') myProducts(@CurrentUser() user: AuthUser) { return this.boutiques.myProducts(user.id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.VENDOR)
  @Post('me/products') createProduct(@CurrentUser() user: AuthUser, @Body() dto: CreateBoutiqueProductDto) { return this.boutiques.createProduct(user.id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.VENDOR)
  @Patch('me/products/:productId') updateProduct(@CurrentUser() user: AuthUser, @Param('productId') productId: string, @Body() dto: UpdateBoutiqueProductDto) { return this.boutiques.updateProduct(user.id, productId, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.VENDOR)
  @Delete('me/products/:productId') removeProduct(@CurrentUser() user: AuthUser, @Param('productId') productId: string) { return this.boutiques.removeProduct(user.id, productId); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.VENDOR)
  @Get('me/orders') myOrders(@CurrentUser() user: AuthUser) { return this.boutiques.myOrders(user.id); }

  // ---- admin ----
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Get('admin/all') adminList(@Query() q: AdminBoutiqueQueryDto) { return this.boutiques.adminList(q); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Patch(':id/status') setStatus(@Param('id') id: string, @Body() dto: UpdateBoutiqueStatusDto) { return this.boutiques.setStatus(id, dto); }

  // ---- public (kept last so it doesn't shadow the static routes above) ----
  @Get(':slug') detail(@Param('slug') slug: string) { return this.boutiques.detail(slug); }
}
