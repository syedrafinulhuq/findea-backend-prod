import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('payment')
export class PaymentProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentProcessor.name);

  async process(job: Job) {
    if (job.name === 'payment-success') {
      const { paymentId, orderId } = job.data as { paymentId: string; orderId: string };
      this.logger.log(`Payment success processed: paymentId=${paymentId} orderId=${orderId}`);
      // Post-payment side effects (e.g. loyalty points, inventory alerts) go here.
    }
  }
}
