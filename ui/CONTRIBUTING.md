# Code guidelines

Enforced automatically - run `npm run check` before committing.

| Concern         | Tool                          | Command                   |
| --------------- | ----------------------------- | ------------------------- |
| Formatting      | Prettier (the only formatter) | `npm run format`          |
| JS/TS standards | ESLint                        | `npm run lint:fix`        |
| Style standards | Stylelint                     | `npm run lint:styles:fix` |
| Types           | TypeScript                    | `npm run typecheck`       |

Editor settings are intentionally local. Configure Prettier as the formatter and
enable ESLint and Stylelint in your editor, then rely on `npm run check` as the
repository-wide source of truth.

## Import order

Enforced by `import/order`:

1. Libraries (`react`, `react-router-dom`, …)
2. First-party shared libraries
3. Local React components
4. Data models (`src/models`)
5. Services / data / utils / config / hooks
6. Styles (`.scss`)

## Naming

| Kind                  | Convention                               | Example                      |
| --------------------- | ---------------------------------------- | ---------------------------- |
| Directories           | kebab-case                               | `how-it-works/`              |
| Components            | PascalCase + `.tsx`                      | `PartnerCard.tsx`            |
| Tests                 | PascalCase + `.test.tsx` in `__tests__/` | `__tests__/Account.test.tsx` |
| Config                | camelCase + `Config`                     | `homeConfig.ts`              |
| Utils                 | camelCase + `Utils`                      | `datesUtils.ts`              |
| Services              | camelCase + `Services`                   | `orderServices.ts`           |
| Models                | camelCase + `Models`                     | `bookingModels.ts`           |
| Variables / functions | camelCase                                | `toInitials`                 |
| Module constants      | UPPER_CASE                               | `SERVICE_TYPES`              |

## Components

- One component per file; hooks declared first, `return` last.
- No literal colours, fonts or sizes - use `src/styles/_tokens.scss`.
- No hardcoded data - copy and constants live in `src/config`; `src/data` is
  limited to fixtures for resources whose write routes are staged.
- Strict equality only, no `console.*`, `const`/`let` only, max 100 columns.
