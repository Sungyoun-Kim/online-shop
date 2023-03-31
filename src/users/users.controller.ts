import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthService } from 'src/auth/auth.service';
import { AllowUnauthorizedRequest } from 'src/auth/guard/jwt-auth.guard';
import { BrandsService } from 'src/brands/brands.service';
import { StringToObjectIdPipe } from 'src/utility/pipe.utility';
import {
  BelongUserToBrandDto,
  CreateUserDto,
  UpdateUserDto,
} from './dto/user.dto';
import { UserRole } from './schema/users.schema';
import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';
import { RoleGuard, RoleLevel } from 'src/auth/guard/role.guard';

@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly brandService: BrandsService,
  ) {}

  @AllowUnauthorizedRequest()
  @Post()
  async createUser(
    @Req() req: Express.Request,
    @Body() createUserDto: CreateUserDto,
    @Res() res: Response,
  ) {
    const result = await this.userService.createUser(createUserDto);

    res.status(201).json(result);
  }

  @RoleLevel([UserRole.BrandChiefAdmin, UserRole.SuperAdmin])
  @UseGuards(RoleGuard)
  @Patch(':userId/brands/:brandId')
  async belongUserToBrand(
    @Req() req: Express.Request,
    @Param('userId', StringToObjectIdPipe) userId: Types.ObjectId,
    @Param('brandId', StringToObjectIdPipe) brandId: Types.ObjectId,
    @Res() res: Response,
  ) {
    const user = await this.userService.findUserById(userId, true);
    if (!user) {
      throw new NotFoundException('유저가 존재하지 않습니다');
    }
    const brand = await this.brandService.findBrandById(brandId);
    if (!brand) {
      throw new NotFoundException('브랜드가 존재하지 않습니다');
    }
    let userType: UserRole;
    if (req.user.userRole === UserRole.SuperAdmin) {
      userType = UserRole.BrandChiefAdmin;
    } else {
      userType = UserRole.BrandAdmin;
    }
    await this.userService.updateUser(
      userId,
      { brand: brandId, userType: userType },
      true,
    );
    res.status(204).end();
  }

  @Delete('self')
  async deleteUserSelf(@Req() req: Express.Request, @Res() res: Response) {
    const user = await this.userService.findUserById(req.user._id);
    if (!user) {
      throw new NotFoundException('이미 존재하지 않는 유저입니다');
    }
    await this.userService.deleteUser(user._id);
    res.status(204).end();
  }

  @Patch('self')
  async updateUser(
    @Req() req: Express.Request,
    @Body() updateUserDto: UpdateUserDto,
    @Res() res: Response,
  ) {
    const user = await this.userService.findUserById(req.user._id);
    if (!user) {
      throw new NotFoundException('이미 존재하지 않는 유저입니다');
    }
    if (updateUserDto.email) {
      const checkEmail = await this.userService.findUserByEmail(
        updateUserDto.email,
      );
      if (checkEmail) {
        throw new BadRequestException('이미 이메일이 존재합니다');
      }
    }

    if (updateUserDto.password) {
      const saltOrRounds = 10;
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        saltOrRounds,
      );
    }
    await this.userService.updateUser(user._id, updateUserDto);
    res.status(204).end();
  }
}
