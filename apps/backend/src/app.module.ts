import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './shared/database/database.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { QueueModule } from './modules/queue/queue.module';
import { ConsultationsModule } from './modules/consultations/consultations.module';
import { BillingModule } from './modules/billing/billing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { validateEnv } from './shared/config/env.validation';

@Module({
  imports: [
    // Environment config with validation
    ConfigModule.forRoot({
      isGlobal: true,
      validate: () => validateEnv(),
    }),

    // Global database module
    DatabaseModule,

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    DoctorsModule,
    SchedulingModule,
    AppointmentsModule,
    QueueModule,
    ConsultationsModule,
    BillingModule,
    NotificationsModule,
    CalendarModule,
  ],
  providers: [
    // Global exception filter (ERR-001)
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Global logging interceptor (MON-001)
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
