import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { QueueService } from './queue.service';
import { EmailProcessor } from './email.processor';
import { PaymentProcessor } from './payment.processor';

@Module({ imports: [BullModule.registerQueue({ name: 'email' }, { name: 'payment' }), MailModule], providers: [QueueService, EmailProcessor, PaymentProcessor], exports: [QueueService] })
export class QueueModule {}
