import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateDoctorDto, UpdateDoctorDto, AssignDepartmentsDto } from './dto/doctors.dto';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class DoctorsService {
  private readonly logger = new Logger(DoctorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all doctors with their departments.
   */
  async findAll(filters?: {
    departmentId?: string;
    specialization?: string;
    activeOnly?: boolean;
  }) {
    const where: Record<string, unknown> = {};

    if (filters?.activeOnly) {
      where.isActive = true;
    }

    if (filters?.specialization) {
      where.specialization = {
        contains: filters.specialization,
        mode: 'insensitive',
      };
    }

    if (filters?.departmentId) {
      where.departments = {
        some: { departmentId: filters.departmentId },
      };
    }

    return this.prisma.doctor.findMany({
      where,
      include: {
        departments: {
          include: {
            department: {
              select: { id: true, name: true },
            },
          },
        },
        user: {
          select: { email: true, phone: true, isActive: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get a single doctor by ID with full details.
   */
  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        departments: {
          include: {
            department: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  /**
   * Create a new doctor with a linked user account.
   * Also creates Staff record and optional department assignments.
   */
  async create(dto: CreateDoctorDto) {
    // Check for duplicate email/phone
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: dto.phone }],
      },
    });

    if (existing) {
      throw new ConflictException('A user with this email or phone already exists');
    }

    const passwordHash = await argon2.hash(dto.password);

    const doctor = await this.prisma.$transaction(async (tx) => {
      // Create User
      const user = await tx.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          role: Role.DOCTOR,
        },
      });

      // Create Staff record
      await tx.staff.create({
        data: {
          userId: user.id,
          name: dto.name,
        },
      });

      // Create Doctor profile
      const newDoctor = await tx.doctor.create({
        data: {
          userId: user.id,
          name: dto.name,
          specialization: dto.specialization,
          bio: dto.bio,
          consultationFee: dto.consultationFee,
          slotDurationMins: dto.slotDurationMins ?? 15,
          photoUrl: dto.photoUrl,
        },
      });

      // Assign departments
      if (dto.departmentIds?.length) {
        await tx.doctorDepartment.createMany({
          data: dto.departmentIds.map((departmentId) => ({
            doctorId: newDoctor.id,
            departmentId,
          })),
        });
      }

      return newDoctor;
    });

    this.logger.log(`Doctor created: ${doctor.id} (${dto.name})`);

    return this.findOne(doctor.id);
  }

  /**
   * Update a doctor's profile.
   */
  async update(id: string, dto: UpdateDoctorDto) {
    await this.ensureExists(id);

    const doctor = await this.prisma.doctor.update({
      where: { id },
      data: {
        name: dto.name,
        specialization: dto.specialization,
        bio: dto.bio,
        consultationFee: dto.consultationFee,
        slotDurationMins: dto.slotDurationMins,
        photoUrl: dto.photoUrl,
        isActive: dto.isActive,
      },
    });

    // Also sync the user active status
    if (dto.isActive !== undefined) {
      await this.prisma.user.update({
        where: { id: doctor.userId },
        data: { isActive: dto.isActive },
      });
    }

    // Sync staff name if name is updated
    if (dto.name) {
      await this.prisma.staff.update({
        where: { userId: doctor.userId },
        data: { name: dto.name },
      });
    }

    return this.findOne(id);
  }

  /**
   * Assign departments to a doctor (replace all existing assignments).
   */
  async assignDepartments(doctorId: string, dto: AssignDepartmentsDto) {
    await this.ensureExists(doctorId);

    // Verify all department IDs exist
    const departments = await this.prisma.department.findMany({
      where: { id: { in: dto.departmentIds } },
    });

    if (departments.length !== dto.departmentIds.length) {
      throw new NotFoundException('One or more department IDs are invalid');
    }

    // Replace all existing assignments within a transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.doctorDepartment.deleteMany({
        where: { doctorId },
      });

      if (dto.departmentIds.length > 0) {
        await tx.doctorDepartment.createMany({
          data: dto.departmentIds.map((departmentId) => ({
            doctorId,
            departmentId,
          })),
        });
      }
    });

    return this.findOne(doctorId);
  }

  /**
   * Soft-delete (deactivate) a doctor.
   */
  async remove(id: string) {
    const doctor = await this.ensureExists(id);

    await this.prisma.$transaction([
      this.prisma.doctor.update({
        where: { id },
        data: { isActive: false },
      }),
      this.prisma.user.update({
        where: { id: doctor.userId },
        data: { isActive: false },
      }),
    ]);

    return this.findOne(id);
  }

  private async ensureExists(id: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    return doctor;
  }
}
