# Public release — October 22, 2026

Fix invoice saving/reset, client/pet species consistency, booking visibility and controls. Default synthetic session resets all demo edits, avoids Firebase/push initialization, disables private imports and adds export/workflow regression coverage. Remove exposed import tooling, private screenshots and branding from current source. Validation: 16 Node tests, 16 browser tests, lint, build and dependency audits passed. Exposed credentials still require provider-side revocation/password rotation; old commits retain removed material.

## Deployment

Publication uses the existing GitHub-to-Vercel integration after merging the reviewed changes into the default branch. Verify the deployment for the merge commit and the actual public URLs; a passing build alone does not prove external service health. Production verification results are recorded separately in the workspace release report.
