# laundrylo docs

| Document                             | What it answers                                             |
| ------------------------------------ | ----------------------------------------------------------- |
| [prd.md](./prd.md)                   | What we are building, for whom, and what is out of scope    |
| [architecture.md](./architecture.md) | How the system is put together, and how we get to a backend |
| [schema.md](./schema.md)             | The Postgres tables behind the API                          |
| [api-contract.md](./api-contract.md) | The HTTP surface, and the decisions log                     |

## Reading order

New to the project: **prd** -> **architecture** -> **api-contract** -> **schema**.

## Where decisions live

Product decisions are in the PRD. Interface decisions - and the reasoning behind
the settled ones - are in **api-contract.md section 9**. That section is the
record of what was decided and why; update it there rather than restating
conclusions in the other documents.

## Status

| Document     | Status                                        |
| ------------ | --------------------------------------------- |
| prd          | living                                        |
| architecture | living; backend section is planned, not built |
| schema       | draft, not yet migrated                       |
| api-contract | decisions settled; not yet implemented        |
