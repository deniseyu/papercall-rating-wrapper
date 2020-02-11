require 'json'
require 'httparty'

reviewers = ['denise', 'dylan', 'spike', 'zach', 'mike', 'max']
proposal_ids = (1..100).to_a.map{|n| format("%03d", n)}

# with reviewers, each person should be assigned 50 talks at random.
# we can shuffle the deck three times, give everyone either the front or back
# half. this will prevent duplication within one person's assignments

# if we aim for every talk to have 3 reviews, with a known 6 reviewers, we need to "stack"
# the deck 3 times. this example is hard-coded for 100 talks, but will work for
# any even number

deck1 = proposal_ids.shuffle
deck2 = proposal_ids.shuffle
deck3 = proposal_ids.shuffle

deck = [deck1, deck2, deck3].flatten

assignments = []

reviewers.each do |reviewer|
  talks = deck.pop(50)
  assignment = {
    reviewer: reviewer,
    talks: talks
  }
  assignments << assignment
end

# optionally save assignments to JSON file for local reference
# File.open('assignments.json', 'w') do |f|
#   f.write(assignments.to_json)
# end

if ARGV[0] == 'send'
  assignments.each do |a|
    user = a[:reviewer]
    talks = a[:talks]

    talks.each do |talk|
      HTTParty.post("http://localhost:3000/assign/#{user}/#{talk}")
    end
  end
end

