var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var users = process.env.users || require('../users.json')

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
  console.log('serialized user ====', user)
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  console.log(id)
  var user = users.find(user => user.id == id)
  console.log('deserializing user ====', user)
  if (user == null) { return cb(err); }
  cb(null, user)
});


module.exports = passport;
