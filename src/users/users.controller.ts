// users/users.controller.ts
import { Controller, Get, Param, UseGuards, Req, Patch, Body, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: any) {
    const user = await this.usersService.findById(req.user.sub);
    return user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @Get()
  async getAllUsers() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @Patch(':id/roles')
  async updateUserRoles(@Param('id') id: string, @Body('roles') roles: string[]) {
    return this.usersService.updateRoles(id, roles);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // Admin/Superadmin → activate/deactivate
  @Roles('admin', 'superadmin')
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.usersService.updateStatus(id, isActive);
  }

  // Superadmin → delete user
  @Roles('superadmin')
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
