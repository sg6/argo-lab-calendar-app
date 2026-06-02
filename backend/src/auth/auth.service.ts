import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

type AuthBody = {
  email?: string;
  password?: string;
};

export type AuthUser = {
  id: string;
  email: string;
};

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET ?? 'dev-secret';

  constructor(private readonly prisma: PrismaService) {}

  async register(body: AuthBody) {
    const { email, password } = this.parseCredentials(body);
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });

    return this.authResponse(user);
  }

  async login(body: AuthBody) {
    const { email, password } = this.parseCredentials(body);
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.authResponse({ id: user.id, email: user.email });
  }

  verifyToken(token: string): AuthUser {
    try {
      const payload = jwt.verify(token, this.jwtSecret);

      if (
        typeof payload !== 'object' ||
        typeof payload.sub !== 'string' ||
        typeof payload.email !== 'string'
      ) {
        throw new UnauthorizedException('Invalid token');
      }

      return { id: payload.sub, email: payload.email };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private authResponse(user: AuthUser) {
    return {
      user,
      token: jwt.sign({ email: user.email }, this.jwtSecret, {
        subject: user.id,
        expiresIn: '7d',
      }),
    };
  }

  private parseCredentials(body: AuthBody) {
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !email.includes('@')) {
      throw new UnauthorizedException('A valid email is required');
    }

    if (!password || password.length < 8) {
      throw new UnauthorizedException('Password must be at least 8 characters');
    }

    return { email, password };
  }
}
