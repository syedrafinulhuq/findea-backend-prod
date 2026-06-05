import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { ChangePasswordDto, CreateAddressDto, UpdateAddressDto, UpdateProfileDto } from './dto';
import { UsersService } from './users.service';

@ApiTags('Users') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me') me(@CurrentUser() user: JwtUser) { return this.users.me(user.id); }
  @Patch('me') update(@CurrentUser() user: JwtUser, @Body() dto: UpdateProfileDto) { return this.users.updateMe(user.id, dto); }
  @Patch('me/password') password(@CurrentUser() user: JwtUser, @Body() dto: ChangePasswordDto) { return this.users.changePassword(user.id, dto); }

  @Post('me/addresses') addAddress(@CurrentUser() user: JwtUser, @Body() dto: CreateAddressDto) { return this.users.addAddress(user.id, dto); }
  @Patch('me/addresses/:id') updateAddress(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateAddressDto) { return this.users.updateAddress(user.id, id, dto); }
  @Delete('me/addresses/:id') removeAddress(@CurrentUser() user: JwtUser, @Param('id') id: string) { return this.users.removeAddress(user.id, id); }
  @Patch('me/addresses/:id/default') setDefault(@CurrentUser() user: JwtUser, @Param('id') id: string) { return this.users.setDefaultAddress(user.id, id); }
}
