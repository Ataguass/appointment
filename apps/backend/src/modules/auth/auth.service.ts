import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../shared/database/prisma.service';
import { RegisterDto, LoginDto, CreateStaffDto } from './dto/auth.dto';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes (AUTH-005)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new patient account (AUTH-001).
   */
  async register(dto: RegisterDto) {
    // Check for existing user
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: dto.phone }],
      },
    });

    if (existing) {
      throw new ConflictException(
        existing.email === dto.email
          ? 'An account with this email already exists'
          : 'An account with this phone number already exists',
      );
    }

    // Hash password with argon2 (SEC-011)
    const passwordHash = await argon2.hash(dto.password);

    // Create user + patient profile in a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          role: Role.PATIENT,
        },
      });

      await tx.patient.create({
        data: {
          userId: newUser.id,
          name: dto.name,
        },
      });

      return newUser;
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.role);

    this.logger.log(`Patient registered: ${user.id}`);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Login with email + password (AUTH-001, AUTH-002).
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check account lockout (AUTH-005)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new ForbiddenException(
        `Account is locked. Try again in ${minutesLeft} minute(s)`,
      );
    }

    // Verify password
    const validPassword = await argon2.verify(user.passwordHash, dto.password);

    if (!validPassword) {
      // Increment failed attempts
      const newAttempts = user.failedLoginAttempts + 1;
      const lockUntil =
        newAttempts >= this.MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + this.LOCKOUT_DURATION_MS)
          : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil: lockUntil,
        },
      });

      if (lockUntil) {
        throw new ForbiddenException(
          'Account locked due to too many failed attempts. Try again in 15 minutes',
        );
      }

      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new ForbiddenException('Account has been deactivated');
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.role);

    this.logger.log(`User logged in: ${user.id} (${user.role})`);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Refresh access token using a valid refresh token (AUTH-003).
   */
  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(stored.user.id, stored.user.role);

    return {
      user: this.sanitizeUser(stored.user),
      tokens,
    };
  }

  /**
   * Logout: revoke the refresh token.
   */
  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Create a staff account (admin-only, AUTH-002).
   */
  async createStaffAccount(dto: CreateStaffDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: dto.phone }],
      },
    });

    if (existing) {
      throw new ConflictException('An account with this email or phone already exists');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          role: dto.role as Role,
        },
      });

      await tx.staff.create({
        data: {
          userId: newUser.id,
          name: dto.name,
        },
      });

      return newUser;
    });

    this.logger.log(`Staff account created: ${user.id} (${user.role})`);

    return { user: this.sanitizeUser(user) };
  }

  /**
   * Generate JWT access + refresh token pair.
   */
  private async generateTokens(userId: string, role: Role) {
    const payload = { sub: userId, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRY', '15m') as any,
    });


    // Generate opaque refresh token
    const refreshTokenValue = randomBytes(64).toString('hex');

    // Parse refresh expiry for database storage
    const expiryStr = this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d');
    const expiresAt = this.parseExpiry(expiryStr);

    // Store refresh token in database (server-side, revocable)
    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  /**
   * Parse an expiry string like '7d', '30m', '15m' into a Date.
   */
  private parseExpiry(expiry: string): Date {
    const value = parseInt(expiry.slice(0, -1));
    const unit = expiry.slice(-1);
    const ms =
      unit === 'd'
        ? value * 86400000
        : unit === 'h'
          ? value * 3600000
          : value * 60000;
    return new Date(Date.now() + ms);
  }

  /**
   * Remove sensitive fields from user before returning.
   */
  private sanitizeUser(user: {
    id: string;
    email: string;
    phone: string | null;
    role: Role;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    [key: string]: unknown;
  }) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
