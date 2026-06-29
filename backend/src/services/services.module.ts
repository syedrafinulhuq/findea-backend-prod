import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { BookingsController } from './bookings.controller';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
@Module({ imports: [PaymentsModule], controllers: [ServicesController, BookingsController], providers: [ServicesService] })
export class ServicesModule {}
