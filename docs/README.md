# laundrylo docs

| Document                             | What it answers                                             |
| ------------------------------------ | ----------------------------------------------------------- |
| [prd.md](./prd.md)                   | What we are building, for whom, and what is out of scope    |
| [journey.md](./journey.md)           | The cycle at `/journey`, phase by phase                     |
| [architecture.md](./architecture.md) | How the system is put together, and how we get to a backend |
| [schema.md](./schema.md)             | The Postgres tables behind the API                          |
| [api-contract.md](./api-contract.md) | The HTTP surface, and the decisions log                     |

## Reading order

New to the project: **prd** -> **architecture** -> **api-contract** -> **schema**.

Working on the backend: **architecture** section 3 -> **schema** ->
**api-contract**. The code has its own readmes: [`api/`](../api/README.md) for
running the service and what each folder is for, and the root
[README](../README.md) for starting the database.

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

| Document     | Status                                                      |
| ------------ | ----------------------------------------------------------- |
| prd          | living                                                      |
| journey      | living; design settled, build in progress                   |
| architecture | living; backend built for the read path, write path planned |
| schema       | implemented and verified against local Postgres             |
| api-contract | read path implemented and consumed; write path not built    |
