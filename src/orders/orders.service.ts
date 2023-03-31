import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { UserDocument } from 'src/users/schema/users.schema';
import { CreateOrderDto } from './dto/orders.dto';
import { Order, OrderDocument } from './schema/orders.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async createOrder(user: UserDocument, createOrderDto: CreateOrderDto) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const result = await this.orderModel.create([createOrderDto], {
        session,
      });

      user.cart.storedProducts = []; //주문하였으므로 장바구니를 비운다
      user.cart.totalPrice = 0;

      user.markModified('cart');

      await user.save();

      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }
}
