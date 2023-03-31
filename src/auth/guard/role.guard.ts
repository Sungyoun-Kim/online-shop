import {
  CanActivate,
  Inject,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/users/schema/users.schema';

export const RoleLevel = (roleLevel: UserRole | UserRole[]) =>
  SetMetadata('roleLevel', roleLevel);

export class RoleGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowUnauthorizedRequest = this.reflector.get<boolean>(
      'allowUnauthorizedRequest',
      context.getHandler(),
    );
    // API에 AllowUnauthorizedRequest 어노테이션이 붙은 경우 무조건 허용
    if (allowUnauthorizedRequest) {
      return true;
    }

    // API에 설정된 roleLevel 가져오기
    const roleLevel = this.reflector.get<UserRole>(
      'roleLevel',
      context.getHandler(),
    );
    const req: Express.Request = context.switchToHttp().getRequest();
    const { user } = req;

    if (Array.isArray(roleLevel)) {
      return roleLevel.includes(user.userRole);
    } else {
      return roleLevel === user.userRole;
    }
  }
}
