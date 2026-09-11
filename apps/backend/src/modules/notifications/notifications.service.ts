import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateNotificationDto } from './dto/notifications.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create and send a notification record.
   */
  async createNotification(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        recipientId: dto.recipientId,
        type: dto.type,
        channel: dto.channel,
        subject: dto.subject,
        body: dto.body,
        appointmentId: dto.appointmentId,
        status: 'SENT', // In a production system, this dispatches to SendGrid/Twilio/FCM
        sentAt: new Date(),
      },
    });

    this.logger.log(
      `[${dto.channel}] Notification (${dto.type}) dispatched to user ${dto.recipientId}: "${dto.subject || dto.body.slice(0, 40)}"`,
    );
    return notification;
  }

  /**
   * Get user's notifications.
   */
  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Log an immutable audit event (Phase 10 / Security & Compliance).
   */
  async logAudit(
    actorId: string | null,
    action: string,
    entity: string,
    entityId?: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        actorId,
        action,
        entity,
        entityId,
        details: details as any,
        ipAddress,
      },
    });
  }

  /**
   * Retrieve audit logs for compliance review.
   */
  async getAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        include: {
          actor: { select: { id: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
