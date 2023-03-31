import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Render,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AllowUnauthorizedRequest } from './guard/jwt-auth.guard';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { UsersService } from 'src/users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly userService: UsersService,
  ) {}

  @AllowUnauthorizedRequest()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  login(@Req() req: Express.Request, @Res() res: Response) {
    const loggedInUser = this.authService.login(req.user);
    const cookieOption = this.authService.createCookieOption();

    res.cookie('access_token', loggedInUser.access_token, cookieOption);

    res.status(201).json({
      _id: req.user._id,
      name: req.user.name,
      uid: req.user.uid,
      userEmail: req.user.email,
      expires_at: this.configService.get('JWT_ACCESS_TOKEN_EXPIRED_IN_SEC'),
      refresh_token: loggedInUser.refresh_token,
    });
  }

  @AllowUnauthorizedRequest()
  @Get('refresh')
  async refreshAccessToken(
    @Query('token') token: string,

    @Res() res: Response,
  ) {
    const data = await this.authService.refreshUser(token);
    const cookieOption = this.authService.createCookieOption();

    res.cookie('access_token', data.access_token.token, cookieOption);
    res.status(200).end();
  }

  @AllowUnauthorizedRequest()
  @Post('google/login')
  async googleLogin(
    @Query('access_token') access_token: string,
    @Res() res: Response,
  ) {
    const { data } = await firstValueFrom(
      this.httpService
        .get(
          `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${access_token}`,
        )
        .pipe(),
    );
    if (data) {
      const user = await this.userService.findUserByUID('google_' + data.id);

      if (!user) {
        // 프론트에게 회원가입시 필요한 데이터를 제공해야한다.
        throw new UnauthorizedException('회원가입을 진행해주세요');
      }
      const loggedInUser = this.authService.login(user);
      const cookieOption = this.authService.createCookieOption();

      res.cookie('access_token', loggedInUser.access_token, cookieOption);

      res.status(201).json({
        _id: user._id,
        uid: user.uid,
        name: user.name,
        userEmail: user.email,

        expires_at: this.configService.get('JWT_ACCESS_TOKEN_EXPIRED_IN_SEC'),
        refresh_token: loggedInUser.refresh_token,
      });

      return;
    } else {
      throw new BadRequestException(
        '구글로부터 올바르지 않은 응답이 반환되었습니다',
      );
    }
  }

  @AllowUnauthorizedRequest()
  @Get('naver/login')
  async naverLogin(@Res() res: Response) {
    const client_id = this.configService.get<string>('NAVER_CLIENT_ID');
    const state = this.configService.get<string>('NAVER_STATE');
    const redirectURI = encodeURI('http://127.0.0.1:3000/auth/naver/callback');
    const apiUrl =
      'https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=' +
      client_id +
      '&redirect_uri=' +
      redirectURI +
      '&state=' +
      state;

    res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
    res.end(
      "<a href='" +
        apiUrl +
        "'><img height='50' src='http://static.nid.naver.com/oauth/small_g_in.PNG'/></a>",
    );
  }
  @AllowUnauthorizedRequest()
  @Get('naver/callback')
  async naverLoginCallback(
    @Query() query: { code: string; state: string },
    @Res() res: Response,
  ) {
    let client_id = this.configService.get<string>('NAVER_CLIENT_ID');
    let client_secret = this.configService.get<string>('NAVER_CLIENT_SECRET');
    let redirectURI = encodeURI('http://127.0.0.1:3000/auth/naver/callback');
    let code = query.code;
    let state = query.state;
    let api_url =
      'https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=' +
      client_id +
      '&client_secret=' +
      client_secret +
      '&redirect_uri=' +
      redirectURI +
      '&code=' +
      code +
      '&state=' +
      state;

    let options = {
      url: api_url,
      headers: {
        'X-Naver-Client-Id': client_id,
        'X-Naver-Client-Secret': client_secret,
      },
    };
    const result = await firstValueFrom(
      this.httpService.get(options.url, { headers: options.headers }).pipe(),
    );
    const token = result.data.access_token;

    // 발급 받은 access token을 사용해 회원 정보 조회 API를 사용한다.
    const info_options = {
      url: 'https://openapi.naver.com/v1/nid/me',
      headers: { Authorization: 'Bearer ' + token },
    };

    const { data } = await firstValueFrom(
      this.httpService
        .get(info_options.url, { headers: info_options.headers })
        .pipe(),
    );

    const info_result_json = data.response;

    if (info_result_json) {
      const user = await this.userService.findUserByUID(
        'naver_' + info_result_json.id,
      );
      if (!user) {
        // 프론트에게 회원가입시 필요한 데이터를 제공해야한다.
        throw new UnauthorizedException(
          '회원가입을 진행해주세요 이메일 기재해주세요',
        );
      }
      const loggedInUser = this.authService.login(user);
      const cookieOption = this.authService.createCookieOption();

      res.cookie('access_token', loggedInUser.access_token, cookieOption);

      res.status(201).json({
        _id: user._id,
        uid: user.uid,
        name: user.name,
        userEmail: user.email,

        expires_at: this.configService.get('JWT_ACCESS_TOKEN_EXPIRED_IN_SEC'),
        refresh_token: loggedInUser.refresh_token,
      });

      return;
    } else {
      throw new BadRequestException(
        '네이버로부터 올바르지 않은 응답이 반환되었습니다',
      );
    }
  }

  @AllowUnauthorizedRequest()
  @Get('github/login')
  async githubLogin(@Query() query: any, @Res() res: Response) {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET');
    const token = query.code;
    const { data } = await firstValueFrom(
      this.httpService.post(
        `https://github.com/login/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${token}`,
        {},
        {
          headers: {
            accept: 'application/json',
          },
        },
      ),
    );
    const result = await firstValueFrom(
      this.httpService.get('https://api.github.com/user', {
        headers: { Authorization: `token ${data.access_token}` },
      }),
    );

    if (result.data) {
      const user = await this.userService.findUserByUID(
        'github_' + result.data.id,
      );
      if (!user) {
        // 프론트에게 회원가입시 필요한 데이터를 제공해야한다.
        throw new UnauthorizedException(
          '회원가입을 진행해주세요 이메일 기재해주세요',
        );
      }
      const loggedInUser = this.authService.login(user);
      const cookieOption = this.authService.createCookieOption();

      res.cookie('access_token', loggedInUser.access_token, cookieOption);

      res.status(201).json({
        _id: user._id,
        uid: user.uid,
        name: user.name,
        userEmail: user.email,

        expires_at: this.configService.get('JWT_ACCESS_TOKEN_EXPIRED_IN_SEC'),
        refresh_token: loggedInUser.refresh_token,
      });

      return;
    } else {
      throw new BadRequestException(
        '깃허브로부터 올바르지 않은 응답이 반환되었습니다',
      );
    }
  }

  @AllowUnauthorizedRequest()
  @Get('kakao/login')
  async kakaoLogin(@Res() res: Response) {
    const clientId = this.configService.get<string>('KAKAO_CLIENT_ID');
    const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=http://localhost:3000/auth/kakao/login/callback&response_type=code&scope=account_email`;
    res.redirect(kakaoAuthURL);
  }

  @AllowUnauthorizedRequest()
  @Get('kakao/login/callback') //권한이 없어서 이름을 못받아옴
  async kakaoLoginCallback(@Query() query: any, @Res() res: Response) {
    const clientId = this.configService.get<string>('KAKAO_CLIENT_ID');
    const clientSecret = this.configService.get<string>('KAKAO_CLIENT_SECRET');

    const token = await firstValueFrom(
      this.httpService.post(
        'https://kauth.kakao.com/oauth/token',
        {
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          redirectUri: 'http://localhost:3000/auth/kakao/login/callback',
          code: query.code,
        },
        {
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );

    const { data } = await firstValueFrom(
      this.httpService.get('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${token.data.access_token}`,
        },
      }),
    );
    if (data) {
      const user = await this.userService.findUserByUID('kakao_' + data.id);
      if (!user) {
        // 프론트에게 회원가입시 필요한 데이터를 제공해야한다.
        throw new UnauthorizedException('회원가입을 진행해주세요');
      }
      const loggedInUser = this.authService.login(user);
      const cookieOption = this.authService.createCookieOption();

      res.cookie('access_token', loggedInUser.access_token, cookieOption);

      res.status(201).json({
        _id: user._id,
        uid: user.uid,
        name: user.name,
        userEmail: user.email,
        expires_at: this.configService.get('JWT_ACCESS_TOKEN_EXPIRED_IN_SEC'),
        refresh_token: loggedInUser.refresh_token,
      });

      return;
    } else {
      throw new BadRequestException(
        '카카오로부터 올바르지 않은 응답이 반환되었습니다',
      );
    }
  }
}
