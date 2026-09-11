import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/notifications.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/guards/roles.decorator';
import { CurrentUser } from '../../shared/guards/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /api/v1/notifications/my
   * Get recent notifications for the logged-in user.
   */
  @Get('my')
  async getMyNotifications(@CurrentUser('id') userId: string) {
    const notifications = await this.notificationsService.getUserNotifications(userId);
    return { success: true, data: notifications };
  }

  /**
   * POST /api/v1/notifications
   * Send a notification (Admin / System).
   */
  @Post()
  @Roles('ADMIN')
  async sendNotification(@Body() dto: CreateNotificationDto) {
    const notification = await this.notificationsService.createNotification(dto);
    return { success: true, data: notification };
  }

  /**
   * GET /api/v1/notifications/audit-logs
   * Retrieve audit logs for compliance review (Admin only).
   */
  @Get('audit-logs')
  @Roles('ADMIN')
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.notificationsService.getAuditLogs(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
    return { success: true, data: result.logs, pagination: result.pagination };
  }
}
