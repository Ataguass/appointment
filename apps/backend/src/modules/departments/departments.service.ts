import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/departments.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all departments, optionally filtered by active status.
   */
  async findAll(activeOnly = false) {
    return this.prisma.department.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        doctors: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                specialization: true,
                photoUrl: true,
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: { doctors: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get a single department by ID.
   */
  async findOne(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        doctors: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                specialization: true,
                consultationFee: true,
                slotDurationMins: true,
                photoUrl: true,
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: { doctors: true },
        },
      },
    });

    if (!dept) {
      throw new NotFoundException('Department not found');
    }

    return dept;
  }

  /**
   * Create a new department.
   */
  async create(dto: CreateDepartmentDto) {
    // Check for duplicate name
    const existing = await this.prisma.department.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Department "${dto.name}" already exists`);
    }

    return this.prisma.department.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  /**
   * Update a department.
   */
  async update(id: string, dto: UpdateDepartmentDto) {
    await this.ensureExists(id);

    // If renaming, check for duplicate
    if (dto.name) {
      const existing = await this.prisma.department.findFirst({
        where: {
          name: dto.name,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(`Department "${dto.name}" already exists`);
      }
    }

    return this.prisma.department.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Soft-delete (deactivate) a department.
   */
  async remove(id: string) {
    await this.ensureExists(id);

    return this.prisma.department.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async ensureExists(id: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) {
      throw new NotFoundException('Department not found');
    }
    return dept;
  }
}
