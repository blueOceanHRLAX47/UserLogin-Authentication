const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const router = require('./routes');
const port = 3000;

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = require('../config.js');

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/', router);

//Middleware
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize()); // init passport on every route call
app.use(passport.session()); //allow passport to use 'express-session'


authUser = (request, accessToken, refreshToken, profile, done) => {
  // TODO: Create new user if user doesnt exsist
  // Have google_id in schema = profile.id
  return done(null, profile);
};


//Use 'GoogleStrategy' as the Authentication Strategy
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/google/callback',
  passReqToCallback: true
}, authUser));


passport.serializeUser((user, done) => {
  console.log('\n--------> Serialize User:');
  console.log(user);
  // The USER object is the 'authenticated user' from the done() in authUser function.
  // serializeUser() will attach this user to 'req.session.passport.user.{user}', so that it is tied to the session object for each session.

  done(null, user);
});


passport.deserializeUser((user, done) => {
  console.log('\n--------- Deserialized User:');
  console.log(user);
  // This is the {user} that was saved in req.session.passport.user.{user} in the serializationUser()
  // deserializeUser will attach this {user} to the 'req.user.{user}', so that it can be used anywhere in the App.

  done(null, user);
});


//Start the NODE JS server
app.listen(3000, () => console.log('Server started on port 3000...'));


//console.log() values of 'req.session' and 'req.user' so we can see what is happening during Google Authentication
let count = 1;
showlogs = (req, res, next) => {
  console.log('\n==============================');
  console.log(`------------>  ${count++}`);

  console.log('\n req.session.passport -------> ');
  console.log(req.session.passport);

  console.log('\n req.user -------> ');
  console.log(req.user);

  console.log('\n Session and Cookie');
  console.log(`req.session.id -------> ${req.session.id}`);
  console.log('req.session.cookie -------> ');
  console.log(req.session.cookie);

  console.log('===========================================\n');

  next();
};

app.use(showlogs);


app.get('/auth/google',
  passport.authenticate('google', {
    scope:
      ['email', 'profile']
  }
  ));

app.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/dashboard',
    failureRedirect: '/login'
  }));

//Define the Login Route
app.get('/login', (req, res) => {
  res.send({ data: 'login' }).status(200);
  // res.render('login.ejs');
});


//Use the req.isAuthenticated() function to check if user is Authenticated
checkAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
};

//Define the Protected Route, by using the 'checkAuthenticated' function defined above as middleware
// home/calendar
app.get('/', checkAuthenticated, (req, res) => {
  res.send(`Welcome to Cultivate ${req.user.displayName}`).status(200);
  // res.render('dashboard.ejs', { name: req.user.displayName });
});

//Define the Logout
app.post('/logout', (req, res) => {
  req.logOut();
  res.redirect('/login');
  console.log('-------> User Logged out');
});

// app.listen(port, () => {
//   console.log(`listening on port ${port}`);
// });