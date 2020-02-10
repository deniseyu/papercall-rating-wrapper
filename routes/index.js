var express = require('express');
var router = express.Router();
var passport = require('../config/passport');
var client
var basicAuth = passport.authenticate('local', { failureRedirect: '/login'})
var loggedIn = require('connect-ensure-login').ensureLoggedIn

// heroku readiness
if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  client = require("redis").createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(":")[1]);
} else {
  client = require("redis").createClient();
}

client.on("error", function(error) {
  console.error(error);
});

router.get('/', loggedIn(), function(req, res, next) {
  client.keys('*', function(err, keys) {
    res.render('index', { numbers: keys, user: req.user });
  })
});

router.get('/login', function(req, res) {
  res.render('login')
})

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
})

router.get('/success',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    res.send('login successful. Click <a href="/">here</a> to go home')
})

router.post('/login', basicAuth, function(req, res) {
  res.redirect('/success');
})

router.post('/seed/:number', loggedIn(), function(req, res, next) {
  var key = req.params.number
  var val = JSON.stringify(req.body)
  client.set(key, val, function(err, reply) {
    res.send(reply)
  })
});

router.get('/proposals/:key', loggedIn(), function(req, res, next) {
  var key = req.params.key
  client.get(key, function(err, reply) {
    var proposal = JSON.parse(reply)
    if (reply === null) {
      return res.send(`No proposal with ID ${key} exists!`)
    }

    res.render('talk', {
      number: key,
      proposal: proposal,
      user: req.user
    });
  });
})

router.get('/proposals/:key/edit', function(req, res, next) {
  var key = req.params.key
  client.get(key, function(err, reply) {
    var proposal = JSON.parse(reply)
    if (reply === null) {
      return res.send(`No proposal with ID ${key} exists!`)
    }

    res.render('update', {
      number: key,
      proposal: proposal,
      user: req.user
    });
  });
})

router.post('/proposals/:key', function(req, res, next) {
    var key = req.params.key
    var val = JSON.stringify(req.body)
    client.set(key, val, function(err, reply) {
      res.render('talk', {
        number: key,
        proposal: req.body,
        updated: true,
        user: req.user
      })
    })
})

module.exports = router;
