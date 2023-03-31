import {
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Reflector } from '@nestjs/core';

import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

export const AllowUnauthorizedRequest = () =>
  SetMetadata('allowUnauthorizedRequest', true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const allowUnauthorizedRequest = this.reflector.get<boolean>(
      'allowUnauthorizedRequest',
      context.getHandler(),
    );
    if (allowUnauthorizedRequest) {
      return true;
    }

    const req = <Express.Request>context.switchToHttp().getRequest();

    if (!req.cookies || !req.cookies.access_token) {
      throw new UnauthorizedException('no token error');
    }

    const token = req.cookies.access_token.token;

    jwt.verify(token, this.configService.get<string>('JWT_SECRET_KEY'));

    return super.canActivate(context);
  }
}
