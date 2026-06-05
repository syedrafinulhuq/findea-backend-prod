import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @MinLength(8) password: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() firstName?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() lastName?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() phone?: string;
}
export class LoginDto { @ApiProperty() @IsEmail() email: string; @ApiProperty() @IsString() password: string; }
export class RefreshDto { @ApiProperty() @IsString() refreshToken: string; }
export class ForgotPasswordDto { @ApiProperty() @IsEmail() email: string; }
export class ResetPasswordOtpDto { @ApiProperty() @IsEmail() email: string; @ApiProperty() @IsString() otp: string; @ApiProperty() @IsString() @MinLength(8) newPassword: string; }
