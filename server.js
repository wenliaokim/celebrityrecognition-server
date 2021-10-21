const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'liaowen',
    password : '',
    database : 'celebrityrecog'
  }
});

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('welcome');
})

app.post('/signin', (req, res) => {
  const {username, password} = req.body;
  db.select('username', 'hash').from('logins')
    .where('username', '=', username)
    .then(logindata => {
      if (bcrypt.compareSync(password, logindata[0].hash)) {
        return db.select('*').from('users')
          .where('username', '=', username)
          .then(user => {
            res.json(user[0])
          })
          .catch(err => res.status(400).json('unable to get user'))
      } else {
        res.status(400).json('wrong password')
      }
    })
    .catch(err => res.status(400).json('wrong information'))
})

app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  const hash = bcrypt.hashSync(password);

  if (username && email && password) {
    db.transaction(trx => {
      trx.insert({hash: hash,username: username})
      .into('logins')
      .returning('username')
      .then(loginUsername => {
        return trx('users')
          .returning('*')
          .insert({email: email, username: loginUsername[0]})
          .then(user => {
            res.json(user[0]);
          })
      })
      .then(trx.commit)
      .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register'))
  } else {
    res.status(400).json('lack input')
  }
})

// app.get('/profile/:id', (req, res) => {
//   const { id } = req.params;
//   db.select('*').from('users').where({id})
//     .then(user => {
//       if (user.length) {
//         res.json(user[0]);
//       } else {
//         res.status(400).json('not found the id');
//       }
//     })
//     .catch(err => res.status(400).json('some error'));
// })

app.put('/image', (req, res) => {
  const { id } = req.body;
  db('users').where('id', '=', id)
  .increment('entries', 1)
  .returning('entries')
  .then(entries => {
    res.json(entries[0]);
  })
  .catch(err => res.status(400).json('some error'));
})


app.listen(3000, () => {
  console.log('app is runing on port 3000');
})