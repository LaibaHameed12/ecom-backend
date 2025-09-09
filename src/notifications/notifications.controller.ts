import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  // GET /notifications
  @Get()
  async getUserNotifications(@Req() req) {
    const userId = req.user.sub || req.user._id;
    return this.notificationsService.getUserNotifications(userId);
  }

  // PATCH /notifications/:id/read
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    const updated = await this.notificationsService.markAsRead(id);
    if (!updated) throw new NotFoundException('Notification not found');
    return updated;
  }

  // DELETE /notifications/:id
  @Delete(':id')
  deleteNotification(@Param('id') id: string) {
    return this.notificationsService.deleteNotification(id);
  }
}
