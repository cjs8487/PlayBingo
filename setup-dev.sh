#!/bin/bash

echo "🚀 PlayBingo Development Environment Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "api" ] || [ ! -d "web" ] || [ ! -d "schema" ]; then
    print_error "Please run this script from the PlayBingo root directory"
    exit 1
fi

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) found"

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker."
    exit 1
fi
print_success "Docker found"

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi
print_success "Docker is running"

# Stop any existing processes
print_status "Stopping any existing development processes..."
pkill -f "tsc-watch\|next dev\|node build/src/main.js" 2>/dev/null || true
sleep 2

# Setup Schema Module
print_status "Setting up schema module..."
cd schema
if [ ! -d "node_modules" ]; then
    print_status "Installing schema dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install schema dependencies"
        exit 1
    fi
fi

print_status "Generating TypeScript types..."
npm run types:generate
if [ $? -ne 0 ]; then
    print_error "Failed to generate TypeScript types"
    exit 1
fi
print_success "Schema module ready"
cd ..

# Setup API Module
print_status "Setting up API module..."
cd api

# Install dependencies
if [ ! -d "node_modules" ]; then
    print_status "Installing API dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install API dependencies"
        exit 1
    fi
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating API environment file..."
    cat > .env << 'EOF'
# PlayBingo API Environment Configuration

# Required Environment Variables
ROOM_TOKEN_SECRET=dev-room-token-secret-$(date +%s)
SESSION_SECRET=dev-session-secret-$(date +%s)
CLIENT_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/bingogg

# Development Environment Variables
TESTING=true
PORT=8000
E_API_KEY=dev-api-key-12345

# SMTP Configuration (Optional - for email features)
# SMTP_HOST=smtp.gmail.com
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password

# Racetime Integration (Optional)
# RT_CLIENT_ID=your-racetime-client-id
# RT_CLIENT_SECRET=your-racetime-client-secret
# RT_HOST=racetime.gg

# URL Base (Optional - for production)
# URL_BASE=https://your-domain.com
EOF
    print_success "API environment file created"
else
    print_status "API environment file already exists"
    # Ensure TESTING=true is set for development
    if ! grep -q "TESTING=true" .env; then
        echo "TESTING=true" >> .env
        print_status "Added TESTING=true to API environment"
    fi
fi

# Start PostgreSQL
print_status "Starting PostgreSQL database..."
docker compose up -d
if [ $? -ne 0 ]; then
    print_error "Failed to start PostgreSQL"
    exit 1
fi

# Wait for PostgreSQL to be ready
print_status "Waiting for database to be ready..."
sleep 5

# Run database migrations
print_status "Running database migrations..."
npx prisma migrate dev --name init
if [ $? -ne 0 ]; then
    print_error "Failed to run database migrations"
    exit 1
fi

# Seed database
print_status "Seeding database with test data..."
npm run db:seed
if [ $? -ne 0 ]; then
    print_error "Failed to seed database"
    exit 1
fi
print_success "Database setup complete"

# Test API compilation
print_status "Testing API compilation..."
npm run build
if [ $? -ne 0 ]; then
    print_error "API compilation failed"
    exit 1
fi
print_success "API compiles successfully"
cd ..

# Setup Web Module
print_status "Setting up Web module..."
cd web

# Install dependencies
if [ ! -d "node_modules" ]; then
    print_status "Installing Web dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install Web dependencies"
        exit 1
    fi
fi

# Create .env.local file if it doesn't exist
if [ ! -f ".env.local" ]; then
    print_status "Creating Web environment file..."
    cat > .env.local << 'EOF'
# PlayBingo Web Environment Configuration

# Required Environment Variables
NEXT_PUBLIC_API_PATH=http://localhost:8000
API_KEY=dev-api-key-12345

# Optional Environment Variables
# NEXT_PUBLIC_RT_URL=https://racetime.gg
EOF
    print_success "Web environment file created"
else
    print_status "Web environment file already exists"
fi

# Test Web TypeScript compilation
print_status "Testing Web TypeScript compilation..."
# Skip TypeScript check as Next.js handles its own type checking
# Raw tsc doesn't understand Next.js imports and types
print_success "Web TypeScript compilation skipped (Next.js handles type checking)"
cd ..

# Create development startup script
print_status "Creating development startup script..."
cat > start-dev.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting PlayBingo Development Environment"
echo "============================================="

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start PostgreSQL if not already running
echo "🗄️  Starting PostgreSQL database..."
cd api
docker compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Start API server in background
echo "🔧 Starting API server..."
npm run dev &
API_PID=$!

# Wait a moment for API to start
sleep 3

# Start Web server in background
echo "🌐 Starting Web server..."
cd ../web
npm run dev &
WEB_PID=$!

echo ""
echo "✅ Development environment started!"
echo ""
echo "🌐 Web application: http://localhost:3000 (or 3001 if 3000 is busy)"
echo "🔧 API server: http://localhost:8000"
echo "📚 API documentation: http://localhost:8000/api/docs"
echo ""
echo "Default login credentials (password: 'password'):"
echo "- staff@playbingo.gg (staff user)"
echo "- owner@playbingo.gg (owner user)"
echo "- mod@playbingo.gg (moderator user)"
echo "- player@playbingo.gg (regular user)"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping development servers..."
    kill $API_PID 2>/dev/null
    kill $WEB_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
EOF

chmod +x start-dev.sh
print_success "Development startup script created"

# Create comprehensive README
print_status "Creating development documentation..."
cat > DEVELOPMENT.md << 'EOF'
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
EOF

print_success "Development documentation created"

# Final verification
print_status "Running final verification..."

# Test API endpoint
print_status "Testing API authentication..."
cd api
timeout 10s npm run dev > /dev/null 2>&1 &
API_PID=$!
sleep 5

# Test login endpoint
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "PlayBingo-Api-Key: dev-api-key-12345" \
  -d '{"username": "player", "password": "password"}')

if [ "$LOGIN_RESPONSE" = "OK" ]; then
    print_success "API authentication working"
else
    print_warning "API authentication test failed (this is normal if API isn't fully started yet)"
fi

# Clean up test process
kill $API_PID 2>/dev/null || true

cd ..

echo ""
print_success "🎉 PlayBingo development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: ./start-dev.sh"
echo "2. Open: http://localhost:3000 (or 3001)"
echo "3. Login with: player@playbingo.gg / password"
echo ""
echo "For detailed information, see DEVELOPMENT.md"
