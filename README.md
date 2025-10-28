# Financial Tracker App

A React-based financial tracking application for managing stock and option trading portfolios.

## Features

- **User Authentication** - Login/logout with JWT tokens
- **Role-Based Access Control** - Admin and User roles
- **Portfolio Management** - Create, edit, delete portfolios
- **Options Trading** - Track option trades with detailed information
  - Buy to Open / Buy to Close
  - Sell to Open / Sell to Close
  - Strike price, expiration, premium tracking
- **User Management** (Admin only) - Manage users and permissions

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Router** - Navigation
- **TanStack Query (React Query)** - Server state management
- **Zustand** - Client state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Axios** - HTTP client
- **Vite** - Build tool

## Project Structure

```
src/
├── features/           # Feature-based modules
│   ├── auth/          # Authentication
│   ├── portfolios/    # Portfolio management
│   ├── trades/        # Trade management
│   └── users/         # User management
├── shared/            # Shared components and utilities
│   ├── components/    # Reusable components
│   ├── hooks/         # Custom hooks
│   └── utils/         # Utility functions
├── routes/            # Route configuration
├── types/             # TypeScript type definitions
└── api/               # API client configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A backend API server running (see API Configuration below)

### Installation

1. Clone or extract this project

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set your API URL:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## API Configuration

This app requires a backend API with the following endpoints:

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Portfolios
- `GET /api/portfolios` - Get all portfolios
- `GET /api/portfolios/:id` - Get portfolio by ID
- `POST /api/portfolios` - Create portfolio
- `PUT /api/portfolios/:id` - Update portfolio
- `DELETE /api/portfolios/:id` - Delete portfolio

### Trades
- `GET /api/portfolios/:portfolioId/trades` - Get all trades for portfolio
- `GET /api/portfolios/:portfolioId/trades/:id` - Get trade by ID
- `POST /api/portfolios/:portfolioId/trades` - Create trade
- `PUT /api/portfolios/:portfolioId/trades/:id` - Update trade
- `DELETE /api/portfolios/:portfolioId/trades/:id` - Delete trade

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Features

This project follows a feature-based architecture. To add a new feature:

1. Create a new folder in `src/features/`
2. Add `api/`, `components/`, and `hooks/` subdirectories
3. Define types in `src/types/`
4. Add routes in `src/routes/index.tsx`

## Extending for Mobile

This codebase is structured to facilitate sharing code with a React Native mobile app:

1. Keep business logic in `hooks/` and `api/` folders
2. Keep UI components separate
3. Use a monorepo structure (pnpm workspaces, Turborepo, etc.)
4. Share the `types/`, `api/`, and `hooks/` folders between web and mobile

### Suggested Monorepo Structure

```
financial-tracker/
├── packages/
│   ├── shared/          # Shared logic
│   │   ├── api/
│   │   ├── types/
│   │   └── hooks/
│   ├── web/             # This React app
│   └── mobile/          # React Native app
└── package.json
```

## License

MIT
