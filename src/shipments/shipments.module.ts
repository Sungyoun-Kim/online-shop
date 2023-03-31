import { Module } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Shipment, ShipmentSchema } from './schema/shipments.schema';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Shipment.name,

        useFactory: () => {
          const schema = ShipmentSchema;

          return schema;
        },
      },
    ]),
  ],
  providers: [ShipmentsService],
  controllers: [ShipmentsController],
})
export class ShipmentsModule {}
