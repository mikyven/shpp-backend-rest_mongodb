import express from 'express';
import bcrypt from 'bcryptjs';
import { collections } from '../database.service.js';
import { TUser } from '../types';

const authRouter = express.Router();

authRouter
  .post('/login', async (req, res) => {
    const { login, pass }: TUser = req.body;

    const user = await collections.users.findOne({ login });
    if (!user) {
      return res.status(404).send({ error: 'not found' });
    }

    const isPasswordValid = await bcrypt.compare(pass, user?.pass);
    if (!isPasswordValid) {
      return res.status(404).send({ error: 'not found' });
    }

    req.session.login = login;
    req.session.userId = user?._id;
    return res.status(201).json({ ok: true });
  })
  .post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: 'internal server error' });
      }
      res.clearCookie('connect.sid');
      res.status(201).json({ ok: true });
    });
  })
  .post('/register', async (req, res) => {
    const { login, pass } = req.body;

    const existingUser = await collections.users.findOne({ login });
    if (existingUser) {
      return res.status(400).send({ error: 'bad request' });
    }

    const hashedPassword = await bcrypt.hash(pass, 10);

    const newUser = {
      login,
      pass: hashedPassword,
    };

    const result = await collections.users.insertOne(newUser);

    req.session.login = login;
    req.session.userId = result.insertedId;
    return res.status(201).send({ ok: true });
  });

export default authRouter;
