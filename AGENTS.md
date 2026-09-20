# ChromeTabX project workflow

- Do not launch simulators unless the user explicitly requests one.
- After completing and verifying a requested project update, commit the relevant changes and push to the configured GitHub origin. The owner has requested ongoing GitHub synchronization.
- Check the remote and branch first. Never force-push, overwrite remote work, or include unrelated local changes. If authentication or a conflict blocks synchronization, preserve the local work and report the blocker.
- Run npm test for behavior changes; use proportionate checks for small UI-only edits. Do not publish failed or unverified functional changes as complete.
- Keep personal skill files, internal document links, credentials, local machine data, and generated archives out of the public repository.
- Update README and version/changelog when behavior or installation changes. GitHub synchronization happens when completing work, not as an unattended file watcher.
