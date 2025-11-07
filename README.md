# 🚀 VocaPro - Professional Vocabulary Management System

<div align="center">

![VocaPro Logo](https://via.placeholder.com/200x200?text=VocaPro)

**A production-grade web application for managing vocabulary with spaced repetition learning.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Azure SQL](https://img.shields.io/badge/Database-Azure%20SQL-blue.svg)](https://azure.microsoft.com/en-us/services/sql-database/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Deployment](#-deployment-to-azure) • [API Docs](#-api-documentation)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment to Azure](#-deployment-to-azure)
- [Docker Deployment](#-docker-deployment)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Core Functionality

- 📚 **CRUD Vocabulary Management** - Create, read, update, delete vocabulary items
- 🔄 **Spaced Repetition (SM-2 Algorithm)** - Scientifically optimized review scheduling
- 🌍 **Multi-language Support** - English, Vietnamese, and extensible to more languages
- 🏷️ **Tag Management** - Organize vocabulary with custom tags
- 📊 **Analytics Dashboard** - Track progress with visual statistics
- 🔍 **Advanced Search & Filters** - Find vocabulary quickly by word, language, difficulty, tags

### Import/Export

- 📥 **CSV Import** - Bulk import from CSV files
- 📄 **JSON Import/Export** - Full data portability
- 🔗 **Anki-compatible** - Export format compatible with Anki flashcards

### Authentication

- 🔐 **Email/Password** - Traditional authentication
- 🔑 **Google OAuth** - One-click sign-in with Google
- 🛡️ **Role-based Access Control** - User, Teacher, Admin roles

### UI/UX

- 🪟 **Glassmorphism Design** - Modern, beautiful interface
- 🌓 **Dark/Light Mode** - Eye-friendly themes with persistent preference
- 📱 **Fully Responsive** - Works on mobile, tablet, and desktop (360px to 4K)
- ⌨️ **Keyboard Shortcuts** - Power user features (Alt+D, Alt+S, Space, 1-5)
- ♿ **Accessible** - WCAG compliant with ARIA support

### Developer Experience

- 📖 **OpenAPI/Swagger Docs** - Interactive API documentation
- 🧪 **Jest Testing** - Unit and integration tests
- 🚀 **CI/CD Pipeline** - GitHub Actions for automated deployment
- 🐳 **Docker Support** - Containerized deployment ready
- 📝 **TypeScript-ready** - Structured validation with Zod

---

## 🛠️ Tech Stack

### Backend

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **ORM:** Prisma (Azure SQL / SQL Server)
- **Database:** Azure SQL Database
- **Authentication:** Passport.js (Local + Google OAuth)
- **Validation:** Zod
- **Session:** Express Session + Redis (optional)

### Frontend

- **HTML5** - Semantic markup
- **CSS3** - Custom glassmorphism design system
- **Vanilla JavaScript** - No framework dependencies
- **Responsive Design** - Mobile-first approach

### DevOps

- **Testing:** Jest + Supertest
- **CI/CD:** GitHub Actions
- **Containerization:** Docker + Docker Compose
- **Deployment:** Azure App Service / Azure Container Apps
- **Logging:** Winston

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Client        │
│  (Browser)      │
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────┐
│   Express.js    │
│   Server        │
│   + Passport    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────┐   ┌──────────┐
│Redis│   │  Prisma  │
└─────┘   └────┬─────┘
               │
               ▼
         ┌───────────┐
         │ Azure SQL │
         │ Database  │
         └───────────┘
```

---

## 📦 Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Azure SQL Database** (or SQL Server)
- **Redis** (optional, for session storage)
- **Git**

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/vocapro.git
cd vocapro
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your Azure SQL connection string and other credentials:

```env
DATABASE_URL="sqlserver://USERNAME:PASSWORD@SERVERNAME.database.windows.net:1433;database=DBNAME;encrypt=true"
SESSION_SECRET=your-super-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. Set Up Database

Generate Prisma client and push schema to Azure SQL:

```bash
npm run prisma:generate
npm run prisma:push
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

---

## ⚙️ Configuration

### Database Configuration

VocaPro uses **Azure SQL Database** via Prisma ORM. Connection string format:

```
DATABASE_URL="sqlserver://[user]:[password]@[server].database.windows.net:1433;database=[dbname];encrypt=true;trustServerCertificate=false"
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Secret to `.env`

### Session Storage

By default, sessions are stored in memory. For production, use Redis:

```env
REDIS_URL=redis://localhost:6379
```

Uncomment Redis session store configuration in `src/server.js`.

---

## 💾 Database Setup

### Azure SQL Database

1. **Create Azure SQL Database:**

   ```bash
   az sql server create --name vocapro-server --resource-group myResourceGroup --location eastus --admin-user sqladmin --admin-password YourPassword123!
   az sql db create --resource-group myResourceGroup --server vocapro-server --name vocapro-db --service-objective S0
   ```

2. **Configure Firewall:**

   ```bash
   az sql server firewall-rule create --resource-group myResourceGroup --server vocapro-server --name AllowAllAzure --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0
   ```

3. **Get Connection String:**

   ```bash
   az sql db show-connection-string --client ado.net --name vocapro-db --server vocapro-server
   ```

4. **Update `.env` with connection string**

5. **Push Schema:**
   ```bash
   npm run prisma:push
   ```

### Local SQL Server (Development)

For local development, you can use SQL Server Express:

```env
DATABASE_URL="sqlserver://localhost:1433;database=vocapro;user=sa;password=YourPassword123!;encrypt=true;trustServerCertificate=true"
```

---

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

Uses **nodemon** for auto-restart on file changes.

### Production Mode

```bash
npm start
```

### Access Points

- **Application:** http://localhost:3000
- **API Documentation:** http://localhost:3000/api-docs
- **Health Check:** http://localhost:3000/health

---

## 📖 API Documentation

### Interactive Documentation

Access Swagger UI at: `http://localhost:3000/api-docs`

### API Endpoints

#### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `GET /auth/google` - Initiate Google OAuth
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

#### Vocabulary

- `GET /api/v1/vocab` - List vocabularies (with filters)
- `GET /api/v1/vocab/:id` - Get vocabulary by ID
- `POST /api/v1/vocab` - Create vocabulary
- `PUT /api/v1/vocab/:id` - Update vocabulary
- `DELETE /api/v1/vocab/:id` - Delete vocabulary

#### Review

- `GET /api/v1/review/next` - Get next review due
- `POST /api/v1/review/:id` - Submit review result
- `GET /api/v1/review/stats` - Get review statistics

#### Tags

- `GET /api/v1/tags` - List all tags
- `GET /api/v1/tags/:id` - Get tag by ID
- `POST /api/v1/tags` - Create tag
- `PUT /api/v1/tags/:id` - Update tag
- `DELETE /api/v1/tags/:id` - Delete tag

#### Import/Export

- `POST /api/v1/import` - Import from CSV/JSON
- `GET /api/v1/export?format=csv|json` - Export vocabulary

#### Statistics

- `GET /api/v1/stats/dashboard` - Get dashboard statistics

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm test -- --coverage
```

Coverage reports are generated in `./coverage/` directory.

### Test Structure

```
__tests__/
  ├── spacedRepetition.test.js
  ├── auth.test.js
  ├── vocab.test.js
  └── ...
```

---

## ☁️ Deployment to Azure

### Prerequisites

- Azure CLI installed and logged in
- Azure subscription

### Step 1: Create Azure Resources

```bash
# Create resource group
az group create --name vocapro-rg --location eastus

# Create App Service Plan
az appservice plan create --name vocapro-plan --resource-group vocapro-rg --sku B1 --is-linux

# Create Web App
az webapp create --resource-group vocapro-rg --plan vocapro-plan --name vocapro-app --runtime "NODE|18-lts"
```

### Step 2: Configure Environment Variables

```bash
az webapp config appsettings set --resource-group vocapro-rg --name vocapro-app --settings \
  DATABASE_URL="your-connection-string" \
  SESSION_SECRET="your-secret" \
  GOOGLE_CLIENT_ID="your-client-id" \
  GOOGLE_CLIENT_SECRET="your-client-secret" \
  NODE_ENV="production"
```

### Step 3: Deploy via GitHub Actions

1. Get publish profile:

   ```bash
   az webapp deployment list-publishing-profiles --name vocapro-app --resource-group vocapro-rg --xml
   ```

2. Add `AZURE_WEBAPP_PUBLISH_PROFILE` secret to GitHub repository

3. Push to `main` branch to trigger deployment

### Manual Deployment

```bash
# Build and deploy
npm run build
az webapp deploy --resource-group vocapro-rg --name vocapro-app --src-path . --type zip
```

---

## � Deployment to Vercel

### Prerequisites

- Vercel account (free tier available)
- Vercel CLI installed: `npm install -g vercel`

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Step 4: Configure Environment Variables

In Vercel dashboard or via CLI:

```bash
vercel env add DATABASE_URL
vercel env add SESSION_SECRET
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add RAPIDAPI_KEY
```

**Important:** Update Google OAuth redirect URI to:

```
https://your-app-name.vercel.app/auth/google/callback
```

### Auto-Deploy with GitHub

1. Import your repository to Vercel dashboard
2. Connect your GitHub repository
3. Configure environment variables
4. Every push to `main` branch will auto-deploy

### Vercel Configuration

The project includes `vercel.json` for deployment configuration:

- Static files served from `/public`
- API routes handled by Express app
- Serverless function optimization

---

## �🐳 Docker Deployment

### Build Image

```bash
docker build -t vocapro:latest .
```

### Run Container

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="your-connection-string" \
  -e SESSION_SECRET="your-secret" \
  --name vocapro \
  vocapro:latest
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services included:

- **app** - VocaPro application
- **redis** - Session storage
- **nginx** - Reverse proxy (optional)

---

## 📁 Project Structure

```
vocapro/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # GitHub Actions CI/CD
├── __tests__/                 # Jest tests
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Frontend files
│   ├── css/
│   │   └── app.css           # Glassmorphism UI
│   ├── js/
│   │   ├── ui.js             # UI behaviors
│   │   └── vocabManager.js   # Vocab page logic
│   ├── login.html
│   ├── dashboard.html
│   ├── vocabManager.html
│   └── review.html
├── src/
│   ├── config/
│   │   ├── passport.js       # Auth strategies
│   │   └── swagger.js        # API docs config
│   ├── middleware/
│   │   └── auth.js           # Auth middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── vocab.js
│   │   ├── review.js
│   │   ├── tags.js
│   │   ├── import.js
│   │   ├── export.js
│   │   ├── user.js
│   │   └── stats.js
│   ├── utils/
│   │   ├── logger.js         # Winston logger
│   │   ├── spacedRepetition.js  # SM-2 algorithm
│   │   └── validation.js     # Zod schemas
│   └── server.js             # Main server file
├── uploads/                   # File uploads
├── logs/                      # Application logs
├── .env.example              # Environment template
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── jest.config.js
├── package.json
└── README.md
```

---

## 🎨 UI Features

### Glassmorphism Design System

- **Design Tokens:** Centralized CSS variables for colors, spacing, typography
- **Components:** Buttons, cards, modals, toasts, tables, forms, badges
- **Themes:** Dark (default) and Light mode with smooth transitions
- **Accessibility:** ARIA roles, keyboard navigation, focus management

### Keyboard Shortcuts

- `Alt + D` - Toggle theme
- `Alt + S` - Focus search
- `Space` - Show answer (review page)
- `1-5` - Quality rating (review page)

### Responsive Breakpoints

- Mobile: 360px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Use ESLint for linting
- Follow existing code conventions
- Write tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **SM-2 Algorithm** by Piotr Wozniak
- **Prisma Team** for excellent ORM
- **Express.js Community**
- **Azure Documentation**

---

## 📞 Support

For issues, questions, or suggestions:

- **GitHub Issues:** [Create an issue](https://github.com/yourusername/vocapro/issues)
- **Email:** support@vocapro.com
- **Documentation:** [Wiki](https://github.com/yourusername/vocapro/wiki)

---

## 🗺️ Roadmap

- [ ] TTS (Text-to-Speech) integration
- [ ] Mobile app (React Native)
- [ ] Collaborative learning features
- [ ] AI-powered definition suggestions
- [ ] Anki deck sync
- [ ] Gamification (badges, streaks)
- [ ] Social features (share decks)

---

<div align="center">

**Made with ❤️ by the VocaPro Team**

⭐ Star this repo if you find it helpful!

</div>
#   n o t e - v o c a b u l a r y - v 2 
 
 
