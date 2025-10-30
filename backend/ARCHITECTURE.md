# Zenith Study Backend Architecture

```mermaid
graph TD
    A[Frontend Client] --> B[Express.js Server]
    B --> C[MongoDB Database]

    B --> D[Authentication Routes]
    B --> E[User Routes]
    B --> F[Notes Routes]
    B --> G[Study Sessions Routes]
    B --> H[Activity Routes]

    D --> I[Auth Controller]
    E --> J[User Controller]
    F --> K[Notes Controller]
    G --> L[Study Sessions Controller]
    H --> M[Activity Controller]

    I --> N[User Model]
    J --> N
    K --> O[Note Model]
    L --> P[Study Session Model]
    M --> Q[Activity Model]

    N --> C
    O --> C
    P --> C
    Q --> C

    R[Middleware] --> B
```

## Components Overview

### 1. Server (server.js)

- Entry point of the application
- Sets up Express.js middleware
- Connects to MongoDB
- Registers API routes

### 2. Configuration (config/)

- Database connection setup

### 3. Middleware (middleware/)

- Authentication middleware for protecting routes

### 4. Models (models/)

- User model for authentication and user management
- Note model for study notes
- StudySession model for collaborative study sessions
- Activity model for tracking user engagement

### 5. Controllers (controllers/)

- Auth controller for registration and login
- User controller for profile management
- Notes controller for note operations
- Sessions controller for study session management
- Activity controller for tracking user activities

### 6. Routes (routes/)

- Authentication routes (/api/auth)
- User routes (/api/users)
- Notes routes (/api/notes)
- Study sessions routes (/api/sessions)
- Activity routes (/api/activities)

### 7. Environment Configuration (.env)

- Environment variables for configuration
