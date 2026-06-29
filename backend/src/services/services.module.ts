import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
@Module({ controllers: [ServicesController, BookingsController], providers: [ServicesService] })
export class ServicesModule {}
