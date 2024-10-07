import {
  Body,
  Controller,
  HttpException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from 'src/shared/decorators/public.decorator';
import { GetCurrentUser } from 'src/shared/decorators/get-current-user.decorator';
import { RefreshTokenGuard } from 'src/shared/guards/refreshToken.guard';
import { JwtPayloadWithRefresh } from './interface/jwt.interface';
import { AllowNotActivated } from 'src/shared/decorators/allow-not-activated.decorator';
import { AccessTokenGuard } from 'src/shared/guards/accessToken.guard';
import { GetCurrentUserId } from 'src/shared/decorators/get-current-user-id.decorator';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.login, body.password);
  }

  @Public()
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @UseGuards(AccessTokenGuard)
  @AllowNotActivated()
  @Post('activate/:token')
  async activate(
    @Param('token') token: string,
    @GetCurrentUserId() userId: number,
  ) {
    if (!token) {
      throw new HttpException('Invalid token', 400);
    }

    return this.authService.activateUser(token, userId);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('logout')
  async logout(@GetCurrentUser() payload: JwtPayloadWithRefresh) {
    if (!payload.refreshToken) {
      throw new HttpException('Invalid refresh token', 400);
    }

    return this.authService.logout(payload.sub, payload.refreshToken);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(@GetCurrentUser() payload: JwtPayloadWithRefresh) {
    return this.authService.refreshToken(payload.sub, payload.refreshToken);
  }

  @UseGuards(AccessTokenGuard)
  @Post('send-reset-password-link')
  async sendResetPasswordLink(@GetCurrentUserId() userId: number) {
    return this.authService.sendResetPasswordLink(userId);
  }

  @UseGuards(AccessTokenGuard)
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }
}
