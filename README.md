## A thin app that imports Papercall talk submission JSON data and enables:

* Off-platform manual redaction for submission content fields
* Assigning proposals to certain reviewers
* Hide previous ratings on a proposal by default
* Rating aggregation to build stack-ranked list
* Persisting review committee-only notes

## How to use

You will need:

* Node.js and NPM
* Ruby if you want to generate submissions
* Redis running locally with default configs

To run:

```
npm install
npm start
```

The app will start on port 3000 by default.

#### Running on Heroku

You can deploy this to Heroku easily! You will need to provision a Redis add-on.
This app is currently hard-coded to read the configs of the `Redis To Go`
add-on.

Run `git push heroku master` after initializing a Heroku
project and provisioning the add-on.

### Users

In the interest of rapid prototyping, this app just uses basic auth via
PassportJS. To configure users, create a JSON file called `users.json` in the
root directory, structured like `example-user.json`.

### Seeding Proposals

You can use the pre-generated proposals in `scripts/submissions.json`, or
generate your own using the Faker gem. An example is in `scripts/make_fakes.rb`.

Use `seed-proposals.sh` to send all the proposals to an API endpoint that writes
directly into Redis.

### Creating Assignments

You can assign certain users to review certain talks. I will script this later,
but for now you can use curl, Postman, HTTParty, etc. to send the following API
request:

```
POST "http://localhost:3000/assign/#{user}/#{talkID}"
```

An example of how to programmatically do this is in
`scripts/make_assignments.rb`.

### This project is a WIP

Progress is being tracked in TODO.md. If you decide to try this out, feel free
to open issue or send PRs!
