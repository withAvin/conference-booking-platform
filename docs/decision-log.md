# Decision and change log

Each entry records what changed, why, what evidence was considered, and which
artefacts were affected. Entries are in date order.

---

## D-01 — Database changed from MongoDB to PostgreSQL

**Date:** 28 August 2026
**Sprint:** 1 (during CBP-5)

**What changed**
The data layer was migrated from MongoDB with Mongoose to PostgreSQL with the
`pg` driver.

**Why**
BR-01 requires that the capacity check and the insert are atomic. A standalone
MongoDB deployment provides no row-level locking, so two simultaneous requests
for the last seat can both read the same count before either writes.

**Evidence considered**
Three options were compared:

1. _Switch to PostgreSQL_ — `SELECT ... FOR UPDATE` gives a row lock directly.
   Cost: rewriting three data-access modules.
2. _Keep MongoDB as a single-node replica set_ — multi-document transactions
   become available. Cost: the replica-set configuration must be reproduced on
   EC2 and documented, and a marker restarting `mongod` without the flag would
   break the booking endpoint.
3. _Keep MongoDB standalone with an atomic counter_ — `findOneAndUpdate` with a
   conditional `$inc` would enforce BR-01 correctly, but BR-02 spans documents
   and would remain best-effort.

Option 1 was chosen. The business rules are relational by nature — a join table
with an overlap query — and every prior artefact had been written assuming that
shape.

**Affected artefacts**

- `backend/config/db.js` rewritten as a connection pool with a transaction helper
- `backend/db/schema.sql` and `backend/db/seed.js` created
- Mongoose models removed
- Block definition diagram: the Database block's parts renamed to tables
- Backlog subtask 8.1 rewritten from generic booking logic to "create the
  booking transaction with the conference row locked"
- README stack section

---

## D-02 — bcrypt replaced with bcryptjs

**Date:** 28 August 2026
**Sprint:** 1 (during CBP-6)

**What changed**
The password hashing library was swapped from `bcrypt` to `bcryptjs`.

**Why**
`bcrypt` requires a native build step that failed on the Windows development
environment, blocking signup and login entirely.

**Evidence considered**
Installing Windows build tools was possible but would make the project
dependent on a toolchain not documented in the setup instructions.
`bcryptjs` is a pure-JavaScript implementation with an identical API, so no
calling code changed. It is slower, which is irrelevant at this scale.

**Affected artefacts**

- `backend/package.json`
- `backend/controllers/authController.js` import only

---

## D-03 — Branches rebased to resolve unrelated commit histories

**Date:** 28 August 2026
**Sprint:** 1

**What changed**
Three feature branches were rebased onto `main` and force-pushed.

**Why**
The branches had been created before the initial commit existed on `main`, so
git treated them as unrelated histories and GitHub refused to open pull
requests against them.

**Evidence considered**
The alternative — merging with `--allow-unrelated-histories` — would have
produced a repository with two root commits and a confusing graph. Rebasing
was chosen because the branches were unmerged and unpublished to anyone else,
so no shared history was rewritten. This is distinct from rewriting published
history, which the brief prohibits and which was not done.

**Affected artefacts**

- Branches `CBP-5-database-and-seed`, `CBP-6-signup-and-login`,
  `CBP-8-conference-creation`
- Pull requests #1, #2, #3

---

## D-04 — Signup redirects to login rather than logging the user in

**Date:** 28 August 2026
**Sprint:** 1 (during CBP-6)

**What changed**
The signup screen no longer stores the returned token; it navigates to the
login screen instead.

**Why**
The Figma prototype wires S01 to S02, and a marker comparing the prototype to
the running application would otherwise find a discrepancy with no explanation.

**Evidence considered**
Automatic login is better usability and the endpoint already returns a token,
so keeping it would have cost nothing. Consistency with the approved design was
judged more valuable than saving the user one screen, given that the brief
marks alignment between prototype and implementation.

**Affected artefacts**

- `frontend/src/pages/Signup.jsx`
- No change required to the prototype

---

## D-05 — Scope reduced after Sprint 2

**Date:** 28 August 2026
**Sprint:** 2 review

**What changed**
Three stories were moved to the backlog outside any sprint: CBP-10 conference
update and delete, CBP-14 booking viewing, CBP-15 booking change and cancel.

**Why**
Remaining time was sufficient either for additional CRUD screens or for the
concurrency evidence and the EC2 deployment, but not both.

**Evidence considered**
The deferred stories are additional screens over the same three tables. None
of them demonstrates a business rule that the delivered workflows do not
already show. By contrast, SC-01 has no evidence without the concurrency test,
and section 5 of the brief requires a working public URL. Cutting breadth to
protect depth was the better trade.

One consequence was accepted: SC-04, which stated that cancelling frees the
seat, is no longer testable and has been withdrawn from the success criteria
rather than left as an unmet claim.

**Affected artefacts**

- Jira backlog: three stories moved out of Sprint 3
- Success criteria: SC-04 withdrawn
- README known limitations section
- The organizer screen retains Edit and Delete controls which report the
  feature as unimplemented, deliberately, so the deferred scope is visible in
  the running application and traceable to CBP-10

---

## D-06 — Jira keys reconciled by editing the backlog, not the commit history

**Date:** 29 August 2026
**Sprint:** 3

**What changed**
Duplicate backlog items were removed and titles corrected. Commit messages were
left untouched.

**Why**
Work ran ahead of the backlog during Sprint 1, so two features were committed
with prefixes that did not match the backlog items describing them. Conference
browsing was committed as CBP-9 and booking as CBP-10, while the corresponding
backlog items were CBP-11 and CBP-12.

**Evidence considered**
Rewriting the commit messages with `git rebase -i` would have produced clean
linkage but requires force-pushing merged history, which the brief explicitly
prohibits. Editing the backlog achieves the same traceability at no integrity
cost. The residual mismatch — booking commits prefixed CBP-10 against backlog
item CBP-12 — is documented here rather than concealed.

**Affected artefacts**

- CBP-11 deleted as a duplicate of CBP-9
- CBP-67 to CBP-72 deleted; booking subtasks wrongly attached to CBP-10
- CBP-15 retitled to distinguish it from CBP-12
- Traceability matrix: the CBP-10 / CBP-12 mapping noted

---

## D-07 — Default Create React App branding removed

**Date:** 31 August 2026
**Sprint:** 3 (during CBP-64)

**What changed**
Page title, favicon and web manifest replaced. React's default logo assets
deleted.

**Why**
The application shipped with the scaffold's title of "React App" and React's
own logo in the browser tab, which misrepresents the project and its
authorship.

**Evidence considered**
Purely presentational, but the brief marks the deployed application as a
deliverable and default scaffold branding reads as unfinished.

**Affected artefacts**

- `frontend/public/index.html`
- `frontend/public/favicon.svg` created; `favicon.ico`, `logo192.png`,
  `logo512.png` deleted
- `frontend/public/manifest.json`

---

## Design decisions recorded at implementation time

These were made once and not revisited, but are recorded because a reader of
the code would otherwise have to infer the reasoning.

| Decision                                                                      | Reasoning                                                                                                                                                                      |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cancelled registrations retain a `cancelled` status rather than being deleted | Only `confirmed` rows count towards BR-01 and BR-02, so a soft delete keeps both rules as simple status filters, and a freed seat remains observable rather than merely absent |
| Locks are always taken in the order user row, then conference row             | Two rows must be locked per booking. A consistent order across every code path is what prevents deadlock when two requests contend for the same pair                           |
| A partial unique index guards against double submission                       | The overlap check cannot catch it: under strict inequalities a conference does not overlap itself, so booking the same conference twice passes BR-02                           |
| The role is chosen by the user at signup                                      | Accepted for assessment convenience. In production, organizer accounts would be issued by an administrator. Recorded in README known limitations                               |
| Times are stored as two timestamps rather than a date plus two times          | BR-02 compares instants; splitting the date out would make the overlap expression harder to write and easier to get wrong                                                      |

## D-08 — Conference update and delete reinstated

**Date:** 31 August 2026
**Sprint:** 3

**What changed**
CBP-10 was moved from the backlog into Sprint 3 and delivered, reversing
the deferral recorded in D-05.

**Why**
Update and Delete are part of FR-01, which specifies organizer CRUD over
conferences. Deferring them left three artefacts overstating the build:
the use case diagram showed Edit and Delete conference, the BDD showed
the operations, and FR-01's requirement text claimed full CRUD. The
choice was to weaken three design artefacts or to complete the feature.

**Evidence considered**
Greying out the unbuilt elements in each diagram was considered and
would have been honest, but FR-01 is a stated functional requirement
rather than optional scope, and the remaining work was one endpoint pair
plus an edit mode on an existing form. Completing it was cheaper than
defending its absence.

**Affected artefacts**

- `backend/models/Conference.js`, `conferenceController.js`,
  `conferenceRoutes.js`
- `frontend/src/pages/ConferenceForm.jsx` extended to an edit mode;
  `ManageConferences.jsx` delete dialog
- Use case diagram, BDD and requirement diagram now match the build for
  FR-01
- Subtask 6.5 added to CBP-10 for the time lock, which was not in the
  original breakdown
- D-05 partially superseded: CBP-14 and CBP-15 remain deferred
