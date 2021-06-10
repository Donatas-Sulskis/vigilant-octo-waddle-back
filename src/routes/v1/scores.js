const express = require('express');
const Joi = require('joi');
const mysql = require('mysql2/promise');
const { mysqlDatabase } = require('../../config');

const router = express.Router();

const { isLoggedIn } = require('../../middleware');

const scoreSchema = Joi.object({
  id: Joi.number(),
  score: Joi.number(),
});

router.get('/my-scores', isLoggedIn, async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlDatabase);
    const [data] = await con.execute(
      `SELECT * FROM scores WHERE user_id = ${req.user.id}`,
    );

    con.end();

    return res.send({ scores: data });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: 'Unexpected error occured' });
  }
});

router.post('/add-score', isLoggedIn, async (req, res) => {
  let score;
  try {
    score = await scoreSchema.validateAsync({
      id: req.user.id,
      score: req.body.score,
    });
  } catch (e) {
    return res.status(400).send({ error: 'Incorrect data passed' });
  }

  try {
    const con = await mysql.createConnection(mysqlDatabase);
    const [data] = await con.execute(
      `INSERT INTO scores (user_id, score) VALUES (${score.id}, ${score.score})`,
    );

    con.end();

    if (data.affectedRows !== 1) {
      return res.status(500).send({ error: 'Unexpected error occured' });
    }

    return res.send({ msg: 'Successfully logged a new score' });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: 'Unexpected error occured' });
  }
});

router.get('/highscores', async (req, res) => {
  try {
    const con = await mysql.createConnection(mysqlDatabase);
    const [data] = await con.execute(
      'SELECT * FROM scores ORDER BY score DESC LIMIT 5',
    );

    con.end();

    return res.send({ scores: data });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: 'Unexpected error occured' });
  }
});

module.exports = router;
