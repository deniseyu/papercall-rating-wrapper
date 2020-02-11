var express = require('express');
var router = express.Router();
var passport = require('../config/passport');
var redis = require('../config/redis');
var async = require('async');

var basicAuth = passport.authenticate('local', { failureRedirect: '/login'})
var loggedIn = require('connect-ensure-login').ensureLoggedIn

// running redis.keys is risky for memory, and set of talks unlikely to change
var memoizedKeys // so let's cache it in application memory

router.get('/', loggedIn(), function(req, res) {
  function getAllKeys(matcher, cb) {
    if (memoizedKeys) {
      console.log('using keys from mem')
      return cb(null, memoizedKeys)
    }
    redis.keys(matcher, function(err, results) {
      console.log('pulling from redis')
      memoizedKeys = results.filter(key => !key.includes(':')) // for now ':' denotes a rating
      cb(null, memoizedKeys)
    })
  }

  function getTalks(keys, cb) {
    redis.mget(keys, function(err, talks) {
      var talksResult = { all: [], pending: [], mine: [] }
      if (talks == null || talks.length == 0) { return cb(null, talksResult) }
      var talksCB = talks.map(t => JSON.parse(t)).map((t, ind) => {
        t.id = keys[ind]
        return t
      })
      talksResult.all = talksCB
      cb(null, talksResult)
    })
  }

  function isolateAssigned(talksResult, cb) {
    redis.lrange(`assign:${req.user.username}`, 0, 1000, function(err, myTalkIDs) {
      talksResult.mine = talksResult.all.filter(talk => myTalkIDs.includes(talk.id))
      talksResult.notMine = talksResult.all.filter(talk => !myTalkIDs.includes(talk.id))
      cb(null, talksResult)
    })
  }

  function pendingReview(talksResult, cb) {
    redis.lrange(`complete:${req.user.username}`, 0, 1000, function(err, reply) {
      talksResult.pending = talksResult.mine.filter(t => !reply.includes(t.id))
      talksResult.completed = talksResult.mine.filter(t => reply.includes(t.id))
      cb(null, talksResult)
    })
  }

  var processTalks = async.compose(pendingReview, isolateAssigned, getTalks, getAllKeys)

  processTalks("*", function(err, results) {
    res.render('index', {
      pending: results.pending,
      mine: results.mine,
      completed: results.completed,
      others: results.notMine,
      user: req.user
    })
  })
})

router.post('/assign/:user/:talkID', function(req, res) {
  var key = `assign:${req.params.user}`
  redis.rpush(key, req.params.talkID, function(err, reply) {
    console.log(reply)
    res.json(reply)
  })
})

router.post('/assign/:user', function(req, res) {
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
  res.redirect('/');
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

router.delete('/all', function(req, res) {
  if (process.env.NODE_ENV == 'development') {
    redis.flushall(function(err, reply) {
      res.send('Deleted everything')
    })
  } else {
    res.send('This endpoint is development-only. Use Redis console to edit production data')
  }
})

module.exports = router;
