# Q12 image subject-lock control

Q12 failed at `IMAGES_READY` after two m02 attempts rendered the m04 Copilot Memory subject. Serial processing and durable storage both worked, so the remaining correction is stronger binding between the selected story packet and the image request.

For qualification runs after Q12, each image request uses a canonical subject lock containing the story ID, candidate ID, target headline, source URL, packet SHA-256, and a subject-lock SHA-256. The generation request must match those values exactly. A mismatch fails closed with `qualification_image_subject_lock_mismatch`.

The existing rules remain unchanged: one story at a time, same-worker Library capture, separate review, exact-byte Git persistence, factual-support review, professional-quality review, and no low-quality fallback.

Q12 remains terminal evidence. This control is tested only on the next fresh Q identity after protected merge.
