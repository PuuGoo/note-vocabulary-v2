# 🚀 VocaPro Quick Start Guide

## Installation (5 minutes)

### Step 1: Run Setup Script

Open PowerShell in the project directory and run:

```powershell
.\setup.ps1
```

This will:

- ✓ Check Node.js and npm
- ✓ Install dependencies
- ✓ Create .env file
- ✓ Generate Prisma Client
- ✓ Create required directories

### Step 2: Configure Database

Edit `.env` file with your Azure SQL connection string:

```env
DATABASE_URL="sqlserver://USERNAME:PASSWORD@SERVERNAME.database.windows.net:1433;database=DBNAME;encrypt=true"
```

### Step 3: Push Database Schema

```bash
npm run prisma:push
```

### Step 4: Start Development Server

```bash
npm run dev
```

### Step 5: Open Browser

Navigate to: **http://localhost:3000**

---

## First Time Setup

1. **Register Account**

   - Click "Sign up" on login page
   - Enter email and password
   - Or use "Continue with Google"

2. **Add Your First Vocabulary**

   - Go to Vocabulary Manager
   - Click "Add Vocabulary"
   - Fill in the form (word, definitions, etc.)
   - Save

3. **Start Reviewing**
   - Go to Review page
   - Click "Show Answer"
   - Rate your recall (1-5)
   - System will schedule next review automatically

---

## Common Commands

```bash
# Development
npm run dev              # Start with auto-reload

# Database
npm run prisma:studio    # Open Prisma Studio (GUI)
npm run prisma:push      # Push schema changes
npm run prisma:generate  # Regenerate Prisma Client

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode

# Production
npm start                # Start production server
npm run build            # Build (if needed)

# Docker
docker-compose up -d     # Start all services
docker-compose logs -f   # View logs
docker-compose down      # Stop services
```

---

## Troubleshooting

### "Cannot connect to database"

**Solution:** Check your DATABASE_URL in `.env`:

- Username and password are correct
- Server name is correct (without https://)
- Database exists
- Firewall allows your IP

### "Module not found"

**Solution:**

```bash
npm install
npm run prisma:generate
```

### "Port 3000 already in use"

**Solution:** Change PORT in `.env`:

```env
PORT=3001
```

### "Session store error"

**Solution:** Redis is optional. Remove Redis configuration or install Redis:

```bash
# Windows (using Chocolatey)
choco install redis-64
```

---

## Testing Checklist

After setup, verify everything works:

- [ ] Server starts without errors
- [ ] Can access http://localhost:3000
- [ ] Can register new account
- [ ] Can login with email/password
- [ ] Can add vocabulary
- [ ] Can view dashboard with stats
- [ ] Can start review session
- [ ] Theme toggle works (Alt+D)
- [ ] API docs accessible at /api-docs

---

## Next Steps

1. **Import Sample Data**

   - Go to Vocabulary Manager → Import/Export tab
   - Download sample CSV from repo
   - Drag and drop to import

2. **Customize Settings**

   - Adjust difficulty levels
   - Create custom tags
   - Set up your learning schedule

3. **Deploy to Production**
   - Follow README.md Azure deployment section
   - Configure production environment variables
   - Set up CI/CD with GitHub Actions

---

## Support

- **Documentation:** README.md
- **API Docs:** http://localhost:3000/api-docs
- **Issues:** GitHub Issues
- **Email:** support@vocapro.com

---

**Happy Learning! 📚**
