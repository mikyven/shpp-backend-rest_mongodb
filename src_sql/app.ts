import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MySQLStore from 'express-mysql-session';
import dotenv from 'dotenv';
import { dbOptions } from './database.service.js';
import itemsRouter from './routes/items.router.js';
import authRouter from './routes/auth.router.js';
import router from './routes/router.js';

const app = express();
const v1 = express.Router();
const v2 = express.Router();

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, origin || '*');
    },
    credentials: true,
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: './static' });
});

const sessionStore = new (MySQLStore(session))(dbOptions);

dotenv.config();

app.use(
  session({
    secret: process.env.SESSION_SECRET || '',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { maxAge: 1000 * 60 * 30 },
  })
);

v1.use('/items', itemsRouter);
v1.use('/', authRouter);
app.use('/api/v1', v1);

v2.use('/', router);
app.use('/api/v2', v2);

app.listen(3000, () => {
  console.log('listening on port 3000');
});
