import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, LoginDto, RefreshDto, RegisterDto, ResetPasswordOtpDto } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @UseGuards(ThrottlerGuard) @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('register') register(@Body() dto: RegisterDto) { return this.auth.register(dto); }

  @UseGuards(ThrottlerGuard) @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login') login(@Body() dto: LoginDto) { return this.auth.login(dto); }

  @Post('refresh') refresh(@Body() dto: RefreshDto) { return this.auth.refresh(dto.refreshToken); }

  @UseGuards(ThrottlerGuard) @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post('forgot-password') forgot(@Body() dto: ForgotPasswordDto) { return this.auth.forgotPassword(dto); }

  @Post('reset-password-otp') resetOtp(@Body() dto: ResetPasswordOtpDto) { return this.auth.resetPasswordOtp(dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Post('logout') logout(@CurrentUser() user: { id: string }) { return this.auth.logout(user.id); }
}
