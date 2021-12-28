const mysql = require("mysql");
const dotenv = require('dotenv');
require('dotenv').config();

// global.conn = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "",
//   database: "alive",
//   charset: "utf8mb4",
// });
global.conn = mysql.createConnection({
  host: process.env.HOST,
  user: 'admin',
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  charset: process.env.CHARSET,
});

let connection = async function () {
  try {
    await conn.connect();
    console.log("Connected to SQL.");
  } catch (error) {
    console.log("Error in connecting to database");
    return error;
  }
};
module.exports = connection;
