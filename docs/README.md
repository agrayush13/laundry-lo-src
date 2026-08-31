# laundrylo docs

| Document                             | What it answers                                                   |
| ------------------------------------ | ----------------------------------------------------------------- |
| [prd.md](./prd.md)                   | What the full-stack product is, for whom, and what remains demo   |
| [architecture.md](./architecture.md) | How the frontend, API, authentication and PostgreSQL fit together |
| [api-contract.md](./api-contract.md) | Which HTTP routes exist and which write routes are planned        |
| [schema.md](./schema.md)             | The implemented PostgreSQL tables, policies and derived data      |
| [journey.md](./journey.md)           | The URL-only cycle experience at `/journey`, phase by phase       |

## Reading order

New to the project: **prd** -> **architecture** -> **api-contract** -> **schema**.

Working on the backend: **architecture** section 3 -> **schema** ->
**api-contract**. The code has its own readmes: [`api/`](../api/README.md) for
running and deploying the service, and the root [README](../README.md) for the
complete local frontend, backend and database setup.

Working on the cycle: **prd** -> **journey**. The journey doc is self-contained
on design, and defers to the PRD on product rules. The cycle lives at `/journey`
and is not linked from the app; the marketing homepage is the product surface,
and the two read their shared facts from one source (journey.md section 20).

## Where decisions live

Product decisions are in the PRD. Interface decisions, and the reasoning behind
the settled ones, are in **api-contract.md section 9**. The cycle's design and
build decisions are in **journey.md section 19**. Those sections are the record of
what was decided and why; update them there rather than restating conclusions in
the other documents.

## House style

No em dashes. Use a spaced hyphen, a comma, or parentheses.

## Status

| Document     | Status                                                           |
| ------------ | ---------------------------------------------------------------- |
| prd          | living; implemented and demo-only surfaces identified            |
| journey      | living; implemented at `/journey` and intentionally unlinked     |
| architecture | living; deployed full-stack topology, write path staged          |
| schema       | implemented and verified against PostgreSQL 17                   |
| api-contract | read path implemented and consumed; authenticated writes planned |
