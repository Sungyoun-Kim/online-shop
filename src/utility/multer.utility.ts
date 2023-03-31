import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as mime from 'mime';
import * as uuid from 'uuid';

export const multerConfig = {
  imports: [ConfigModule],
  useFactory: async (config: ConfigService) => ({
    storage: diskStorage({
      destination: function (req, file, cb) {
        let dest = `../temp`;

        cb(null, dest);

        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
      },

      filename: (req, file, cb) => {
        cb(null, `${uuid.v4()}.${mime.getExtension(file.mimetype)}`);
      },
    }),
  }),
  inject: [ConfigService],
};
