const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

const { isAuthDataCorrect } = require('../../middleware');
const { mysqlDatabase, jwtSecretKey } = require('../../config');

router.post('/register', isAuthDataCorrect, async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlDatabase);

    const hashedPassword = bcrypt.hashSync(req.userData.password, 10);

    const [data] = await con.execute(
      `INSERT INTO users (email, password) VALUES (${mysql.escape(
        req.userData.email,
      )}, '${hashedPassword}')`,
    );

    con.end();

    if (data.affectedRows !== 1) {
      return res.status(500).send({ error: 'An unexpected error occured.' });
    }

    return res.send({ msg: 'Successfully added account' });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: 'An unexpected error occured.' });
  }
});

router.post('/login', isAuthDataCorrect, async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlDatabase);

    const [data] = await con.execute(
      `SELECT * FROM users WHERE email = ${mysql.escape(req.userData.email)}`,
    );

    if (data.length === 0) {
      res.status(400).send({ error: 'Email or password incorrect' });
    }

    const passwordCheck = await bcrypt.compareSync(
      req.userData.password,
      data[0].password,
    );

    if (!passwordCheck) {
      return res.status(400).send({ error: 'Email or password incorrect' });
    }

    const token = jwt.sign(
      { id: data[0].id, email: data[0].email },
      jwtSecretKey,
    );

    return res.send({ msg: 'Successfully logged in', token });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: 'An unexpected error occured.' });
  }
});

module.exports = router;
