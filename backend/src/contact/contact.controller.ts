import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { ContactService } from './contact.service';
import { ContactQueryDto, CreateContactMessageDto } from './dto';

@ApiTags('Contact') @Controller('contact')
export class ContactController {
  constructor(private contact: ContactService) {}

  // ---- public: submit a contact or feedback message ----
  @Post() submit(@Body() dto: CreateContactMessageDto) { return this.contact.submit(dto); }

  // ---- admin ----
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Get() list(@Query() q: ContactQueryDto) { return this.contact.list(q); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Patch(':id/resolve') resolve(@Param('id') id: string) { return this.contact.setResolved(id, true); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Patch(':id/reopen') reopen(@Param('id') id: string) { return this.contact.setResolved(id, false); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Delete(':id') remove(@Param('id') id: string) { return this.contact.remove(id); }
}
