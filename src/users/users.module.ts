import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schema/users.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { BrandsModule } from 'src/brands/brands.module';

@Module({
  imports: [
    BrandsModule,
    MongooseModule.forFeatureAsync([
      {
        name: User.name,

        useFactory: () => {
          const schema = UserSchema;

          return schema;
        },
      },
    ]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
