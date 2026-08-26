# laundrylo docs

| Document                             | What it answers                                             |
| ------------------------------------ | ----------------------------------------------------------- |
| [prd.md](./prd.md)                   | What we are building, for whom, and what is out of scope    |
| [journey.md](./journey.md)         | The creative homepage: the cycle, section by section        |
| [architecture.md](./architecture.md) | How the system is put together, and how we get to a backend |
| [schema.md](./schema.md)             | The Postgres tables behind the API                          |
| [api-contract.md](./api-contract.md) | The HTTP surface, and the decisions log                     |

## Reading order

New to the project: **prd** -> **architecture** -> **api-contract** -> **schema**.

Working on the homepage: **prd** -> **homepage**. The homepage doc is
self-contained on design, and defers to the PRD on product rules.

## Where decisions live

Product decisions are in the PRD. Interface decisions, and the reasoning behind
the settled ones, are in **api-contract.md section 9**. Homepage design and build
decisions are in **journey.md section 19**. Those sections are the record of
what was decided and why; update them there rather than restating conclusions in
the other documents.

## House style

No em dashes. Use a spaced hyphen, a comma, or parentheses.

## Status

| Document     | Status                                        |
| ------------ | --------------------------------------------- |
| prd          | living                                        |
| homepage     | living; design settled, build in progress     |
| architecture | living; backend section is planned, not built |
| schema       | draft, not yet migrated                       |
| api-contract | decisions settled; not yet implemented        |
