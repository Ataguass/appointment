import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { SaveConsultationDto } from './dto/consultations.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/guards/roles.decorator';
import { CurrentUser } from '../../shared/guards/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('consultations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  /**
   * POST /api/v1/consultations
   * Save or update consultation note and prescriptions (Doctor or Admin).
   */
  @Post()
  @Roles('DOCTOR', 'ADMIN')
  async saveNote(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: SaveConsultationDto,
  ) {
    const note = await this.consultationsService.saveNote(userId, userRole, dto);
    return { success: true, data: note };
  }

  /**
   * GET /api/v1/consultations/appointment/:appointmentId
   * Get clinical note and digital prescription for an appointment.
   */
  @Get('appointment/:appointmentId')
  async getNoteByAppointment(@Param('appointmentId') appointmentId: string) {
    const data = await this.consultationsService.getNoteByAppointment(appointmentId);
    return { success: true, data };
  }

  /**
   * GET /api/v1/consultations/patient/:patientId/history
   * Get full medical history and past visit records for a patient.
   */
  @Get('patient/:patientId/history')
  @Roles('DOCTOR', 'ADMIN', 'PATIENT')
  async getPatientHistory(@Param('patientId') patientId: string) {
    const data = await this.consultationsService.getPatientHistory(patientId);
    return { success: true, data };
  }
}
