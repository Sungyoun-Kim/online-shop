import * as Express from 'express';
import { Participant } from 'src/participants/schemas/participants.schema';
import { User } from '../users/schema/users.schema';
interface user extends User {}
declare global {
  namespace Express {
    export interface User extends user {}
    export interface Request {
      user: User;
      params: any;
      cookies: {
        access_token: {
          token: string;
        };
      };
    }
  }
}
export interface payload {
  type: string;
  sub: string;
  name: string;
  brand: Types.ObjectId;
  registerType: string;
}
