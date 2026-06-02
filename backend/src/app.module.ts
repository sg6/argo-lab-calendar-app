import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthController } from './auth/auth.controller';
import { JwtAuthGuard } from './auth/auth.guard';
import { AuthService } from './auth/auth.service';
import { EventsController } from './events/events.controller';
import { EventsService } from './events/events.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [],
  controllers: [AppController, AuthController, EventsController],
  providers: [PrismaService, AuthService, JwtAuthGuard, EventsService],
})
export class AppModule {}
