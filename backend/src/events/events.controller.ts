import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { EventsService } from './events.service';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.eventsService.list(request.user.id);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: { startsAt?: string; name?: string; description?: string },
  ) {
    return this.eventsService.create(request.user.id, body);
  }

  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') eventId: string) {
    return this.eventsService.remove(request.user.id, eventId);
  }
}
