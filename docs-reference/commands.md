Start the backend

  - From the repo root: npm run start:dev --workspace=packages/backend
    (or cd packages/backend && npm run start:dev)

Start the frontend

  - From the repo root: npm run dev --workspace=packages/frontend
    (or cd packages/frontend && npm run dev)


 - lsof -PiTCP -sTCP:LISTEN → shows all listening TCP ports with the owning process.

  - lsof -i :3000 → replace 3000 to check a specific port and see which process has it.
 
  - netstat -anp tcp | grep LISTEN (macOS) → another view of active listening ports.

  kill -9 <PID>