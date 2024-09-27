import express from 'express';
import { ObjectId } from 'mongodb';
import { collections } from '../database.service.js';
import { TItem } from '../types.js';

const itemsRouter = express.Router();
itemsRouter.use('/', (req, res, next) => {
  if (!req.session.login) {
    res.status(403).send({ error: 'forbidden' });
    return;
  }
  next();
});

itemsRouter
  .route('/')
  .get(async (req, res) => {
    try {
      const items = await collections.items?.find({ login: req.session.login }).toArray();
      return res.status(200).send({ items });
    } catch (err) {
      return res.status(500).send({ error: 'internal server error' });
    }
  })
  .post(async (req, res) => {
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
  })
  .put(async (req, res) => {
    try {
      const { id, text, checked }: TItem = req.body;
      if (!id) throw new Error();
      const query = { _id: new ObjectId(id) };
      const result = await collections.items?.updateOne(query, { $set: { text, checked } });

      if (result?.modifiedCount) {
        res.status(200).send({ ok: true });
      } else {
        res.status(304).send({ error: 'not modified' });
      }
    } catch (err) {
      res.status(400).send({ error: 'bad request' });
    }
  })
  .delete(async (req, res) => {
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
  });

export default itemsRouter;
