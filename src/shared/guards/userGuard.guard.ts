import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { JwtPayload } from 'src/modules/auth/interface/jwt.interface';
import { UserService } from 'src/modules/user/user.service';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const shouldAllowUnActivated = this.reflector.getAllAndOverride(
      'allowNotActivated',
      [context.getHandler(), context.getClass()],
    );
    const isAdmin = this.reflector.getAllAndOverride('admin', [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    const dbUser = await this.userService.findById(user.sub, {
      isActive: true,
      role: true,
    });

    if (!shouldAllowUnActivated) {
      return dbUser.isActive;
    }

    if (isAdmin) {
      return dbUser.role === Role.ADMIN;
    }

    return true;
  }
}
