import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { AnnounceDelayDto } from './dto/queue.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/guards/roles.decorator';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  /**
   * GET /api/v1/queue/display
   * Public: Waiting room TV display summary across all consulting doctors.
   */
  @Get('display')
  async getHospitalDisplayQueues() {
    const displayData = await this.queueService.getHospitalDisplayQueues();
    return { success: true, data: displayData };
  }

  /**
   * GET /api/v1/queue/doctors/:doctorId
   * Public / Staff: Get today's queue for a specific doctor.
   */
  @Get('doctors/:doctorId')
  async getDoctorQueue(@Param('doctorId') doctorId: string) {
    const queue = await this.queueService.getDoctorQueue(doctorId);
    return { success: true, data: queue };
  }

  /**
   * POST /api/v1/queue/doctors/:doctorId/next
   * Doctor / Staff: Advance queue and call next patient into consultation.
   */
  @Post('doctors/:doctorId/next')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCTOR', 'RECEPTIONIST', 'ADMIN')
  async callNextToken(@Param('doctorId') doctorId: string) {
    const result = await this.queueService.callNextToken(doctorId);
    return { success: true, data: result };
  }

  /**
   * POST /api/v1/queue/appointments/:id/skip
   * Doctor / Staff: Skip a no-show patient.
   */
  @Post('appointments/:id/skip')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCTOR', 'RECEPTIONIST', 'ADMIN')
  async skipToken(@Param('id') id: string) {
    const result = await this.queueService.skipToken(id);
    return { success: true, data: result };
  }

  /**
   * GET /api/v1/queue/live/:appointmentId
   * Public / Patient: Live queue tracking for a specific patient's token.
   */
  @Get('live/:appointmentId')
  async getPatientLiveQueue(@Param('appointmentId') appointmentId: string) {
    const liveData = await this.queueService.getPatientLiveQueue(appointmentId);
    return { success: true, data: liveData };
  }

  /**
   * POST /api/v1/queue/delay
   * Doctor / Admin: Announce running late delay to waiting patients.
   */
  @Post('delay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DOCTOR', 'ADMIN')
  async announceDelay(@Body() dto: AnnounceDelayDto) {
    const result = await this.queueService.announceDelay(dto);
    return { success: true, data: result };
  }
}
