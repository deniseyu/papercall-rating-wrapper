var express = require('express');
var router = express.Router();
var passport = require('../config/passport');
var redis = require('../config/redis');
var async = require('async');

var basicAuth = passport.authenticate('local', { failureRedirect: '/login'})
var loggedIn = require('connect-ensure-login').ensureLoggedIn

router.get('/:key', loggedIn(), function(req, res) {
  var key = req.params.key
  redis.get(key, function(err, reply) {
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

router.get('/:key/edit', loggedIn(), function(req, res) {
  var key = req.params.key
  redis.get(key, function(err, reply) {
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

router.post('/:key', loggedIn(), function(req, res) {
    var key = req.params.key
    var val = JSON.stringify(req.body)
    redis.set(key, val, function(err, reply) {
      res.render('talk', {
        number: key,
        proposal: req.body,
        updated: true,
        user: req.user
      })
    })
})

router.post('/:key/review', loggedIn(), function(req, res) {
  var talkID = req.params.key
  // don't really care about review order; just that they can be named in
  // probably non-clashing way
  var randString = Math.random().toString(36).substring(7)
  var reviewID = req.body.reviewID || (talkID + ':' + randString)
  req.body.reviewID = reviewID
  var review = req.body

  // prevent duplicate reviews
  redis.lrange(`complete:${req.user.username}`, 0, 1000, function(err, rep) {
    console.log('update? ==', req.body.update)
    if (rep.includes(talkID) && !req.body.update) {
      return res.render('review', {
        number: talkID,
        review: review,
        id: reviewID,
        message: 'You have already reviewed this talk!',
        user: req.user
      })
    }

    redis.set(reviewID, JSON.stringify(review), function(err, reply) {
      redis.rpush(`complete:${req.user.username}`, talkID, function(err, reply) {
        res.render('review', {
          number: talkID,
          review: review,
          id: reviewID,
          updated: req.body.update,
          user: req.user
        })
      })
    })
  })
})

router.get('/:key/review/:id', loggedIn(), function(req, res) {
  var reviewID = req.params.id
  var key = req.params.key

  redis.get(reviewID, function(err, reply) {
    res.render('review', {
      number: key,
      review: JSON.parse(reply),
      id: reviewID,
      user: req.user
    })
  })
})

router.get('/:key/review/:id/edit', loggedIn(), function(req, res) {
  var reviewID = req.params.id
  var key = req.params.key

  redis.get(reviewID, function(err, reply) {
    res.render('edit-review', {
      number: key,
      review: JSON.parse(reply),
      id: reviewID,
      user: req.user
    })
  })
})

router.get('/:key/reviews', loggedIn(), function(req, res) {
  var key = req.params.key

  redis.keys(`${key}:*`, function(err, reviewIDs) {
    async.map(reviewIDs, function(id, cb) {
      redis.get(id, function(err, review) {
        cb(null, review)
      })
    }, function(err, results) {
      var renderResults = results.map(r => JSON.parse(r))
      res.render('list-reviews', {
        number: key,
        reviews: renderResults,
        average: getAverage(renderResults),
        user: req.user
      })
    })
  })
})

router.delete('/:key/review/:id', function(req, res) {
  var review = req.params.key + ':' + req.params.id

  redis.del(review, function(err, reply) {
    res.json(reply)
  })
})

router.delete('/:key', loggedIn(), function(req, res) {
  redis.del(req.params.key, function(err, reply) {
    res.json(reply)
  })
})

function getAverage(reviews) {
  if (reviews.length == 0) { return 0 }
  var total = reviews.map(r => parseInt(r.score))
    .reduce((a,b) => a+b)
  var avg = total / reviews.length
  return avg.toFixed(2)
}

module.exports = router;
