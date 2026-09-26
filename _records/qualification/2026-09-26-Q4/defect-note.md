# Q4 terminal defect — image request context isolation

Run: `2026-09-26-Q4`

Result: **FAIL at IMAGES_READY**

The Q4 preflight and single semantic pass succeeded. Two fresh image-generation requests for story `m03` were rejected because both produced qualification-status dashboards instead of the requested story-specific visual. No image was accepted and no low-quality fallback was used.

Root cause: the image-generation execution surface continued to inherit edition/status context even after a fresh story-only retry, so the request context was not effectively sealed.

Smallest repair: create an image execution boundary that supplies only the single-story packet to the generator. Do not reuse or edit the rejected output. Prove the repair on the next fresh Q identity.

Production main remained unchanged at `6b3f91f0ac6483253a8d9f7b1212135588e1d99a`. Work=0, Codex=0, paid API=0.
