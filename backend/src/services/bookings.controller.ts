import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ServicesService } from './services.service';
import { CreateBookingDto, UpdateBookingStatusDto } from './dto';

type AuthUser = { id: string; email: string; role: string };

@ApiTags('Bookings') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('bookings')
export class BookingsController {
  constructor(private services: ServicesService) {}

  @Post() book(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) { return this.services.book(user.id, dto); }

  @Get('me') myBookings(@CurrentUser() user: AuthUser) { return this.services.myCustomerBookings(user.id); }

  @Post(':id/cancel') cancel(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.services.cancelBooking(user.id, id, dto.cancelReason);
  }
}
