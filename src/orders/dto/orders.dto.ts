import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Cart, User } from 'src/users/schema/users.schema';

export class CreateOrderDto {
  @IsString()
  address: string;

  @IsOptional()
  user: User;

  @IsOptional()
  cart: Cart;
}
