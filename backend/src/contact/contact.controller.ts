import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ContactService } from './contact.service';
import { ContactQueryDto, CreateContactMessageDto, UpdateContactStatusDto } from './dto';

@ApiTags('Contact') @Controller('contact')
export class ContactController {
  constructor(private contact: ContactService) {}

  // ---- public ----
  @Post() submit(@Body() dto: CreateContactMessageDto) { return this.contact.submit(dto); }

  // ---- admin inbox ----
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Get() list(@Query() q: ContactQueryDto) { return this.contact.adminList(q); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Patch(':id/status') setStatus(@Param('id') id: string, @Body() dto: UpdateContactStatusDto) { return this.contact.setStatus(id, dto); }
}
