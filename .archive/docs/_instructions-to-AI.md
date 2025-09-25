# AI Project Instructions: Core Directives

### Configuration
* **Frontend:** Docker port `3000`
* **Backend:** Docker port `3001`
* **Database:** Port `5432`

---

### Workflow & Debugging Protocol
1.  **Prioritize Docker Services**: Always verify active services with `docker-compose ps` before any other action.
2.  **Use Volume-Mounted Development**:
    * **Edit** source code directly in the host directory.
    * **Restart** specific services (e.g., `docker-compose restart backend`) to apply changes, rather than rebuilding or starting new processes.
3.  **No Manual Process Spawning**: Do not run separate Node.js, Python, or other processes that compete with the Docker-managed containers. The containerized environment is the **single source of truth** for this project.
4.  **Rebuilds**: Do not rebuild Docker containers. If a rebuild is absolutely necessary, provide the precise terminal commands required and **halt all further operations**. The commands must be clear and complete.