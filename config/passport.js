var passport = require('passport');
var localStrategy = require('passport-local').Strategy;

var users
if (process.env.users) {
  users = JSON.parse(process.env.users)
} else {
  users = require('../users.json')
}

passport.use(new localStrategy(
  function(username, password, done) {
    var found = users.find(user => user.username == username)
    if (found == null) {
      return done(null, false, { message: 'Non-existent user' })
    }
    if (found.password != password) {
      return done(null, false, { message: 'Incorrect password' })
    }
    return done(null, found)
  }
))

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  var user = users.find(user => user.id == id)
  if (user == null) { return cb(err); }
  cb(null, user)
});


module.exports = passport;
