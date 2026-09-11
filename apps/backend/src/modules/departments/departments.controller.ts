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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/departments.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/guards/roles.decorator';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  /**
   * GET /api/v1/departments
   * Public: list all departments (for patient browsing).
   * Query: ?active=true to filter only active departments.
   */
  @Get()
  async findAll(@Query('active') active?: string) {
    const activeOnly = active === 'true';
    const departments = await this.departmentsService.findAll(activeOnly);
    return { success: true, data: departments };
  }

  /**
   * GET /api/v1/departments/:id
   * Public: get a single department with its doctors.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const department = await this.departmentsService.findOne(id);
    return { success: true, data: department };
  }

  /**
   * POST /api/v1/departments
   * Admin only: create a new department.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() dto: CreateDepartmentDto) {
    const department = await this.departmentsService.create(dto);
    return { success: true, data: department };
  }

  /**
   * PUT /api/v1/departments/:id
   * Admin only: update a department.
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    const department = await this.departmentsService.update(id, dto);
    return { success: true, data: department };
  }

  /**
   * DELETE /api/v1/departments/:id
   * Admin only: soft-delete (deactivate) a department.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    const department = await this.departmentsService.remove(id);
    return { success: true, data: department };
  }
}
