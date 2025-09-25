# Contributing Guide (Reboot Edition)

1. **Start With The Blueprint**
   - Read `docs/blueprint-overview.md` for the end-state vision.
   - Check `docs/phase-status.md` to see which phase is active.
   - Review the relevant `docs/phase-<n>-*.md` file before writing code.

2. **Archive Policy**
   - Do not delete legacy files outright; move them under `.archive/<original-path>`.
   - Add/maintain a README in each archived subtree explaining why the assets moved.

3. **Working Steps**
- Run `npm install` at the root before starting.
- During early phases expect `npm run lint` to fail because of legacy code—see `docs/phase-issues.md` for context.
- Keep README, PRD, and phase docs in sync with any decisions or deviations.
- Backend Jest suites use Testcontainers; ensure Docker is available locally or expect the specs to log a warning and skip.

4. **Handoff Notes**
   - Update `docs/phase-status.md` when a phase advances or completes.
   - Log blockers or questions in `docs/phase-issues.md` with date, phase, and owner.
   - Document new APIs or schema updates in the appropriate `docs/` file (e.g., `domain-schema.md`, `api-*.md`).

5. **Next Actions**
   - When Phase 1 is closed, proceed to Phase 2 tasks as documented.
   - Ensure new code lives in the feature/module structure created during Phase 1.
