import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { ForgotPasswordDto, LoginDto, RefreshDto, RegisterDto, ResetPasswordOtpDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService, private queue: QueueService) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('Email already registered');
    const user = await this.prisma.user.create({ data: { email: dto.email, passwordHash: await argon2.hash(dto.password), firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone } });
    await this.queue.addEmailJob('welcome', { to: user.email, name: user.firstName || user.email });
    return this.issueTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) throw new UnauthorizedException('Invalid credentials');
    return this.issueTokens(user.id, user.email, user.role);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, { secret: this.config.getOrThrow('JWT_REFRESH_SECRET') });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user?.refreshTokenHash || !(await argon2.verify(user.refreshTokenHash, refreshToken))) throw new UnauthorizedException();
      return this.issueTokens(user.id, user.email, user.role);
    } catch { throw new UnauthorizedException('Invalid refresh token'); }
  }

  async logout(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } });
    return { message: 'Logged out' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (user) {
      const otp = randomInt(100000, 999999).toString();
      await this.prisma.user.update({ where: { id: user.id }, data: { passwordResetToken: await argon2.hash(otp), passwordResetExpires: new Date(Date.now() + 1000 * 60 * 10) } });
      await this.queue.addEmailJob('password-reset-otp', { to: user.email, otp });
    }
    return { message: 'If that email is registered, you will receive a reset code.' };
  }

  async resetPasswordOtp(dto: ResetPasswordOtpDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordResetToken || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Invalid or expired OTP.');
    }
    if (!(await argon2.verify(user.passwordResetToken, dto.otp))) {
      throw new BadRequestException('Invalid or expired OTP.');
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: await argon2.hash(dto.newPassword), passwordResetToken: null, passwordResetExpires: null, refreshTokenHash: null } });
    return { message: 'Password updated successfully.' };
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, { secret: this.config.getOrThrow('JWT_ACCESS_SECRET'), expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m') }),
      this.jwt.signAsync(payload, { secret: this.config.getOrThrow('JWT_REFRESH_SECRET'), expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d') }),
    ]);
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: await argon2.hash(refreshToken) } });
    return { accessToken, refreshToken, user: { id: userId, email, role } };
  }
}
