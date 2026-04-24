# OMI-Lisp Snapshot Metadata

Pinned source:

- Upstream path: `/root/omi-lisp`
- Upstream remote: `https://github.com/bthornemail/omi-lisp.git`
- Upstream branch at import: `main`
- Upstream commit at import: `6a3956cda0a3e7c57e569732a639e6c55f317b33`
- Imported into `omnicron` on: 2026-04-23 (UTC)

Imported reference files:

- `omi_header8_reader.lisp`
- `omi_rewrite_core.lisp`
- `omi_loader.lisp`
- `omi_riscv_vm.c`
- `AGENT_GUARDRAILS.md`
- `THE_COMPLETE_LADDER.org`
- `CONTROL_PLANE.org`

Usage contract:

1. Treat this snapshot as read-only provenance.
2. Port behavior into `logic/runtime/*` and `logic/verify/*` in `omnicron`.
3. Use fixtures under `third_party/omi-lisp/fixtures/` for parity checks.

