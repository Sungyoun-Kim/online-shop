import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schema/products.schema';
import {
  BoutiqueProduct,
  BoutiqueProductSchema,
} from './schema/boutique-product.schema';

import { Boutique, BoutiqueSchema } from './schema/boutique.schema';
import { MulterModule } from '@nestjs/platform-express';
import { multerConfig } from 'src/utility/multer.utility';
import { CategoriesModule } from 'src/categories/categories.module';
import { User, UserSchema } from 'src/users/schema/users.schema';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    UsersModule,
    MulterModule.registerAsync(multerConfig),
    CategoriesModule,
    MongooseModule.forFeatureAsync([
      {
        name: Product.name,

        useFactory: () => {
          const schema = ProductSchema;

          return schema;
        },
      },

      {
        name: Boutique.name,

        useFactory: () => {
          const schema = BoutiqueSchema;

          return schema;
        },
      },
      {
        name: BoutiqueProduct.name,

        useFactory: () => {
          const schema = BoutiqueProductSchema;

          return schema;
        },
      },
    ]),
  ],
  providers: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule {}
