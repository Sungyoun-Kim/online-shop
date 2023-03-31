import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from 'src/users/users.service';
import { CreateOrderDto } from './dto/orders.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly orderService: OrdersService,
    private readonly userService: UsersService,
  ) {}

  @Post()
  async createOrder(
    @Req() req: Express.Request,
    @Body() createOrderDto: CreateOrderDto,
    @Res() res: Response,
  ) {
    const user = await this.userService.findUserById(req.user._id);
    if (!user) {
      throw new NotFoundException('다시 로그인해주세요.');
    }
    if (user.cart.storedProducts.length == 0) {
      throw new BadRequestException('주문한 상품이 없습니다');
    }
    createOrderDto.user = user;
    createOrderDto.cart = user.cart;

    const result = await this.orderService.createOrder(user, createOrderDto);
    res.status(201).json(result);
  }
}
