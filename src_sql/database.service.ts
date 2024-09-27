import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const dbOptions = {
  host: 'localhost',
  user: process.env.MYSQL_USER_NAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.DB_NAME,
};

export const db = await mysql.createConnection(dbOptions).then((result) => {
  console.log(`Connected to MySQL as ID ${result.threadId}`);
  return result;
});
