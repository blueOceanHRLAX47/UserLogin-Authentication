// require('newrelic');
const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const router = require('./routes');
const port = 3000;


app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/', router);


app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login'
}));


app.listen(port, () => {
  console.log(`listening on port ${port}`);
});