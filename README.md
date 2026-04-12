CSI43C9 Farmers Market
======================

A full-stack desktop application for managing farmers market vendors and transactions.

Built with a **Next.js** frontend wrapped in **Tauri v2**, powered by a **Spring Boot** backend running invisibly as a highly optimized **GraalVM** native sidecar.

Architecture Overview
---------------------

*   **Frontend:** Next.js (React) rendered natively via Tauri (WebKit/WebView2).

*   **Backend Sidecar:** Spring Boot 3 API compiled ahead-of-time (AOT) to a native OS executable.

*   **Database:** Embedded H2 database dynamically created in the user's OS application support directory (e.g., ~/Library/Application Support/MarketOS on Mac).


Prerequisites
-------------

*   **GraalVM JDK 25** – Standard OpenJDK will _not_ work for packaging the desktop app. You must use a GraalVM distribution with native-image support (e.g., via [SDKMAN!](https://sdkman.io/)).

*   **Node.js 20+** – [Download](https://nodejs.org/)

*   **Rust & Cargo** – Required for Tauri. [Installation Guide](https://rustup.rs/)

*   **Docker & Python** – Required only for running the legacy data import scripts.


Local Development Workflow
--------------------------

Because the backend takes several minutes to compile into a native binary, standard development is done using the **"Two-Terminal" workflow** with the standard Java Virtual Machine (JVM).

### 1\. Environment Variables

Create a .env.local file in the frontend/ directory.

> **Note:** You must use 127.0.0.1 instead of localhost to bypass macOS WebKit IPv6 routing issues.

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8080
```

### 2\. Run the Full Stack

**Terminal 1: Spring Boot Backend**
<br>Runs the backend dynamically with hot-reloading on Port 8080.

```
cd backend  
./gradlew bootRun
```

**Terminal 2: Next.js + Tauri Frontend**
<br>Spins up the Next.js UI and launches the native desktop window. The UI is configured to intelligently bypass launching the sidecar if it detects standard development mode.

```
cd frontend  
npx tauri dev
```

_(Alternatively, run npm run dev to test the UI entirely in a standard web browser)._

Packaging the Desktop Application
---------------------------------

To build the final distributable installer (e.g., .dmg, .exe), you must compile the Spring Boot backend into a native binary and feed it to Tauri.

### 1\. Compile the Native Java Sidecar

Uses GraalVM to compile the Spring Boot application into an ultra-fast, standalone executable.

```
cd backend  
./gradlew nativeCompile
```

### 2\. Move and Rename the Binary

Tauri requires sidecars to be placed in the src-tauri/binaries folder and appended with the target OS architecture (e.g., -aarch64-apple-darwin for Mac M-series).

**Example for Apple Silicon (Mac):**

```
mkdir -p frontend/src-tauri/binaries  
cp backend/build/native/nativeCompile/farmers-market frontend/src-tauri/binaries/spring-backend-aarch64-apple-darwin  
# Ensure macOS allows it to execute  
chmod +x frontend/src-tauri/binaries/spring-backend-aarch64-apple-darwin
```

### 3\. Build the Installer

```
cd frontend
npx tauri build
```

The final installer will be generated in frontend/src-tauri/target/release/bundle/.

Testing & Code Quality
----------------------

### Backend Tests

```
cd backend  
./gradlew test
```

### Code Style Check

Java generated code must follow **Checkstyle 10.21.4**.

```
cd backend
./gradlew checkstyleMain checkstyleTest
```

### Frontend Linting

```
cd frontend  npm run lint
```

Data Importing (Optional)
-------------------------

If you need to bulk-import historical data into your environment:

```
# Navigate to importing directory  
cd importing  
# Install libraries  
pip install -r requirements.txt  
# Import vendor profiles  
python import_vendors.py   
# Import vendor transactions  
python import_transactions.py`
```

SSH into Server with Tailscale
------------------------------

Used for remote database/web deployments or accessing a remote MySQL instance.

### Setup Steps

1.  Bash# macOSbrew install tailscale

2.  Bashtailscale up

3.  **Find the server's Tailscale IP:** Log into the Tailscale Admin Console and note the IP (e.g., 100.x.x.x).

4.  Bashssh user@100.x.x.x


### Troubleshooting

*   **Can't connect via Tailscale IP:** Verify both machines are connected (tailscale status). Check server firewall rules.

*   **Connection timeout:** Verify Tailscale is active: tailscale ping 100.x.x.x

*   On the servertailscale funnel --bg 8080


Project Structure
-----------------

```
CSI43C9-farmers-market/
├── backend/              # Spring Boot backend
│   ├── src/main/java/    # Java source code (JDBC, Javadoc, Checkstyle 10.21.4)
│   └── build.gradle      # Gradle build & GraalVM configuration
├── frontend/             # Next.js frontend
│   ├── app/              # React components and pages
│   ├── src-tauri/        # Rust wrapper and OS configurations
│   │   ├── binaries/     # Compiled GraalVM sidecars go here!
│   │   ├── capabilities/ # Tauri v2 security permissions
│   │   └── tauri.conf.json
│   └── package.json
├── importing/            # Python scripts for Excel data migration
├── docker/               # Legacy Docker configurations
└── .github/              # GitHub Actions workflows
└── workflows/
├── codestyle.yml
└── build-macos.yml
```

Contributing
------------

1.  Create a feature branch: git checkout -b feature/your-feature

2.  **Coding Standards:**

    *   Use Objects.isNull() and Objects.nonNull() (avoid == null).

    *   Java files **must** end with a newline.

    *   Use Javadoc for all methods.

    *   Use camelCase for JUnit test names.

    *   No wildcard imports.

3.  Run code style checks: ./gradlew checkstyleMain checkstyleTest

4.  Commit your changes: git commit -m "Add your feature"

5.  Push to the branch: git push origin feature/your-feature

6.  Open a Pull Request.
