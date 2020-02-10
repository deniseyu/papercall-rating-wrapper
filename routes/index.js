var express = require('express');
var router = express.Router();
var passport = require('../config/passport');
var redis = require('../config/redis');
var async = require('async');

var basicAuth = passport.authenticate('local', { failureRedirect: '/login'})
var loggedIn = require('connect-ensure-login').ensureLoggedIn

router.get('/', loggedIn(), function(req, res) {
  // todo: only fetch all keys once, then memoize - this is bad for prod
  redis.keys("*", function(err, keys) {
    var talkKeys = keys.filter(key => !key.includes(':')) // for now ':' denotes a rating
    var myAssignments

    function getTalks(keys, cb) {
      redis.mget(keys, function(err, talks) {
        var talksCB = talks.map(t => JSON.parse(t)).map((t, ind) => {
          t.id = keys[ind]
          return t
        })
        var talksResult = { all: talksCB, notMine: [], mine: [] }
        cb(null, talksResult)
      })
    }

    function isolateAssigned(talksResult, cb) {
      redis.lrange(`assign:${req.user.username}`, 0, 1000, function(err, reply) {
        var myTalkIDs = reply
        talksResult.mine = talksResult.all.filter(talk => myTalkIDs.includes(talk.id))
        cb(null, talksResult)
      })
    }

    var processTalks = async.compose(isolateAssigned, getTalks)

    processTalks(talkKeys, function(err, results) {
      res.render('index', {
        mine: results.mine,
        talks: results.all,
        user: req.user
      })
    })
  })
});

router.post('/assign/:user/:talkID', function(req, res) {
  var key = `assign:${req.params.user}`
  redis.rpush(key, req.params.talkID, function(err, reply) {
    console.log(reply)
    res.json(reply)
  })
})

router.get('/assign/:user', function(req, res) {
  var key = `assign:${req.params.user}`
  redis.lrange(key, 0, 100, function(err, reply) {
    res.json(reply)
  })
})

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
