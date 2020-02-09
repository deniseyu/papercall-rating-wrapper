var express = require('express');
var router = express.Router();

const redis = require("redis");
const client = redis.createClient();

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
