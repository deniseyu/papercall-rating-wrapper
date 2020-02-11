require 'faker'
require 'json'

output_file = ENV['OUTPUT'] || 'submissions.json'

def generate_title
  [
    "Life on #{Faker::Movies::StarWars.planet}",
    "#{(1..10).to_a.sample} Reasons to Visit #{Faker::Games::Zelda.location}",
    "Playing #{Faker::Games::Zelda.game} in 2020",
    "The Best #{Faker::Food.dish} in #{Faker::Games::Pokemon.location}",
    "Training #{Faker::Games::Pokemon.name} For Battle Readiness",
    "Optimal Strategy for #{Faker::Games::SuperSmashBros.fighter}",
    "#{Faker::Games::Pokemon.move} Demystified",
    "#{Faker::Movies::PrincessBride.character}'s Guide to Systems Design",
    "How to Think Like a #{Faker::Movies::StarWars.specie}",
    "The World According to #{Faker::Movies::StarWars.character}",
    "Learn to Hack Your #{Faker::Movies::StarWars.droid}",
    "A Visitor's Guide to #{Faker::Movies::StarWars.planet}",
    "Operational Best Practices by #{Faker::Games::Zelda.character}",
    "Upgrade Your #{Faker::Games::Zelda.item}",
    "How to Operate a #{Faker::Movies::StarWars.vehicle}"
  ].sample
end

used_titles = []

entries = (1..100).map do |index|
  name = Faker::JapaneseMedia::DragonBall.character
  title = generate_title
  if used_titles.include?(title)
    title = generate_title
  end
  used_titles << title

  entry = {
    name: name,
    email: Faker::Internet.email(name: name),
    avatar: Faker::Avatar.image,
    location: Faker::Games::Pokemon.location,
    bio: Faker::Lorem.sentences(number: 1).join(' '),
    twitter: Faker::Internet.url(host: 'twitter.com'),
    url: Faker::Internet.url,
    organization: Faker::Company.name,
    shirt_size: ['S', 'M', 'L', 'XL'].sample,
    talk_format: 'Talk (~30-45 minutes)',
    title: title,
    abstract: Faker::Lorem.question(word_count: 10),
    description: Faker::Lorem.sentences(number: 5).join(' '),
    notes: Faker::Lorem.sentences(number: 2).join(' '),
    audience_level: 'All',
    tags: [Faker::Hacker.adjective, Faker::Hacker.adjective, Faker::Hacker.adjective].uniq,
    rating: [1,2,3,4,5].sample,
    state: 'submitted',
    confirmed: false,
    additional_info: nil,
    created_at: Faker::Time.between(from: DateTime.now - 1, to: DateTime.now),
    id: index
  }
end

File.open(output_file,"w") do |f|
  f.write(entries.to_json)
end
