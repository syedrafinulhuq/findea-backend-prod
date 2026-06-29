import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { GiftCardsModule } from '../gift-cards/gift-cards.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
@Module({ imports: [QueueModule, GiftCardsModule], controllers: [OrdersController], providers: [OrdersService], exports: [OrdersService] })
export class OrdersModule {}
