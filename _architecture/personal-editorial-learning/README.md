# Personal Editorial Learning

Status: candidate QA PASS

This operational extension optimizes the Daily AI Brief primarily for George while permitting optional anonymous feedback from other readers. It does not change the completed 17-improvement program or begin Command Center work.

## Signal hierarchy

1. George’s explicitly approved six-story weekly rating is the primary signal.
2. Editorial quality, evidence, novelty, and required category allocation remain hard gates.
3. Anonymous public ratings and passive aggregate analytics are secondary context only.
4. Popularity alone can never activate or determine weighting.

The public /feedback/ page presents all six current stories with four one-tap ratings and a share control. It collects no name, email, cookie, persistent reader identifier, free text, or browsing history. A story can be rated once per browser. Public aggregate feedback can be affected by blockers, replay, cleared browser storage, or deliberate manipulation and is therefore directional.

## Evidence and activation

Learning remains inactive until five complete editions have been explicitly rated, producing 30 story ratings with ten ratings in each required focus category. The recommendation engine may adjust only practical_value by at most ±10% and category_fit by at most ±5%. Significance, freshness, authority, evidence quality, novelty, and exact 2/2/2 allocation are protected.

Five candidate pools must pass shadow comparison before an approval recommendation can be presented. Silence is not approval. An approved adjustment is limited to ten editions and fails closed on a QA failure, Critical/High defect, protected-dimension change, category-balance change, or edition-limit expiration.

## Weekly response format

The weekly ChatGPT check-in lists one edition’s six numbered stories and asks George to reply with one rating letter for each:

- M — Most useful
- U — Useful
- N — Neutral
- X — Not useful

Reason tags are optional. After George confirms the interpreted record, the record is validated and committed through normal CI before it can contribute to learning.
