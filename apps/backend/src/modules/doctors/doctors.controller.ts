import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import {
  CreateDoctorDto,
  UpdateDoctorDto,
  AssignDepartmentsDto,
} from './dto/doctors.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/guards/roles.decorator';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  /**
   * GET /api/v1/doctors
   * Public: list doctors with optional filters.
   */
  @Get()
  async findAll(
    @Query('departmentId') departmentId?: string,
    @Query('specialization') specialization?: string,
    @Query('active') active?: string,
  ) {
    const doctors = await this.doctorsService.findAll({
      departmentId,
      specialization,
      activeOnly: active === 'true',
    });
    return { success: true, data: doctors };
  }

  /**
   * GET /api/v1/doctors/:id
   * Public: get a single doctor with departments.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const doctor = await this.doctorsService.findOne(id);
    return { success: true, data: doctor };
  }

  /**
   * POST /api/v1/doctors
   * Admin only: create a new doctor (also creates user + staff account).
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() dto: CreateDoctorDto) {
    const doctor = await this.doctorsService.create(dto);
    return { success: true, data: doctor };
  }

  /**
   * PUT /api/v1/doctors/:id
   * Admin only: update a doctor's profile.
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    const doctor = await this.doctorsService.update(id, dto);
    return { success: true, data: doctor };
  }

  /**
   * PUT /api/v1/doctors/:id/departments
   * Admin only: assign departments to a doctor.
   */
  @Put(':id/departments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async assignDepartments(
    @Param('id') id: string,
    @Body() dto: AssignDepartmentsDto,
  ) {
    const doctor = await this.doctorsService.assignDepartments(id, dto);
    return { success: true, data: doctor };
  }

  /**
   * DELETE /api/v1/doctors/:id
   * Admin only: soft-delete (deactivate) a doctor.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    const doctor = await this.doctorsService.remove(id);
    return { success: true, data: doctor };
  }
}
