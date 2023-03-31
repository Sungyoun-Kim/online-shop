import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CookieOptions } from 'express';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}
  async validateUser(user_name: string, pass: string): Promise<any> {
    const user = await this.userService.findUserByEmail(user_name, true);

    if (user && bcrypt.compareSync(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  login(user) {
    const payload = {
      sub: user.email,
      name: user.name,
      uid: user.uid,
      userRole: user.userRole,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    return {
      access_token: {
        token: accessToken,
        expires_in: this.configService.get<number>(
          'JWT_ACCESS_TOKEN_EXPIRED_IN_SEC',
        ),
      },
      refresh_token: {
        token: refreshToken,
        expires_in: this.configService.get<number>(
          'JWT_REFRESH_TOKEN_EXPIRED_IN_SEC',
        ),
      },
    };
  }

  generateAccessToken(payload): string {
    payload.type = 'access';
    const expires_in = Number(
      this.configService.get<number>('JWT_ACCESS_TOKEN_EXPIRED_IN_SEC'),
    );
    const options = {
      expiresIn: expires_in,
    };

    const token = this.jwtService.sign(payload, options);

    return token;
  }

  generateRefreshToken(payload): string {
    payload.type = 'refresh';
    const expires_in = Number(
      this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRED_IN_SEC'),
    );
    const options = {
      expiresIn: expires_in,
    };

    const token = this.jwtService.sign(payload, options);
    return token;
  }

  createCookieOption(): CookieOptions {
    const env = this.configService.get('NODE_ENV');

    const secure = !!env && env !== 'development';

    const cookieOption: CookieOptions = {
      httpOnly: true,
      maxAge: this.configService.get('JWT_ACCESS_TOKEN_EXPIRED_IN_SEC'),
      secure: secure,
    };
    if (secure) {
      cookieOption.sameSite = 'none';
    }

    return cookieOption;
  }

  async refreshUser(refreshTokenInCookie: string) {
    const token = this.jwtService.verify(refreshTokenInCookie);
    if (token.type !== 'refresh') {
      throw new UnauthorizedException();
    }
    const user = await this.userService.findUserByEmail(token.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    const payload = {
      sub: user.email,
      name: user.name,
      uid: user.uid,
      userRole: user.userRole,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      user: user,
      access_token: {
        token: accessToken,
        expires_in: this.configService.get('JWT_ACCESS_TOKEN_EXPIRED_IN_SEC'),
      },
      refresh_token: {
        token: refreshToken,
        expires_in: this.configService.get('JWT_REFRESH_TOKEN_EXPIRED_IN_SEC'),
      },
    };
  }
}
