# > AGENT INSTRUCTIONS

## =« **DEVELOPMENT ENVIRONMENT RULES**

### **DOCKER USAGE - DATABASE ONLY**
- **NEVER** use Docker for frontend or backend development
- **ONLY** use Docker for the database service
- **ALWAYS** use local npm/vite/nest servers for development

**APPROVED COMMANDS:**
```bash
# Database Only (Docker)
docker-compose up database -d
docker-compose down

# Frontend Development (Local)
cd packages/frontend && npm run dev

# Backend Development (Local)
cd packages/backend && npm run start:dev
```

**FORBIDDEN COMMANDS:**
- `npm run dev` (root level - starts Docker)
- `docker-compose up` (without database filter)
- `docker-compose up --build`
- Any Docker commands for frontend/backend

**ENVIRONMENT SETUP:**
- Database: `localhost:5433` (Docker PostgreSQL)
- Frontend: `http://localhost:3000` (local Vite)
- Backend: `http://localhost:3001` (local NestJS)

## =¥ **SERVER MANAGEMENT RULES**

### **BEFORE STARTING ANY DEV SERVER:**
1. **ALWAYS** check if servers are already running
2. **NEVER** start multiple instances of the same server
3. **ALWAYS** stop existing servers before restarting

### **SERVER STARTUP SEQUENCE:**

**Step 1: Check Running Processes**
```bash
# Check if backend is running on port 3001
lsof -i :3001

# Check if frontend is running on ports 3000/3002
lsof -i :3000
lsof -i :3002

# Kill any existing processes if needed
kill -9 <PID>
```

**Step 2: Start Servers (One Instance Each)**
```bash
# Start backend (only if not running)
cd packages/backend && npm run start:dev

# Start frontend (only if not running)
cd packages/frontend && npm run dev
```

**Step 3: Handle Port Conflicts**
- If frontend says "Port 3000 unavailable, using 3002 instead" ’ KILL and RESTART
- If backend shows connection errors ’ Check database first
- Only one instance of each server should be running

### **TROUBLESHOOTING:**
- **Multiple backend instances**: `pkill -f "node dist/main.js"`
- **Multiple frontend instances**: `pkill -f "vite"`
- **Port conflicts**: `lsof -i :<port>` then `kill -9 <PID>`
- **Database issues**: `docker-compose up database -d`

### **CHECKLIST BEFORE STARTING:**
- [ ] No backend running on port 3001
- [ ] No frontend running on ports 3000/3002
- [ ] Database running (`docker-compose up database -d`)
- [ ] Start backend FIRST, then frontend

## =' **DEVELOPMENT WORKFLOW**

### **AGENT WORKFLOW:**
1. Start database with Docker: `docker-compose up database -d`
2. Start backend locally: `cd packages/backend && npm run start:dev`
3. Start frontend locally: `cd packages/frontend && npm run dev`
4. Never use full Docker Compose for development

### **CODE QUALITY STANDARDS:**
- Follow existing code patterns and conventions
- Write clear, self-documenting code
- Add meaningful comments for complex logic
- Test functionality before declaring completion
- Handle errors gracefully with user-friendly messages

### **DEBUGGING APPROACH:**
- Check console/network tabs for errors first
- Review server logs for backend issues
- Test with different data scenarios
- Verify API endpoints and responses
- Check database connectivity for data issues

---

**These instructions prevent agents from accidentally starting Docker containers for application servers and ensure proper server management practices.**