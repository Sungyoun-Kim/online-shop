import { Prop } from '@nestjs/mongoose';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Types } from 'mongoose';
import { registerType, UserRole } from '../schema/users.schema';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsString()
  uid: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @Matches(UserRole.Customer)
  userRole: string;
}

export class BelongUserToBrandDto {
  @Matches(/^[0-9a-fA-F]{24}$/)
  brand: Types.ObjectId;

  @Matches(/^200$/)
  userType: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  password: string;
}
