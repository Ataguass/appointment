import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/guards/roles.decorator';
import { CurrentUser } from '../../shared/guards/current-user.decorator';
import { UpdateProfileDto } from './dto/users.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/v1/users/me
   * Get the current user's profile (RBAC-002: own data only for patients).
   */
  @Get('me')
  async getProfile(@CurrentUser() user: { id: string; role: string }) {
    const profile = await this.usersService.getProfile(user.id, user.role);
    return { success: true, data: profile };
  }

  /**
   * PUT /api/v1/users/me
   * Update the current user's profile.
   */
  @Put('me')
  async updateProfile(
    @CurrentUser() user: { id: string; role: string },
    @Body() dto: UpdateProfileDto,
  ) {
    const profile = await this.usersService.updateProfile(user.id, user.role, dto);
    return { success: true, data: profile };
  }

  /**
   * GET /api/v1/users/:id
   * Get a user's profile by ID (admin only).
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getUserById(@Param('id') id: string) {
    const profile = await this.usersService.getUserById(id);
    return { success: true, data: profile };
  }
}
