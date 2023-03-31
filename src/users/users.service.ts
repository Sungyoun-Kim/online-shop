import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  BelongUserToBrandDto,
  CreateUserDto,
  UpdateUserDto,
} from './dto/user.dto';
import { User, UserDocument } from './schema/users.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const saltOrRounds = 10;
    createUserDto.password = await bcrypt.hash(
      createUserDto.password,
      saltOrRounds,
    );

    const result = await this.userModel.create({
      cart: { storedProducts: [], totalPrice: 0 },
      ...createUserDto,
    });

    const { password, ...data } = result.toObject();
    return data;
  }
  async findUserByEmail(
    email: string,
    isLean?: boolean,
  ): Promise<null | User | UserDocument> {
    const result = await this.userModel.findOne(
      { email: email },
      {},
      { lean: isLean },
    );
    return result;
  }
  async findUserById(userId: Types.ObjectId, isLean?: boolean) {
    const result = await this.userModel.findOne(
      { _id: userId },
      {},
      { lean: isLean },
    );
    return result;
  }
  async findUserByNaverId(naverId: string, isLean?: boolean) {
    const result = await this.userModel.findOne(
      {
        naverId: naverId,
      },
      {},
      { lean: isLean },
    );
    return result;
  }
  async findUserByUID(uid: string, isLean?: boolean) {
    const result = await this.userModel.findOne(
      {
        uid: uid,
      },
      {},
      { lean: isLean },
    );
    return result;
  }

  async findUserByGithubId(githubId: string, isLean?: boolean) {
    const result = await this.userModel.findOne(
      {
        githubId: githubId,
      },
      {},
      { lean: isLean },
    );
    return result;
  }

  async findUserByKakaoId(kakaoId: string, isLean?: boolean) {
    const result = await this.userModel.findOne(
      {
        kakaoId: kakaoId,
      },
      {},
      { lean: isLean },
    );
    return result;
  }

  async updateUser(
    userId: Types.ObjectId,
    updateUserDto: UpdateUserDto | BelongUserToBrandDto,
    isLean?: boolean,
  ) {
    const result = await this.userModel.updateOne(
      { _id: userId },
      updateUserDto,
      { new: true, lean: isLean },
    );
    return result;
  }

  async deleteUser(userId: Types.ObjectId) {
    const result = await this.userModel.deleteOne({ _id: userId });
    return result;
  }
}
