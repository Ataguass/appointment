import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { UpdateProfileDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user profile with role-specific data.
   */
  async getProfile(userId: string, role: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        patient: role === 'PATIENT' ? true : false,
        staff: role !== 'PATIENT' ? true : false,
        doctor: role === 'DOCTOR' ? {
          include: {
            departments: {
              include: { department: true },
            },
          },
        } : false,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user profile.
   */
  async updateProfile(userId: string, role: string, dto: UpdateProfileDto) {
    if (role === 'PATIENT') {
      await this.prisma.patient.update({
        where: { userId },
        data: {
          name: dto.name,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          gender: dto.gender,
          address: dto.address,
        },
      });
    } else {
      await this.prisma.staff.update({
        where: { userId },
        data: {
          name: dto.name,
        },
      });
    }

    // Update user-level fields
    if (dto.phone) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { phone: dto.phone },
      });
    }

    return this.getProfile(userId, role);
  }

  /**
   * Get any user by ID (admin use).
   */
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        patient: true,
        staff: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
