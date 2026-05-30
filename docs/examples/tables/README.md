# Tables Examples

Bundled fixtures for `@textforge/tables` validation:

- `application-portfolio.csv` exercises the structured CSV grid editor.
- `relationship-grid.tsv` exercises TSV parsing and explicit apply/discard editing.

Recommended shell URLs after `corepack pnpm --filter @textforge/textforge-web preview -- --host 127.0.0.1 --port 4173`:

- `http://127.0.0.1:4173/?testProfile=tables-csv`
- `http://127.0.0.1:4173/?testProfile=tables-tsv`
- `http://127.0.0.1:4173/?testProfile=itm-catalogue`
- `http://127.0.0.1:4173/?testProfile=itm-matrix`

Bundled resource paths in the seeded workspace:

- `/.textforge/resources/docs/examples/tables/application-portfolio.csv`
- `/.textforge/resources/docs/examples/tables/relationship-grid.tsv`
- `/.textforge/resources/docs/examples/itm/test-profiles/itm-surface-smoke.itm`

What each URL exercises:

- `tables-csv` opens `application-portfolio.csv` directly in `@textforge/tables/delimited-grid`.
- `tables-tsv` opens `relationship-grid.tsv` directly in `@textforge/tables/delimited-grid`.
- `itm-catalogue` opens the bundled ITM smoke model directly in `@textforge/tables/catalogue`.
- `itm-matrix` opens the bundled ITM smoke model directly in `@textforge/tables/matrix`.
