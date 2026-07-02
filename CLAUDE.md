# GHLG (Ghostlog) — Open-Core Boundaries

This project is open-core. This repo (`GHLG`) is PUBLIC and open-source.

Only free-tier features belong here:
- single-project watching
- git hook capture
- manual trigger
- raw/curate/synthesize logging

NEVER write FUNCTIONAL code for:
- multi-project support
- licensing / license checks
- expanded dashboard

The real boundary: no functional pro-tier logic anywhere outside `src/pro-stub/`.

Intentional, allowed exceptions:
- `src/pro-stub/` exists specifically to hold NON-FUNCTIONAL multi-project/licensing/dashboard placeholders (types, interfaces, empty components). Nothing in it may be wired into app logic.
- The Settings "GHLG Pro" section must stay presentational-only: disabled, "Coming soon", and it must NOT import from `src/pro-stub/`.
- Mentioning these words in docs, comments, stub files, or a standard `LICENSE` file (and the `license` field in package.json) is fine.

Paid features live in a separate PRIVATE repo: GHLG-pro.
If a task seems to require pro-tier logic, stop and flag it instead of writing it here.
