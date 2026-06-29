import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { GiftCardsController } from './gift-cards.controller';
import { GiftCardsService } from './gift-cards.service';
@Module({ imports: [PaymentsModule], controllers: [GiftCardsController], providers: [GiftCardsService], exports: [GiftCardsService] })
export class GiftCardsModule {}
