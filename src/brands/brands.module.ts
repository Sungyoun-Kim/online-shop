import { Module } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Brand, BrandSchema } from './schema/brands.schema';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Brand.name,

        useFactory: () => {
          const schema = BrandSchema;

          return schema;
        },
      },
    ]),
  ],
  providers: [BrandsService],
  controllers: [BrandsController],
  exports: [BrandsService],
})
export class BrandsModule {}
