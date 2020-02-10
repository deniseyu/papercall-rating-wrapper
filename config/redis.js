var redis = require('redis')
var client

// heroku readiness
if (process.env.REDISTOGO_URL) {
  var rtg = require("url").parse(process.env.REDISTOGO_URL);
  client = require("redis").createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(":")[1]);
} else {
  client = require("redis").createClient();
}

client.on("error", function(error) {
  console.error(error);
});

module.exports = client;
