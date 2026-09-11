import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import {
  RecordPaymentDto,
  WaivePaymentDto,
  GetPaymentsFilterDto,
} from './dto/billing.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/guards/roles.decorator';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * POST /api/v1/billing/pay
   * Collect payment for an appointment.
   */
  @Post('pay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PATIENT', 'RECEPTIONIST', 'BILLING', 'ADMIN')
  async recordPayment(@Body() dto: RecordPaymentDto) {
    const payment = await this.billingService.recordPayment(dto);
    return { success: true, data: payment };
  }

  /**
   * POST /api/v1/billing/waive
   * Waive consultation fee.
   */
  @Post('waive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BILLING', 'ADMIN')
  async waivePayment(@Body() dto: WaivePaymentDto) {
    const payment = await this.billingService.waivePayment(dto);
    return { success: true, data: payment };
  }

  /**
   * GET /api/v1/billing/receipt/:appointmentId
   * Get official receipt data for an appointment.
   */
  @Get('receipt/:appointmentId')
  async getReceipt(@Param('appointmentId') appointmentId: string) {
    const receipt = await this.billingService.getReceipt(appointmentId);
    return { success: true, data: receipt };
  }

  /**
   * GET /api/v1/billing/payments
   * List payments with summary totals.
   */
  @Get('payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BILLING', 'ADMIN', 'RECEPTIONIST')
  async getPayments(@Query() filters: GetPaymentsFilterDto) {
    const result = await this.billingService.getPaymentsList(filters);
    return { success: true, data: result.payments, summary: result.summary };
  }

  /**
   * GET /api/v1/billing/reports/revenue
   * Revenue analytics report by date, doctor, and payment method.
   */
  @Get('reports/revenue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BILLING', 'ADMIN')
  async getRevenueReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const report = await this.billingService.getRevenueReport(startDate, endDate);
    return { success: true, data: report };
  }
}
