import { IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  _id: string;

  @IsOptional()
  @IsString()
  parent: string;
}

export class UpdateCategoryDto {
  @IsString()
  _id: string;
}
