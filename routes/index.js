var express = require('express');
var router = express.Router();
var passport = require('../config/passport');
var redis = require('../config/redis');
var async = require('async');

var basicAuth = passport.authenticate('local', { failureRedirect: '/login'})
var loggedIn = require('connect-ensure-login').ensureLoggedIn

// running redis.keys is risky for memory, and set of talks unlikely to change
var memoizedKeys // so let's cache it in application memory

function getAllKeys(matcher, cb) {
  if (memoizedKeys) {
    return cb(null, memoizedKeys)
  }

  redis.keys(matcher, function(err, results) {
    memoizedKeys = results
    cb(null, memoizedKeys)
  })
}

router.get('/', loggedIn(), function(req, res) {
  function getTalks(keys, cb) {
    var talkKeys = keys.filter(key => !key.includes(':')) // for now ':' denotes a rating
    redis.mget(talkKeys, function(err, talks) {
      var talksResult = { all: [], pending: [], mine: [] }
      if (talks == null || talks.length == 0) { return cb(null, talksResult) }

      var talksCB = talks.map(t => JSON.parse(t)).map((t, ind) => {
        t.id = talkKeys[ind]
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

function buildTalksMap(keys, cb) {
  var talkIDs = keys.filter(key => !key.includes(':')) // for now ':' denotes a rating

  redis.mget(talkIDs, function(err, reply) {
    var talks = reply.map(r => JSON.parse(r)).map((talk, i) => {
      return {
        id: talkIDs[i],
        title: talk.title,
        ratings: [],
        discardVotes: 0,
        submitter: {
          name: talk.name,
          email: talk.email,
          organization: talk.organization,
          bio: talk.bio,
          twitter: talk.twitter,
          location: talk.location
        }
      }
    })
    cb(null, talks)
  })
}

function addRatings(talks, cb) {
  // todo: handle this error better
  if (memoizedKeys == null || memoizedKeys.length == 0) { return cb(null, talks) }

  var ratings = memoizedKeys.filter(k => {
    return k.includes(':') && k.split(':')[0] != 'assign' && k.split(':')[0] !== 'complete'
  })
  redis.mget(ratings, function(err, reply) {
    console.log('ratings from reids ===', reply)
    if (reply == null || reply.length == 0) { return cb(null, talks) }

    reply.map(r => JSON.parse(r)).forEach(rating => {
      var talk = talks.find(talk => talk.id == rating.proposal)
      talk.ratings.push(rating.score) // this is so dirty... why pointers by default, JS, why

      if (rating.discard == 'on') {
        talk.discardVotes++
      }
    })
    cb(null, talks)
  })
}

function computeAverages(talks, cb) {
  talks.map(talk => {
    if (talk.ratings.length == 0) {
      talk.average = 0
      return talk
    }

    var sum = talk.ratings.map(r => parseInt(r)).reduce((a,b) => a+b)
    var average = (sum / talk.ratings.length).toFixed(6)
    talk.average = average
    return talk
  })
  cb(null, talks)
}

function orderDesc(a, b) { return (a.average < b.average) ? 1 : -1 }

function orderForDisplay(talks, cb) {
  var discarded = talks.filter(t => t.discardVotes >= 2).sort(orderDesc)
  var undiscarded = talks.filter(t => t.discardVotes < 2)

  var fullyRated = undiscarded.filter(t => t.ratings.length >= 3).sort(orderDesc)

  var partialRated = undiscarded.filter(t => t.ratings.length < 3).sort(orderDesc)

  var talkSegments = { fullyRated, partialRated, discarded }
  cb(null, talkSegments)
}

router.get('/rankings', loggedIn(), function(req, res) {
  function didIDoMyHomework(talks, cb) {
    redis.multi()
      .lrange(`assign:${req.user.username}`, 0, 1000)
      .lrange(`complete:${req.user.username}`, 0, 1000)
      .exec(function(err, replies) {
      var assigned = replies[0]
      var completed = replies[1]
      var homeworkDone = assigned.filter(t => completed.includes(t)).length == assigned.length

      talks.homeworkDone = homeworkDone
      cb(null, talks)
    })
  }

  memoizedKeys = null // do a fresh pull!
  var buildRanking = async.compose(didIDoMyHomework, orderForDisplay, computeAverages, addRatings, buildTalksMap, getAllKeys)

  buildRanking("*", function(err, talks) {
    res.render('rankings', {
      fullyRated: talks.fullyRated,
      partialRated: talks.partialRated,
      discarded: talks.discarded,
      homeworkDone: talks.homeworkDone,
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
