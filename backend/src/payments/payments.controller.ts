import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InitPaymentDto, VerifyPaymentDto } from './dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments') @Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}
  @Post('initialize') initialize(@Body() dto: InitPaymentDto) { return this.payments.initialize(dto.orderId); }
  @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Post('verify') verify(@Body() dto: VerifyPaymentDto) { return this.payments.verify(dto.transactionId); }
  @Post('flutterwave/webhook') webhook(@Headers('verif-hash') hash: string, @Body() body: any) { return this.payments.handleWebhook(hash, body); }
}
