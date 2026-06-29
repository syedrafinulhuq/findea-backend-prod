import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, FeedbackQueryDto, UpdateFeedbackDto } from './dto';

type AuthUser = { id: string; email: string; role: string };

@ApiTags('Feedback') @Controller('feedback')
export class FeedbackController {
  constructor(private feedback: FeedbackService) {}

  // ---- public ----
  @Post() submit(@Req() req: { user?: AuthUser }, @Body() dto: CreateFeedbackDto) { return this.feedback.submit(req.user?.id, dto); }

  @Get('published') published() { return this.feedback.published(); }

  // ---- admin ----
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Get() list(@Query() q: FeedbackQueryDto) { return this.feedback.adminList(q); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Patch(':id') setPublished(@Param('id') id: string, @Body() dto: UpdateFeedbackDto) { return this.feedback.setPublished(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  @Delete(':id') remove(@Param('id') id: string) { return this.feedback.remove(id); }
}
