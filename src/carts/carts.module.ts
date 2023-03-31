import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from './schema/carts.schema';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Cart.name,

        useFactory: () => {
          const schema = CartSchema;

          return schema;
        },
      },
    ]),
  ],
  providers: [CartsService],
  controllers: [CartsController],
})
export class CartsModule {}
