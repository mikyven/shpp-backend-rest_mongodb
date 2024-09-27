/* eslint-disable @typescript-eslint/explicit-function-return-type */
import express from 'express';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { collections } from '../database.service.js';
import { TItem, TUser } from '../types';

const router = express.Router();

router.post('/router', (req, res) => {
  const { action } = req.query;

  if ((action as string).toLowerCase().includes('item') && !req.session.login) {
    res.status(403).send({ error: 'forbidden' });
    return;
  }

  const loginFunction = async () => {
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
  };

  const logoutFunction = () => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: 'internal server error' });
      }
      res.clearCookie('connect.sid');
      res.status(201).json({ ok: true });
    });
  };

  const registerFunction = async () => {
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
  };

  const getItems = async () => {
    try {
      const items = await collections.items?.find({ login: req.session.login }).toArray();
      return res.status(200).send({ items });
    } catch (err) {
      return res.status(500).send({ error: 'internal server error' });
    }
  };

  const createItem = async () => {
    try {
      const { text } = req.body;
      const result = await collections.items?.insertOne({ text, checked: false, login: req.session.login });

      if (result) {
        res.status(201).send({ id: result.insertedId });
      } else {
        res.status(500).send({ error: 'internal server error' });
      }
    } catch {
      res.status(400).send({ error: 'bad request' });
    }
  };

  const updateItem = async () => {
    try {
      const { id, text, checked }: TItem = req.body;
      if (!id) throw new Error();
      const query = { _id: new ObjectId(id) };
      const result = await collections.items?.updateOne(query, { $set: { text, checked, login: req.session.login } });

      if (result?.modifiedCount) {
        res.status(200).send({ ok: true });
      } else {
        res.status(304).send({ error: 'not modified' });
      }
    } catch (err) {
      res.status(400).send({ error: 'bad request' });
    }
  };

  const deleteItem = async () => {
    try {
      const query = { _id: new ObjectId(req.body.id as string) };
      const result = await collections.items?.deleteOne(query);

      if (result && result.deletedCount) {
        res.status(200).send({ ok: true });
      } else if (!result) {
        res.status(400).send({ error: 'bad request' });
      } else if (!result.deletedCount) {
        res.status(404).send({ error: 'not found' });
      }
    } catch (error) {
      res.status(400).send({ error: 'bad request' });
    }
  };

  switch (action) {
    case 'login':
      loginFunction();
      break;
    case 'logout':
      logoutFunction();
      break;
    case 'register':
      registerFunction();
      break;
    case 'getItems':
      getItems();
      break;
    case 'createItem':
      createItem();
      break;
    case 'updateItem':
      updateItem();
      break;
    case 'deleteItem':
      deleteItem();
      break;
    default:
      res.status(400).send({ error: 'bad request' });
  }
});

export default router;
