import { HttpException, Injectable } from '@nestjs/common';
import { JwtPayload, TokenPair } from './interface/jwt.interface';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { RegisterDto } from './dto/register.dto';
import { UserService } from '../user/user.service';
import * as argon2 from 'argon2';
import { SuccessResponse } from 'src/shared/interfaces/interface';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/shared/services/mail.service';
import ActivationLink from 'src/emails/activation-link';
import ResetPasswordLink from 'src/emails/reset-password';
import { ResetPasswordDto } from './dto/reset-password.dto';

const SEVEN_DAYS = 60 * 60 * 24 * 7;

@Injectable()
export class AuthService {
  private readonly redis: Redis | null;

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.redis = this.redisService.getOrThrow();
  }

  async login(login: string, password: string): Promise<TokenPair> {
    const user = await this.userService.findOne(
      {
        OR: [
          {
            email: login,
          },
          {
            username: login,
          },
        ],
      },
      {
        id: true,
        password: true,
      },
    );

    if (!user?.id) {
      throw new HttpException('Wrong credentials', 400);
    }

    const match = await argon2.verify(user.password, password);
    if (!match) {
      throw new HttpException('Wrong credentials', 400);
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    return this.getTokens(payload);
  }

  async register(registerDto: RegisterDto): Promise<TokenPair> {
    if (registerDto.password !== registerDto.repeatPassword) {
      throw new HttpException('Passwords do not match', 400);
    }

    const dbUser = await this.userService.findOne(
      {
        OR: [
          {
            email: registerDto.email,
          },
          {
            username: registerDto.username,
          },
        ],
      },
      {
        id: true,
      },
    );

    if (dbUser?.id) {
      throw new HttpException(
        'User with this email or username already exists',
        400,
      );
    }

    const dto = {
      ...registerDto,
    };
    delete dto.repeatPassword; // I hate myself for this.

    const hash = await argon2.hash(registerDto.password);
    const user = await this.userService.create({
      ...dto,
      password: hash,
    });

    if (!user) {
      throw new HttpException('Something went wrong', 500);
    }

    await this.sendActivationLink(
      user.email,
      user.username,
      await this.generateActivationLink(user.id),
    );

    return this.getTokens({
      sub: user.id,
      email: user.email,
      username: user.username,
    });
  }

  async activateUser(token: string, userId: number): Promise<SuccessResponse> {
    const { sub } = await this.jwtService.verifyAsync<{ sub: number }>(token, {
      secret: this.configService.get('JWT_ACTIVE_SECRET'),
    });

    if (sub !== userId) {
      throw new HttpException('Invalid token', 400);
    }

    const user = await this.userService.update(sub, {
      isActive: true,
    });

    if (!user) {
      throw new HttpException('User not found', 404);
    }

    return {
      success: true,
    };
  }

  async logout(sub: number, token: string): Promise<SuccessResponse> {
    const { key } = await this.verifyRefreshToken(sub, token);

    await this.redis.del(key);

    return {
      success: true,
    };
  }

  async refreshToken(userId: number, refreshToken: string): Promise<TokenPair> {
    const { key } = await this.verifyRefreshToken(userId, refreshToken);

    const user = await this.userService.findOne({
      id: userId,
    });

    if (!user) {
      throw new HttpException('Invalid refresh token', 403);
    }

    await this.redis.del(key);

    return this.getTokens({
      sub: user.id,
      email: user.email,
      username: user.username,
    });
  }

  async sendResetPasswordLink(email: string): Promise<SuccessResponse> {
    const user = await this.userService.findOne(
      {
        email,
      },
      {
        id: true,
        email: true,
        username: true,
      },
    );

    if (!user) {
      throw new HttpException('Something went wrong', 400);
    }

    const token = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get('JWT_RESET_SECRET'),
      },
    );

    await this.mailService.sendMail({
      to: user.email,
      subject: 'Reset password',
      template: ResetPasswordLink({
        link: `${this.configService.get('CLIENT_URL')}/reset-password/${token}`,
        username: user.username,
      }),
    });

    return {
      success: true,
    };
  }

  async resetPassword({
    token,
    password,
    repeatPassword,
  }: ResetPasswordDto): Promise<SuccessResponse> {
    if (password !== repeatPassword) {
      throw new HttpException('Passwords do not match', 400);
    }

    const { sub } = await this.jwtService.verifyAsync<{ sub: number }>(token, {
      secret: this.configService.get('JWT_RESET_SECRET'),
    });

    const user = await this.userService.update(sub, {
      password: await argon2.hash(password),
    });

    if (!user) {
      throw new HttpException('Something went wrong', 400);
    }

    const keys = await this.redis.keys(`${sub}:*`);
    await this.redis.del(...keys);

    return {
      success: true,
    };
  }

  private async verifyRefreshToken(sub: number, refreshToken: string) {
    const key = `${sub}:${refreshToken}`;
    const dbToken = await this.redis.get(key);

    if (!dbToken) {
      throw new HttpException('Invalid refresh token', 403);
    }

    return { key };
  }

  private async getTokens(payload: JwtPayload): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      }),
    ]);

    await this.redis.set(
      `${payload.sub}:${refreshToken}`,
      JSON.stringify(payload),
      'EX',
      SEVEN_DAYS,
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  private async generateActivationLink(userId: number): Promise<string> {
    const token = await this.jwtService.signAsync(
      { sub: userId },
      {
        secret: this.configService.get('JWT_ACTIVE_SECRET'),
      },
    );

    return `${this.configService.get('CLIENT_URL')}/activate/${token}`;
  }

  private async sendActivationLink(
    email: string,
    username: string,
    link: string,
  ) {
    await this.mailService.sendMail({
      to: email,
      subject: 'Activate your account',
      template: ActivationLink({ link, username }),
    });
  }
}
