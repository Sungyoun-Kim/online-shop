import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

@Injectable()
export class StringToObjectIdPipe
  implements PipeTransform<string, Types.ObjectId>
{
  transform(value: string, metadata: ArgumentMetadata): Types.ObjectId {
    if (!value) {
      throw new BadRequestException('parameter is not given');
    }

    if (!value.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestException(' cannot change value to object id');
    }
    return new Types.ObjectId(value);
  }
}
@Injectable()
export class CommaToArrayPipe implements PipeTransform<Object, Object> {
  transform(values: Object, metadata: ArgumentMetadata): Object {
    Object.keys(values).map((value) => {
      // 문자와 문자 사이에 쉼표를 포함하고있다면
      if (
        !Number.isInteger(values[value]) &&
        values[value].match(
          /^(([a-zA-Zㄱ-ㅎ|ㅏ-ㅣ|가-힣]+\s?[a-zA-Zㄱ-ㅎ|ㅏ-ㅣ|가-힣]|[a-zA-Zㄱ-ㅎ|ㅏ-ㅣ|가-힣])(=?\,{1}([a-zA-Zㄱ-ㅎ|ㅏ-ㅣ|가-힣]+\s?[a-zA-Zㄱ-ㅎ|ㅏ-ㅣ|가-힣]|[a-zA-Zㄱ-ㅎ|ㅏ-ㅣ|가-힣])))+$/,
        )
      ) {
        values[value] = values[value].split(',');
      } else {
        values[value] = [values[value]];
      }
    });

    return values;
  }
}
