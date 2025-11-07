# 🛠️ VocaPro Development Guide

## Development Environment Setup

### Prerequisites

- Node.js 18+ and npm 9+
- Azure SQL Database or local SQL Server
- Redis (optional)
- VS Code (recommended)

### Recommended VS Code Extensions

- ESLint
- Prettier
- Prisma
- REST Client
- GitLens

---

## Project Structure Explained

```
vocapro/
├── src/                    # Backend source code
│   ├── config/            # Configuration (passport, swagger)
│   ├── middleware/        # Express middleware
│   ├── routes/            # API route handlers
│   ├── utils/             # Utility functions
│   └── server.js          # Main entry point
│
├── public/                # Frontend static files
│   ├── css/              # Glassmorphism UI
│   ├── js/               # UI behaviors
│   └── *.html            # Pages
│
├── prisma/               # Database schema
├── __tests__/            # Test files
├── .github/workflows/    # CI/CD pipelines
└── uploads/              # File uploads
```

---

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

Server will auto-restart on file changes (nodemon).

### 2. Access Points

- **App:** http://localhost:3000
- **API Docs:** http://localhost:3000/api-docs
- **Health:** http://localhost:3000/health

### 3. Database Development

```bash
# View database in browser GUI
npm run prisma:studio

# After schema changes, regenerate client
npm run prisma:generate

# Push schema to database
npm run prisma:push
```

### 4. Testing Workflow

```bash
# Run tests once
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# With coverage
npm test -- --coverage
```

---

## Adding New Features

### Adding a New API Endpoint

1. **Create route handler** in `src/routes/`:

```javascript
// src/routes/newFeature.js
const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/', ensureAuthenticated, async (req, res) => {
  // Your logic here
  res.json({ message: 'Success' });
});

module.exports = router;
```

2. **Register route** in `src/server.js`:

```javascript
app.use('/api/v1/newfeature', require('./routes/newFeature'));
```

3. **Add Swagger docs** in route file:

```javascript
/**
 * @swagger
 * /api/v1/newfeature:
 *   get:
 *     summary: Description
 *     tags: [NewFeature]
 */
```

### Adding a New Database Model

1. **Update schema** in `prisma/schema.prisma`:

```prisma
model NewModel {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  userId    String

  user User @relation(fields: [userId], references: [id])

  @@map("new_models")
}
```

2. **Regenerate client**:

```bash
npm run prisma:generate
npm run prisma:push
```

3. **Use in code**:

```javascript
const prisma = req.app.get('prisma');
const newItem = await prisma.newModel.create({ data: {...} });
```

### Adding a New Frontend Page

1. **Create HTML** in `public/`:

```html
<!-- public/newpage.html -->
<!DOCTYPE html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <title>New Page</title>
    <link rel="stylesheet" href="/css/app.css" />
  </head>
  <body>
    <!-- Your content -->
    <script src="/js/ui.js"></script>
  </body>
</html>
```

2. **Add route** in `src/server.js`:

```javascript
app.get('/newpage', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/newpage.html'));
});
```

3. **Add navigation link** in navbar.

---

## Database Schema Understanding

### User Model

- Stores authentication data
- Role-based access (USER, TEACHER, ADMIN)
- Settings stored as JSON

### Vocabulary Model

- Core entity for words
- Definitions and examples as JSON arrays
- Many-to-many with Tags
- Owned by User

### Tag Model

- Organizational labels
- Custom colors
- Owned by User

### Review Model

- Tracks spaced repetition data
- Links Vocabulary and User
- Stores SM-2 algorithm variables

---

## API Request Examples

### Register User

```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### Add Vocabulary

```bash
POST /api/v1/vocab
Content-Type: application/json
Cookie: connect.sid=...

{
  "word": "algorithm",
  "language": "en",
  "difficulty": "MEDIUM",
  "partOfSpeech": "noun",
  "ipa": "/ˈælɡərɪðəm/",
  "definitions": ["A step-by-step procedure"],
  "examples": ["The sorting algorithm is efficient"]
}
```

### Submit Review

```bash
POST /api/v1/review/:id
Content-Type: application/json

{
  "quality": 4
}
```

---

## UI Customization

### Changing Theme Colors

Edit CSS variables in `public/css/app.css`:

```css
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Change to your colors */
}
```

### Adding New Components

Follow existing pattern in `app.css`:

```css
.my-component {
  background: var(--surface-glass);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}
```

### Adding New UI Behaviors

Add to `public/js/ui.js`:

```javascript
const MyFeature = {
  init() {
    // Your initialization
  },

  doSomething() {
    // Your logic
  },
};

// Export
window.VocaPro.MyFeature = MyFeature;
```

---

## Debugging Tips

### Backend Debugging

1. **Console Logs:**

```javascript
const logger = require('./utils/logger');
logger.info('Debug info');
logger.error('Error details');
```

2. **VS Code Debugger:**
   Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Server",
  "program": "${workspaceFolder}/src/server.js",
  "envFile": "${workspaceFolder}/.env"
}
```

### Frontend Debugging

1. **Browser DevTools:**

   - F12 to open
   - Console tab for errors
   - Network tab for API calls

2. **Check UI state:**

```javascript
// In browser console
console.log(VocaPro.Theme.current);
console.log(localStorage);
```

### Database Debugging

```bash
# View all data in GUI
npm run prisma:studio

# Raw SQL in code
const result = await prisma.$queryRaw`SELECT * FROM users`;
```

---

## Performance Optimization

### Backend

1. **Add database indexes** in schema:

```prisma
model Vocabulary {
  @@index([ownerId])
  @@index([word])
}
```

2. **Use select to limit fields**:

```javascript
await prisma.user.findMany({
  select: { id: true, name: true },
});
```

3. **Batch operations**:

```javascript
await prisma.vocabulary.createMany({ data: [...] });
```

### Frontend

1. **Debounce expensive operations**:

```javascript
const searchDebounced = VocaPro.debounce(search, 500);
```

2. **Lazy load images**:

```html
<img loading="lazy" src="..." />
```

3. **Minimize DOM operations**:

```javascript
// Build HTML string, then set once
element.innerHTML = items.map((i) => `<li>${i}</li>`).join('');
```

---

## Testing Best Practices

### Writing Tests

```javascript
describe('Feature', () => {
  test('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Testing API Routes

```javascript
const request = require('supertest');
const app = require('../src/server');

test('GET /api/v1/vocab', async () => {
  const response = await request(app).get('/api/v1/vocab').set('Cookie', 'connect.sid=...');

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('data');
});
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Environment variables set correctly
- [ ] Database connection string uses production DB
- [ ] SESSION_SECRET changed from default
- [ ] Google OAuth redirect URI updated
- [ ] CORS origin set to production URL
- [ ] NODE_ENV=production
- [ ] Tests pass (`npm test`)
- [ ] No console.log in production code
- [ ] Error handling complete
- [ ] Logs configured (Winston)
- [ ] Database migrations run
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting configured

---

## Common Issues & Solutions

### "Prisma Client not found"

```bash
npm run prisma:generate
```

### "Cannot find module"

```bash
rm -rf node_modules package-lock.json
npm install
```

### "Database connection refused"

Check:

1. Connection string format
2. Firewall rules
3. Database exists
4. Credentials correct

### "Session store disconnected"

If using Redis, ensure it's running:

```bash
redis-cli ping
# Should return: PONG
```

---

## Git Workflow

### Branch Strategy

```bash
main      # Production
develop   # Integration
feature/* # New features
fix/*     # Bug fixes
```

### Commit Messages

Follow conventional commits:

```
feat: Add vocabulary search filter
fix: Resolve session timeout issue
docs: Update API documentation
test: Add review algorithm tests
```

### Before Committing

```bash
npm run lint          # Check code style
npm test             # Run tests
git status           # Review changes
```

---

## Resources

### Documentation

- [Express.js Docs](https://expressjs.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Passport.js Guide](http://www.passportjs.org/)
- [Azure SQL Docs](https://docs.microsoft.com/azure/azure-sql/)

### Tools

- [Prisma Studio](https://www.prisma.io/studio)
- [Swagger Editor](https://editor.swagger.io/)
- [Postman](https://www.postman.com/)
- [DBeaver](https://dbeaver.io/)

---

## Getting Help

1. Check documentation (README.md, QUICKSTART.md)
2. Search GitHub Issues
3. Check API docs at /api-docs
4. Contact support@vocapro.com

---

**Happy Coding! 🚀**
