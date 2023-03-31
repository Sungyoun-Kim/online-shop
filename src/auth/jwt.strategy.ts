import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { payload } from 'src/@types';
import { User } from 'src/users/schema/users.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Express.Request) => request.cookies.access_token.token,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET_KEY'),
      passReqToCallBack: true, //process.env.JWT_SECRET_KEY,
    });
  }

  async validate(payload: payload): Promise<Omit<User, 'password'>> {
    if (!payload.type || payload.type !== 'access') {
      throw new UnauthorizedException(
        'token does not have type or type is not access token',
      );
    }

    const user = await this.userService.findUserByEmail(payload.sub, true);

    if (!user) {
      throw new UnauthorizedException('validating user has been failed');
    }
    const { password, ...data } = user;
    return data;
  }
}
