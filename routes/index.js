var express = require('express');
var router = express.Router();
var client

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

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/seed/:number', function(req, res, next) {
  var key = req.params.number
  var val = JSON.stringify(req.body)
  client.set(key, val, function(err, reply) {
    res.send(reply)
  })
});

router.get('/proposals/:key', function(req, res, next) {
  var key = req.params.key
  client.get(key, function(err, reply) {

    var proposal = JSON.parse(reply)

    res.render('talk', {
      title: key,
      abstract: proposal.abstract,
      desc: proposal.description,
      notes: proposal.notes
    });
  });
})

module.exports = router;
