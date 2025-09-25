# Phase 1 – Foundation Reset

## Goal
Prepare the repository for the rebuild by removing scope creep, archiving unused assets, and aligning documentation with the builder-centric vision.

## Inputs
- `docs/blueprint-overview.md`
- Existing repo structure (frontend, backend, shared, docs)
- Current README / PRD drafts

## Core Tasks
1. **Inventory & Classification**
   - Map all backend modules, frontend routes/components, shared utilities, and docs.
   - Tag each item as `keep`, `rework`, or `archive` according to the new blueprint.
2. **Archive Legacy Assets**
   - Move out-of-scope files/directories to `.archive/<original-path>`.
   - Drop a short README in each archived subtree summarizing why it moved and any references.
3. **Bootstrap New Skeletons**
   - Create placeholder directories/files for new feature slices (e.g., `backend/src/modules/sessions`, `frontend/src/features/session-builder`).
   - Add TODO comments describing the intended contents per blueprint.
4. **Update Documentation**
   - Rewrite `README.md` to describe the builder-first vision, stack decisions, and current phase status.
   - Revise `docs/prd.md` (or create `docs/prd-v2.md`) to reflect the reduced, builder-centric scope.
5. **Developer Experience Setup**
   - Ensure root scripts (`npm run dev`, `lint`, `test`) still execute.
   - Add/refresh contribution guide with references to the new docs and archive policy.

## Deliverables
- Clean repo layout with archived assets under `.archive`.
- Updated README and PRD aligning with phase goals.
- Documented skeletons signaling upcoming modules.
- Phase status captured in change log (dates + owner).

## Test Plan
1. **Archive Integrity**
   - Verify `.archive` mirrors original paths and contains `README.md` notes.
   - Run `find .archive -maxdepth 3 -type f` to confirm expected assets moved.
2. **Workspace Health**
   - Run `npm install` and `npm run lint` at repo root; tests may still fail due to stubs, but lint should pass.
3. **Documentation Check**
   - Ensure internal links in README/PRD resolve.
   - Confirm blueprint overview references this phase as complete once done.

## Handoff Checklist
- [ ] Archive manifest committed.
- [ ] README/PRD updated in `docs` folder.
- [ ] Root scripts verified.
- [ ] Phase summary added to project log (`docs/phase-status.md` or similar).
