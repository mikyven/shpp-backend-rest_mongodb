import express from 'express';
import bcrypt from 'bcryptjs';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../database.service.js';
import { TUser } from '../types.js';

const authRouter = express.Router();

const emailRegEx = /^\w+@[\D]{1,}[\w]+\.[a-zA-Z_]{2,}$/;

authRouter
  .post('/login', async (req, res) => {
    const { login, pass }: TUser = req.body;

    if (!emailRegEx.test(login)) {
      res.status(400).send({ error: 'bad request' });
      return;
    }

    const user = ((await db.query(`SELECT * FROM users WHERE login='${login}'`))[0] as RowDataPacket)[0];
    if (!user) {
      res.status(404).send({ error: 'not found' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(pass, user?.pass);
    if (!isPasswordValid) {
      res.status(404).send({ error: 'not found' });
      return;
    }

    req.session.login = login;
    req.session.userId = user?._id;
    res.status(200).json({ ok: true });
  })
  .post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: 'internal server error' });
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ ok: true });
    });
  })
  .post('/register', async (req, res) => {
    const { login, pass } = req.body;

    if (!emailRegEx.test(login)) {
      res.status(400).send({ error: 'bad request' });
      return;
    }

    const existingUser = ((await db.query(`SELECT * FROM users WHERE login='${login}'`))[0] as RowDataPacket)[0];
    if (existingUser) {
      res.status(400).send({ error: 'bad request' });
      return;
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    const newUser = {
      login,
      pass: hashedPassword,
    };

    const result = (
      await db.query(`INSERT INTO users (login, pass)
      VALUES ('${newUser.login}', '${newUser.pass}')`)
    )[0] as ResultSetHeader;

    req.session.login = login;
    req.session.userId = result.insertId;
    res.status(201).send({ ok: true });
  });

export default authRouter;
