## A thin app that imports Papercall talk submission JSON data and enables:

* Off-platform manual redaction for submission content fields
* Assigning proposals to certain reviewers
* Hide previous ratings on a proposal
* Rating aggregation to build stack-ranked list
* Persisting review committee-only notes

Data cannot be re-imported into Papercall. Unfortunately someone has to manually
copy submission status back in :-(

### To dos

- [ ] Connect up to a Redis server, configured with disk persistence (check
  Heroku offering configs)
- [ ] Write script to dump contents of JSON file into Redis
- [ ] Display a Redis entry at `GET /proposals/:id`
  - Show Title, Abstract, Long Description, Notes for Committee prominently;
    hide everything else like travel support under JS pointy clicky fold
- [ ] Update a proposal's Title, Abstract, Long Description, or Notes For
  Committee at `POST /proposals/:id`
- [ ] Display list of all proposals by title at `GET /proposals`
- [ ] Indicate that a proposal has been modified with a `*` appended to its
  title at `GET /proposals` -- descope if too annoying
- [ ] Find a Node library to handle user authentication
- [ ] Set up basic auth for Admin and Reviewer user types
- [ ] Add auth checks to all existing endpoints
- [ ] Create Review model:
    - Reviewer
    - Proposal
    - Rating (1-5)
    - Discard (Bool)
    - Internal Notes (string)
- [ ] Add ability to add a review, at `POST /proposals/:id/review`
- [ ] Persist reviews in Redis only
- [ ] Mark a proposal as `Rejected` if it receives N number of `Discard` votes
  (start with hard-coding to 2) 
- [ ] Display all reviews for a proposal at `GET /proposals/:id` but hide
  reviews by default under a JS clicky foldy thing
- [ ] Add ability for Admin to assign proposals to certain Reviewers
- [ ] Add dashboard endpoint for a reviewer, `GET /dashboard` which displays
  only proposals assigned to that logged-in reviewer
- [ ] Add visual separation between proposals that have been reviewed, and
  proposals pending review, on the reviewer dashboard
- [ ] Randomize the order in which assigned reviews show up on the dashboard
- [ ] Build an Admin view of the state of all proposals:
    - Completely rated proposals ordered from highest to lowest average score
    - Discarded proposals visually separated
    - Proposals pending reviews visually separated, and names of assigned Reviewers
    - Some visual indication of proposals with large deltas between reviews
      ("Controversial"?)
    - Dotted line to show cut-off point for top N proposals (start with
      hard-coding 25)

#### MVP notes

* Users should only have one role type. We can create multiple user accounts and
  give people the credentials if they need to swap between Admin and Reviewer
* Discard threshold and cut-off point should be configurable eventually
