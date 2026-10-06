# Watchdog Ring Membership Hardening

Status: implementation complete on bounded hardening branch; protected promotion pending.

Implemented:
- live Controller six-slot membership precheck and repair rule;
- A-F cross-slot membership check / repair rule (all six currently enabled);
- independent Watchdog Ring Integrity check;
- watchdog-ring membership observation validator;
- compact Watchdog health escalation for degraded membership;
- deterministic membership and health regression tests;
- readiness-contract and operational-learning updates.

Current branch: `hardening/watchdog-ring-membership-invariant-2026-10-06`.

Do not merge by direct main write. Open a normal protected PR, require exact-head validation, then merge only after required checks pass. The October 6 production execution is already PUBLIC_CLOSED and must remain immutable.
