import express from 'express';
import { ResultSetHeader } from 'mysql2/promise';
import { db } from '../database.service.js';
import { TItem, TResponseItem } from '../types.js';

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
      const result = (await db.query(`SELECT * FROM items WHERE login='${req.session.login}'`))[0] as TResponseItem[];
      res.status(200).send({ items: result.map((i) => ({ ...i, checked: !!i.checked.readInt8() })) });
    } catch (err) {
      res.status(500).send({ error: 'internal server error' });
    }
  })
  .post(async (req, res) => {
    try {
      const { text } = req.body;
      const result = (
        await db.query(
          `INSERT INTO items (text, checked, login)
      VALUES ('${text}', 0, '${req.session.login}')`
        )
      )[0] as ResultSetHeader;

      if (result) {
        res.status(201).send({ id: (result as ResultSetHeader).insertId });
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
      if (!id || !Number(id)) throw new Error();

      const result = (
        await db.query(
          `UPDATE items
      SET text='${text}', checked=${+checked}
      WHERE id=${id}`
        )
      )[0] as ResultSetHeader;

      if (result.affectedRows) {
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
      const { id } = req.body;
      if (!id || !Number(id)) throw new Error();

      const result = (await db.query(`DELETE FROM items WHERE id=${id}`))[0] as ResultSetHeader;

      if (result && result.affectedRows) {
        res.status(200).send({ ok: true });
      } else if (!result) {
        res.status(400).send({ error: 'bad request' });
      } else if (!result.affectedRows) {
        res.status(404).send({ error: 'not found' });
      }
    } catch (error) {
      res.status(400).send({ error: 'bad request' });
    }
  });

export default itemsRouter;
