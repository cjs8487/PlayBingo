# PlayBingo Development Setup

## Quick Start

1. **Run the setup script:**
   ```bash
   ./setup-dev.sh
   ```

2. **Start development servers:**
   ```bash
   ./start-dev.sh
   ```

3. **Open your browser:**
   - Web application: http://localhost:3000 (or 3001)
   - API documentation: http://localhost:8000/api/docs

## What the Setup Script Does

The `setup-dev.sh` script automatically:

1. ✅ Checks prerequisites (Node.js 18+, Docker)
2. ✅ Installs all dependencies (schema, API, web)
3. ✅ Creates environment files with proper configuration
4. ✅ Starts PostgreSQL database
5. ✅ Runs database migrations
6. ✅ Seeds database with test data
7. ✅ Tests compilation of all modules
8. ✅ Creates development startup script
9. ✅ Sets up proper session configuration for development

## Environment Configuration

### API (.env)
- `TESTING=true` - Enables development mode (disables secure cookies)
- `E_API_KEY=dev-api-key-12345` - Emergency API key for development
- `CLIENT_URL=http://localhost:3000` - Web app URL
- `DATABASE_URL` - PostgreSQL connection string

### Web (.env.local)
- `NEXT_PUBLIC_API_PATH=http://localhost:8000` - API server URL
- `API_KEY=dev-api-key-12345` - API key for authentication

## Test Users

The database is seeded with these test users (password: `password`):

- **staff@playbingo.gg** - Staff user with admin privileges
- **owner@playbingo.gg** - Game owner user
- **mod@playbingo.gg** - Moderator user
- **player@playbingo.gg** - Regular player user

## Troubleshooting

### Port Issues
- If port 3000 is busy, Next.js will automatically use 3001
- Update `CLIENT_URL` in `api/.env` if needed

### Session Issues
- Ensure `TESTING=true` is set in `api/.env`
- This disables secure cookies for local development

### Database Issues
```bash
cd api
docker compose down
docker compose up -d
npx prisma migrate dev
npm run db:seed
```

### Clean Install
```bash
# Remove all node_modules and reinstall
find . -name "node_modules" -type d -exec rm -rf {} +
find . -name "package-lock.json" -delete
./setup-dev.sh
```

## Development Workflow

1. Make code changes
2. Both API and Web servers auto-reload
3. Database changes: `cd api && npx prisma migrate dev --name your-migration`
4. Run tests: `cd api && npm test`

## Project Structure

```
PlayBingo/
├── api/                 # Backend API server
├── web/                 # Next.js frontend
├── schema/              # Shared TypeScript types
├── setup-dev.sh         # Development setup script
├── start-dev.sh         # Development startup script
└── DEVELOPMENT.md       # This documentation
```
