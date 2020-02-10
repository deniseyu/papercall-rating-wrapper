var express = require('express');
var router = express.Router();
var passport = require('../config/passport');
var redis = require('../config/redis');

var basicAuth = passport.authenticate('local', { failureRedirect: '/login'})
var loggedIn = require('connect-ensure-login').ensureLoggedIn

router.get('/', loggedIn(), function(req, res) {
  // todo: only fetch all keys once, then memoize - this is bad for prod
  redis.keys("*", function(err, keys) {
    talkKeys = keys.filter(key => !key.includes(':')) // for now means ':' denotes a rating
    res.render('index', { numbers: talkKeys, user: req.user });
  })
});

router.get('/login', function(req, res) {
  res.render('login')
})

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
})

router.get('/success', loggedIn(), function(req, res){
    res.send('login successful. Click <a href="/">here</a> to go home')
})

router.post('/login', basicAuth, function(req, res) {
  res.redirect('/success');
})

router.post('/seed/:number', function(req, res) {
  var key = req.params.number
  var val = JSON.stringify(req.body)
  redis.set(key, val, function(err, reply) {
    res.send(reply)
  })
});

module.exports = router;
