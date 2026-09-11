import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import {
  BookAppointmentDto,
  RescheduleAppointmentDto,
  CancelAppointmentDto,
  WalkInAppointmentDto,
  UpdateAppointmentStatusDto,
} from './dto/appointments.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/guards/roles.decorator';
import { CurrentUser } from '../../shared/guards/current-user.decorator';
import { AppointmentStatus, Role } from '@prisma/client';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * POST /api/v1/appointments
   * Book a new appointment (Patient or Receptionist/Admin).
   */
  @Post()
  @Roles('PATIENT', 'RECEPTIONIST', 'ADMIN')
  async book(
    @Body() dto: BookAppointmentDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    const appointment = await this.appointmentsService.book(dto, userId, userRole);
    return { success: true, data: appointment };
  }

  /**
   * POST /api/v1/appointments/walk-in
   * Register a walk-in patient (Receptionist or Admin).
   */
  @Post('walk-in')
  @Roles('RECEPTIONIST', 'ADMIN')
  async createWalkIn(@Body() dto: WalkInAppointmentDto) {
    const appointment = await this.appointmentsService.createWalkIn(dto);
    return { success: true, data: appointment };
  }

  /**
   * GET /api/v1/appointments
   * List appointments with filter support.
   */
  @Get()
  async findAll(
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string,
    @Query('date') date?: string,
    @Query('status') status?: AppointmentStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser('id') userId?: string,
    @CurrentUser('role') userRole?: Role,
  ) {
    const result = await this.appointmentsService.findAll({
      doctorId,
      patientId,
      date,
      status,
      userId,
      userRole,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
    return { success: true, data: result.appointments, pagination: result.pagination };
  }

  /**
   * GET /api/v1/appointments/:id
   * Get single appointment details.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const appointment = await this.appointmentsService.findOne(id);
    return { success: true, data: appointment };
  }

  /**
   * POST /api/v1/appointments/:id/reschedule
   * Reschedule appointment atomically.
   */
  @Post(':id/reschedule')
  @Roles('PATIENT', 'RECEPTIONIST', 'ADMIN')
  async reschedule(
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    const appointment = await this.appointmentsService.reschedule(
      id,
      dto,
      userId,
      userRole,
    );
    return { success: true, data: appointment };
  }

  /**
   * POST /api/v1/appointments/:id/cancel
   * Cancel an appointment and release slot.
   */
  @Post(':id/cancel')
  @Roles('PATIENT', 'RECEPTIONIST', 'ADMIN')
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    const appointment = await this.appointmentsService.cancel(
      id,
      dto,
      userId,
      userRole,
    );
    return { success: true, data: appointment };
  }

  /**
   * POST /api/v1/appointments/:id/check-in
   * Check in patient and assign queue token.
   */
  @Post(':id/check-in')
  @Roles('RECEPTIONIST', 'ADMIN', 'PATIENT')
  async checkIn(@Param('id') id: string) {
    const appointment = await this.appointmentsService.checkIn(id);
    return { success: true, data: appointment };
  }

  /**
   * PATCH /api/v1/appointments/:id/status
   * Advance appointment state machine.
   */
  @Patch(':id/status')
  @Roles('DOCTOR', 'RECEPTIONIST', 'ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    const appointment = await this.appointmentsService.updateStatus(id, dto);
    return { success: true, data: appointment };
  }
}
