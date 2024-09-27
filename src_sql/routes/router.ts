/* eslint-disable @typescript-eslint/explicit-function-return-type */
import express from 'express';
import bcrypt from 'bcryptjs';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { TItem, TResponseItem, TUser } from '../types';
import { db } from '../database.service';

const router = express.Router();

router.post('/router', (req, res) => {
  const { action } = req.query;

  if ((action as string).toLowerCase().includes('item') && !req.session.login) {
    res.status(403).send({ error: 'forbidden' });
    return;
  }

  async function loginFunction() {
    const { login, pass }: TUser = req.body;

    if (!/^[\w@.]+$/i.test(login)) {
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
  }

  function logoutFunction() {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: 'internal server error' });
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ ok: true });
    });
  }

  async function registerFunction() {
    const { login, pass } = req.body;

    if (!/^[\w@.]+$/i.test(login)) {
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
  }

  async function getItems() {
    try {
      const result = (await db.query(`SELECT * FROM items WHERE login='${req.session.login}'`))[0] as TResponseItem[];
      res.status(200).send({ items: result.map((i) => ({ ...i, checked: !!i.checked.readInt8() })) });
    } catch (err) {
      res.status(500).send({ error: 'internal server error' });
    }
  }

  async function createItem() {
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
  }

  async function updateItem() {
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
  }

  async function deleteItem() {
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
  }

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
