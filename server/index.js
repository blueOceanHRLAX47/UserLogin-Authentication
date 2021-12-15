const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const proxy = require('express-http-proxy');
const router = require('./routes');
const { sequelize, User } = require('../database');
const { QueryTypes } = require('sequelize');
const port = 3000;

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = require('../config.js');

//Middleware

//Use the req.isAuthenticated() function to check if user is Authenticated
checkAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// app.use(express.static(path.join(__dirname, '../Cultivate_Frontend/client/dist')));

app.use('/', router);

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize()); // init passport on every route call
app.use(passport.session()); //allow passport to use 'express-session'

app.use('/home', createProxyMiddleware({
  target: 'http://10.32.7.43',
  changeOrigin: true,
}))

// How http-proxy-middleware works:
// It takes everything on this /proxy/... route and redirects it to target/proxy/...
// so in this example going to localhost:3000/proxy -> localhost:3001/proxy
// even though I didn't specify that I want to go to /proxy on the target
// with the pathRewrite option I can select the path to goto a different path on the target
app.use('/api/calendar', [checkAuthenticated, createProxyMiddleware({
  target: 'http://10.32.8.102',
  changeOrigin: true,
  pathRewrite: { '/api/calendar': '/' },
  onProxyReq: (proxyReq, req, res) => {
    // Here we are writing the body and user of this req to the targets req
    // To do this we need to set the http headers to application/json and set the length in bytes
    // we then write the body with user attached as an key in the object
    // then we have req.body and req.body.user on our target's req!
    let body = req.body;
    body.user = req.user;
    proxyReq.setHeader('Content-Type', 'application/json');
    proxyReq.setHeader('Content-Length', Buffer.byteLength(JSON.stringify(body)));
    proxyReq.write(JSON.stringify(body));
  },
})]);


app.use('/api/recipes', [checkAuthenticated, createProxyMiddleware({
  target: 'http://10.32.10.45/',
  changeOrigin: true,
  pathRewrite: { '/api/recipes': '/' },
  onProxyReq: (proxyReq, req, res) => {
    // Here we are writing the body and user of this req to the targets req
    // To do this we need to set the http headers to application/json and set the length in bytes
    // we then write the body with user attached as an key in the object
    // then we have req.body and req.body.user on our target's req!
    let body = req.body;
    body.user = req.user;
    proxyReq.setHeader('Content-Type', 'application/json');
    proxyReq.setHeader('Content-Length', Buffer.byteLength(JSON.stringify(body)));
    proxyReq.write(JSON.stringify(body));
  },
})]);

app.use('/api/workouts', [checkAuthenticated, createProxyMiddleware({
  target: 'http://10.32.14.179',
  changeOrigin: true,
  pathRewrite: { '/api/workouts': '/' },
  onProxyReq: (proxyReq, req, res) => {
    let body = req.body;
    body.user = req.user;
    proxyReq.setHeader('Content-Type', 'application/json');
    proxyReq.setHeader('Content-Length', Buffer.byteLength(JSON.stringify(body)));
    proxyReq.write(JSON.stringify(body));
  },
})]);

app.use('/api/forum', [checkAuthenticated, createProxyMiddleware({
  target: 'http://10.32.0.112',
  changeOrigin: true,
  pathRewrite: { '/api/forum': '/' },
  onProxyReq: (proxyReq, req, res) => {
    let body = req.body;
    body.user = req.user;
    proxyReq.setHeader('Content-Type', 'application/json');
    proxyReq.setHeader('Content-Length', Buffer.byteLength(JSON.stringify(body)));
    proxyReq.write(JSON.stringify(body));
  },
})]);

authUser = async (request, accessToken, refreshToken, profile, done) => {
  const user = await User.findOrCreate({
    where: {
      google_id: profile.id
    },
    defaults: {
      google_id: profile.id,
      name: profile.displayName,
      profile_photo_url: profile.photos[0].value,
      weight: null,
      age: null,
      is_coach: false,
      coach_id: null
    }
  })
  done(null, user[0]);
};


//Use 'GoogleStrategy' as the Authentication Strategy
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  // callbackURL: 'http://localhost:3000/auth/google/callback',
  callbackURL: 'http://cultiveight.net/auth/google/callback',
  passReqToCallback: true
}, authUser));


passport.serializeUser((user, done) => {
  // console.log('\n--------> Serialize User:');
  // console.log(user);
  // The USER object is the 'authenticated user' from the done() in authUser function.
  // serializeUser() will attach this user to 'req.session.passport.user.{user}', so that it is tied to the session object for each session.

  done(null, user);
});


passport.deserializeUser((user, done) => {
  // console.log('\n--------- Deserialized User:');
  // console.log(user);
  // This is the {user} that was saved in req.session.passport.user.{user} in the serializationUser()
  // deserializeUser will attach this {user} to the 'req.user.{user}', so that it can be used anywhere in the App.

  done(null, user);
});


//Start the NODE JS server
app.listen(3000, () => console.log('Server started on port 3000...'));

app.get('/auth/google',
  passport.authenticate('google', {
    scope:
      ['email', 'profile']
  }
  ));

app.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/login'
  }));

//Define the Login Route
app.get('/login', (req, res) => {
  res.redirect('/auth/google');
});


//Define the Protected Route, by using the 'checkAuthenticated' function defined above as middleware
// home/calendar
app.get('/', checkAuthenticated, (req, res) => {
  res.send(req.user);
});

//Define the Logout
app.post('/logout', (req, res) => {
  req.logOut();
  res.redirect('/login');
});

