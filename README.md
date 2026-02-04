# CSI43C9 Farmers Market

A full-stack application for managing farmers market vendors and transactions.

## Prerequisites

- **Java 25** - [Installation Guide](https://adoptium.net/)
- **Node.js 20+** - [Download](https://nodejs.org/)
- **Docker & Docker Compose** - [Install](https://docs.docker.com/get-docker/)

## Local Setup

### 1. Database Setup

```bash
# Navigate to docker directory
cd docker

# Copy environment file (if needed)
cp .env.example .env  # Edit with your database credentials

# Start the database
docker-compose -f local.docker-compose.yml up -d

# The database will be available at:
# Host: localhost
# Port: 3307
# Database: farmers_market_db (or as configured in .env)
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Set environment variables (optional, defaults are in application.properties)
export SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3307/farmers_market_db
export SPRING_DATASOURCE_USERNAME=root
export SPRING_DATASOURCE_PASSWORD=your_password
export FARMERS_MARKET_JWT_SECRET=your-secret-key-here

# Run the application
./gradlew bootRun

# Or build and run
./gradlew build
java -jar build/libs/farmers-market-0.0.1-SNAPSHOT.jar
```

The backend will start on `http://localhost:8080` (default Spring Boot port).

**Verify backend is running:**
```bash
curl http://localhost:8080/api/auth/hello
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will start on `http://localhost:3000` (default Next.js port).

**Build for production:**
```bash
npm run build
npm start
```

## Running the Full Stack

### Terminal 1: Database
```bash
cd docker
docker-compose -f local.docker-compose.yml up
```

### Terminal 2: Backend
```bash
cd backend
./gradlew bootRun
```

### Terminal 3: Frontend
```bash
cd frontend
npm run dev
```

## Environment Variables

### Backend (`backend/src/main/resources/application.properties`)

The backend uses environment variables with fallback defaults:

| Variable | Default | Description |
|----------|---------|-------------|
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://localhost:3306/farmers_market_db` | Database connection URL |
| `SPRING_DATASOURCE_USERNAME` | `root` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | (empty) | Database password |
| `FARMERS_MARKET_JWT_SECRET` | `defaultJwtSecretKey...` | JWT signing secret |

### Frontend

Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Testing

### Backend Tests
```bash
cd backend
./gradlew test
```

### Code Style Check
```bash
cd backend
./gradlew checkstyleMain checkstyleTest
```

### Frontend Linting
```bash
cd frontend
npm run lint
```

## SSH into Server with Tailscale

### Prerequisites
- Tailscale account and client installed on your local machine
- Server has Tailscale installed and connected to your Tailscale network

### Setup Steps

1. **Install Tailscale on your local machine** (if not already installed):
   ```bash
   # macOS
   brew install tailscale
   
   # Or download from https://tailscale.com/download
   ```

2. **Connect to Tailscale network**:
   ```bash
   tailscale up
   ```
   Follow the prompts to authenticate with your Tailscale account.

3. **Find the server's Tailscale IP**:
   - Log into [Tailscale Admin Console](https://login.tailscale.com/admin/machines)
   - Find your server in the list
   - Note the Tailscale IP address (e.g., `100.x.x.x`)

4. **SSH into the server**:
   ```bash
   # Using Tailscale IP
   ssh user@100.x.x.x
   
   # Or if you've set up a hostname in Tailscale
   ssh user@your-server-hostname
   ```

5. **Verify Tailscale connection**:
   ```bash
   # On the server
   tailscale status
   ```

### Troubleshooting

- **Can't connect via Tailscale IP:**
  - Verify both machines are connected: `tailscale status`
  - Check firewall rules on the server
  - Ensure Tailscale is running: `sudo systemctl status tailscale` (Linux)

- **Permission denied:**
  - Ensure your Tailscale account has access to the server
  - Check SSH key authentication is set up

- **Connection timeout:**
  - Verify Tailscale is active: `tailscale ping 100.x.x.x`
  - Check network connectivity

### Alternative: Using Tailscale Funnel (for temporary access)

If you need to expose services temporarily:
```bash
# On the server
tailscale funnel --bg 8080
```

## Project Structure

```
CSI43C9-farmers-market/
├── backend/              # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/     # Java source code
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       └── db/    # Database schema
│   │   └── test/          # Test files
│   └── build.gradle       # Gradle build configuration
├── frontend/             # Next.js frontend
│   ├── app/              # Next.js app directory
│   └── package.json
├── docker/               # Docker configurations
│   ├── local.docker-compose.yml
│   └── *.Dockerfile
└── .github/              # GitHub Actions workflows
    └── workflows/
        ├── codestyle.yml
        └── build_and_deploy.yml
```

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run code style checks: `./gradlew checkstyleMain checkstyleTest`
4. Commit your changes: `git commit -m "Add your feature"`
5. Push to the branch: `git push origin feature/your-feature`
6. Open a Pull Request

**Note:** All PRs require:
- ✅ Checkstyle to pass
- ✅ At least 1 code owner review

## License

[Add your license here]
