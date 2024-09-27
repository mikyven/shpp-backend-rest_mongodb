import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import itemsRouter from './routes/items.router.js';
import authRouter from './routes/auth.router.js';
import router from './routes/router.js';
import { connectToDatabase } from './database.service.js';

const app = express();
const v1 = express.Router();
const v2 = express.Router();

connectToDatabase()
  .then(() => {
    app.use(
      cors({
        origin: (origin, callback) => {
          callback(null, origin || '*');
        },
        credentials: true,
      })
    );

    app.get('/', (req, res) => {
      res.sendFile('index.html', { root: './static' });
    });

    app.use(
      session({
        secret: process.env.SESSION_SECRET || '',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
          mongoUrl: `${process.env.MONGODB_CONNECT_STRING}/${process.env.DB_NAME}` || '',
        }),
        cookie: { maxAge: 1000 * 60 * 30 },
      })
    );

    app.use(express.json());

    v1.use('/items', itemsRouter);
    v1.use('/', authRouter);
    app.use('/api/v1', v1);

    v2.use('/', router);
    app.use('/api/v2', v2);

    app.listen(3000, () => {
      console.log('listening on port 3000');
    });
  })
  .catch((error: Error) => {
    console.error('Database connection failed', error);
    process.exit();
  });
