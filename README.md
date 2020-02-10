## A thin app that imports Papercall talk submission JSON data and enables:

* Off-platform manual redaction for submission content fields
* Assigning proposals to certain reviewers
* Hide previous ratings on a proposal
* Rating aggregation to build stack-ranked list
* Persisting review committee-only notes

Data cannot be re-imported into Papercall. Unfortunately someone has to manually
copy submission status back in :-(

### To dos

- [x] Connect up to a Redis server, configured with disk persistence (check
  Heroku offering configs)
- [x] Write script to dump contents of JSON file into Redis
- [x] Display a Redis entry at `GET /proposals/:id`
  - [x] Show Title, Abstract, Long Description, Notes for Committee prominently;
  - [ ] Hide everything else like travel support under JS pointy clicky fold
- [x] Update a proposal's Title, Abstract, Long Description, or Notes For
  Committee at `POST /proposals/:id`
- [x] Display list of all proposals by title at `GET /proposals`
- [ ] Indicate that a proposal has been modified with a `*` appended to its
  title at `GET /proposals` -- descope if too annoying
- [x] Find a Node library to handle user authentication -- (Ended up choosing Passport)
- [x] Set up basic auth for Admin ~and Reviewer~ user types; everyone has same
  privileges for MVP
- [x] Add auth checks to all existing endpoints
- [x] Create Review model:
    - Reviewer
    - Proposal
    - Rating (1-5)
    - Discard (Bool)
    - Internal Notes (string)
- [x] Add ability to add a review, at `POST /proposals/:id/review`
- [x] Persist reviews in Redis only
- [ ] ~Compute running average on a Proposal, add to Proposal model, update every time a Review is added/updated/deleted~ Descoping this, because it's easier and more maintainable to write a query than to maintain a running average
- [x] Edit a review
- [ ] Delete a review
- [ ] ~Mark a proposal as `Rejected` if it receives N number of `Discard` votes~ Going to descope for now; a low average rating is sufficient to show rejection, for MVP
  (start with hard-coding to 2) 
- [x] Display all reviews for a proposal at `GET /proposals/:id/reviews`
- [ ] Add ability for Admin to assign proposals to certain Reviewers
- [ ] Don't let the same person review a talk twice
- [ ] A logged-in reviewer should see a visual separation at `GET /` so that proposals assigned to them 
      to review are at the top, and other proposals are below
- [ ] Add visual separation between proposals that have been reviewed, and
  proposals pending review, on `GET /`
- [ ] Randomize the order in which assigned reviews show up on the dashboard
- [ ] Build an Admin view of the state of all proposals:
    - Completely rated proposals ordered from highest to lowest average score
    - Discarded proposals visually separated
    - Proposals pending reviews visually separated, and names of assigned Reviewers
    - Some visual indication of proposals with large deltas between reviews
      ("Controversial"?)
    - Dotted line to show cut-off point for top N proposals (start with
      hard-coding 25)
- [ ] Do some CSS...

#### MVP notes

* Users should only have one role type. We can create multiple user accounts and
  give people the credentials if they need to swap between Admin and Reviewer
* Discard threshold and cut-off point should be configurable eventually
* Set up Heroku Redis backups for every 1h during Feb 20-27


#### Stuff I should probably do later

* Change Redis data model from string to hash for proposals and reviews
* Memoize expensive Redis queries
