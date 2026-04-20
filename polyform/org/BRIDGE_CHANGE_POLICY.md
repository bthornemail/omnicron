# Bridge Change Policy

Every bridge change must answer:

1. Does this affect authoritative fields?
2. Does this affect non-authoritative fields only?
3. Does this require a contract version bump?
4. Does this require fixture/golden hash regeneration?
5. Is frontend-specific behavior being widened or narrowed?
6. Does the change move any coreform field authority away from `.logic`
   composer terms into serialization/projection surfaces?

## Required PR/Change Note Block

```text
Bridge Impact:
- Authoritative impact: [none|yes: ...]
- Non-authoritative impact: [none|yes: ...]
- Contract bump: [none|v0.x -> v0.y]
- Golden regen required: [yes|no]
- Frontend scope change: [none|yes: ...]
```

## Versioning Guidance

- If authoritative derivation changes, bump contract version.
- If only non-authoritative surfaces change, keep version and update notes.
- If parser-front-end scope changes, document explicitly under Known Frontend Scope.
- If coreform authority source changes, update both `ORG_BRIDGE_SCHEMA.md` and
  `polyform/bitboards/README.md`, and require a contract review.
