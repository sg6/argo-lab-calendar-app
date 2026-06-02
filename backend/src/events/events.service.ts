import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type EventBody = {
  startsAt?: string;
  name?: string;
  description?: string;
};

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.calendarEvent.findMany({
      where: { userId },
      orderBy: { startsAt: 'asc' },
    });
  }

  create(userId: string, body: EventBody) {
    const event = this.parseEvent(body);

    return this.prisma.calendarEvent.create({
      data: {
        ...event,
        userId,
      },
    });
  }

  async remove(userId: string, eventId: string) {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.prisma.calendarEvent.delete({ where: { id: event.id } });
    return { deleted: true };
  }

  private parseEvent(body: EventBody) {
    const startsAt = new Date(body.startsAt ?? '');
    const name = body.name?.trim();
    const description = body.description?.trim() ?? '';

    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('A valid date and time is required');
    }

    if (!name) {
      throw new BadRequestException('Event name is required');
    }

    return { startsAt, name, description };
  }
}
