#!/bin/bash

set +eux

proposals_count=$(cat submissions.json | jq ". | length")

for i in $(seq -w 1 $proposals_count); do
  let index=$((10#$i-1)) # bash will attempt to interpolate bits and fail
  proposal=$(cat submissions.json | jq .[$index])

  curl -H "Content-Type: application/json" \
    -X POST \
    -d "$proposal" \
    http://localhost:3000/seed/$i
done
