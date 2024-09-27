// eslint-disable-next-line @typescript-eslint/no-unused-vars
import session from 'express-session';
import { ObjectId } from 'mongodb';

declare module 'express-session' {
  interface SessionData {
    userId: ObjectId;
    login: string;
  }
}
