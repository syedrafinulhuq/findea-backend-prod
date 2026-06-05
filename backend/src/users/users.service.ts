import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto, CreateAddressDto, UpdateAddressDto, UpdateProfileDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  me(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, addresses: true } });
  }

  updateMe(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({ where: { id }, data: dto, select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true } });
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    if (!(await argon2.verify(user.passwordHash, dto.currentPassword))) throw new BadRequestException('Current password is incorrect');
    await this.prisma.user.update({ where: { id }, data: { passwordHash: await argon2.hash(dto.newPassword), refreshTokenHash: null } });
    return { message: 'Password changed successfully' };
  }

  async addAddress(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return this.prisma.address.create({ data: { ...dto, userId } });
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    await this.findAddress(userId, addressId);
    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return this.prisma.address.update({ where: { id: addressId }, data: dto });
  }

  async removeAddress(userId: string, addressId: string) {
    await this.findAddress(userId, addressId);
    return this.prisma.address.delete({ where: { id: addressId } });
  }

  async setDefaultAddress(userId: string, addressId: string) {
    await this.findAddress(userId, addressId);
    await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return this.prisma.address.update({ where: { id: addressId }, data: { isDefault: true } });
  }

  private async findAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }
}
