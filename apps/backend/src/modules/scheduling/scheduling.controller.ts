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
import { SchedulingService } from './scheduling.service';
import {
  SetScheduleDto,
  SetBreaksDto,
  CreateLeaveDto,
  CreateHolidayDto,
  GenerateSlotsDto,
} from './dto/scheduling.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/guards/roles.decorator';

@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  // ─── Weekly Schedules ──────────────────────────────────────────────

  @Get('doctors/:doctorId/schedules')
  async getDoctorSchedule(@Param('doctorId') doctorId: string) {
    const schedules = await this.schedulingService.getDoctorSchedule(doctorId);
    return { success: true, data: schedules };
  }

  @Put('doctors/:doctorId/schedules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'DOCTOR')
  async setDoctorSchedule(
    @Param('doctorId') doctorId: string,
    @Body() dto: SetScheduleDto,
  ) {
    const schedules = await this.schedulingService.setDoctorSchedule(doctorId, dto);
    return { success: true, data: schedules };
  }

  // ─── Breaks ────────────────────────────────────────────────────────

  @Get('doctors/:doctorId/breaks')
  async getDoctorBreaks(@Param('doctorId') doctorId: string) {
    const breaks = await this.schedulingService.getDoctorBreaks(doctorId);
    return { success: true, data: breaks };
  }

  @Put('doctors/:doctorId/breaks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'DOCTOR')
  async setDoctorBreaks(
    @Param('doctorId') doctorId: string,
    @Body() dto: SetBreaksDto,
  ) {
    const breaks = await this.schedulingService.setDoctorBreaks(doctorId, dto);
    return { success: true, data: breaks };
  }

  // ─── Leaves ────────────────────────────────────────────────────────

  @Get('doctors/:doctorId/leaves')
  async getDoctorLeaves(@Param('doctorId') doctorId: string) {
    const leaves = await this.schedulingService.getDoctorLeaves(doctorId);
    return { success: true, data: leaves };
  }

  @Post('doctors/:doctorId/leaves')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'DOCTOR')
  async createLeave(
    @Param('doctorId') doctorId: string,
    @Body() dto: CreateLeaveDto,
  ) {
    const leave = await this.schedulingService.createLeave(doctorId, dto);
    return { success: true, data: leave };
  }

  @Delete('leaves/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'DOCTOR')
  async deleteLeave(@Param('id') id: string) {
    const leave = await this.schedulingService.deleteLeave(id);
    return { success: true, data: leave };
  }

  // ─── Holidays ──────────────────────────────────────────────────────

  @Get('holidays')
  async getHolidays() {
    const holidays = await this.schedulingService.getHolidays();
    return { success: true, data: holidays };
  }

  @Post('holidays')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createHoliday(@Body() dto: CreateHolidayDto) {
    const holiday = await this.schedulingService.createHoliday(dto);
    return { success: true, data: holiday };
  }

  @Delete('holidays/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteHoliday(@Param('id') id: string) {
    const holiday = await this.schedulingService.deleteHoliday(id);
    return { success: true, data: holiday };
  }

  // ─── Slots (Generation & Availability) ─────────────────────────────

  /**
   * GET /api/v1/scheduling/slots?doctorId=...&date=YYYY-MM-DD
   * Public: Query slot availability for doctor on selected date.
   */
  @Get('slots')
  async getSlots(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    const slotData = await this.schedulingService.getSlotsForDate(doctorId, date);
    return { success: true, data: slotData };
  }

  /**
   * POST /api/v1/scheduling/slots/generate
   * Admin / Doctor: Pre-generate slots for a date range.
   */
  @Post('slots/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'DOCTOR')
  async generateSlots(@Body() dto: GenerateSlotsDto) {
    const result = await this.schedulingService.generateSlots(dto);
    return { success: true, data: result };
  }
}
