# ServicesWebApp

A full-stack web application for connecting service providers with clients in a marketplace-style platform. Built with React frontend and Node.js/Express backend with MySQL database.

## Architecture

This project consists of two main parts:

- **Frontend** (`services-web-app/`): React application with modern UI components
- **Backend** (`Backend/`): Node.js/Express API server with authentication and database integration

## Implemented Features

### User Authentication
- User registration and login
- JWT-based session management
- Password hashing with bcrypt

### Services Marketplace
- Browse services with search and filtering
- Filter by category, rating, and price range
- Sort by rating, price, and review count
- Pagination with "Load More" functionality
- Service cards with provider information and ratings

### User Interface
- Responsive landing page with hero, services, about, and contact sections
- Login and registration forms
- Client dashboard with service browsing
- Provider dashboard interface
- Navigation between different sections

### Technical Infrastructure
- Express.js API server with CORS support
- MySQL database configuration
- React Router for client-side navigation
- Component-based architecture with organized folder structure

## In Progress

### Booking System
- Service booking functionality
- Booking management and history
- Provider request handling

### Provider Features
- Full provider dashboard with service management
- Quick stats and analytics
- Upcoming jobs management

### Database Integration
- Real database implementation (currently using mock data)
- User profiles and service data persistence
- Review and rating system

### Additional Features
- Profile page management
- Advanced search and filtering options
- Service provider onboarding

## Tech Stack

### Frontend
- React 18 - Modern React with hooks
- React Router - Client-side routing
- CSS - Component-scoped styling
- Testing Library - Unit and integration tests

### Backend
- Node.js - Runtime environment
- Express.js - Web framework
- MySQL2 - Database connectivity
- JWT - Authentication tokens
- bcrypt - Password hashing
- CORS - Cross-origin resource sharing

## Project Structure

```
ServicesWebApp/
├── Backend/                    # Node.js/Express API server
│   ├── src/
│   │   ├── config/
│   │   │   └── Database.js    # MySQL connection
│   │   ├── controllers/
│   │   │   └── authController.js
│   │   ├── middleware/
│   │   ├── models/
│   │   │   └── userModel.js
│   │   ├── routes/
│   │   │   └── authRoutes.js
│   │   └── services/
│   │       └── authService.js
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server startup
│   └── package.json
├── services-web-app/          # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── shared/        # Shared components (Navbar)
│   │   │   ├── landing-page/  # Landing page sections
│   │   │   ├── dashboard/     # Dashboard components
│   │   │   ├── login/         # Login form
│   │   │   ├── registration/  # Registration form
│   │   │   ├── services/      # Services browsing components
│   │   │   └── provider-mode/ # Provider dashboard components
│   │   ├── pages/            # Page components
│   │   ├── styles/           # CSS stylesheets
│   │   ├── data/             # Mock data
│   │   └── assets/           # Static assets
│   ├── package.json
│   └── README.md
├── package.json               # Root package.json
└── README.md                  # This file
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL database
- npm or yarn package manager

### Backend Setup

1. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your MySQL database and update connection details in `src/config/Database.js`

4. Set environment variables (create `.env` file):
   ```env
   JWT_SECRET=your-secret-key-change-in-production
   DB_HOST=localhost
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=services_db
   ```

5. Start the backend server:
   ```bash
   npm start
   ```
   Server will run on http://localhost:3000

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd services-web-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   Frontend will run on http://localhost:3000

## Available Scripts

### Backend
- `npm start` - Start the production server

### Frontend
- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/health` - Health check

## UI Components

The application features a modern, responsive design with:

- Landing Page: Hero section, services overview, about, contact
- Authentication: Login and registration forms
- Client Dashboard: Service browsing, booking management
- Provider Dashboard: Business management interface
- Services Marketplace: Search, filter, and book services

## Testing

Frontend tests use React Testing Library:
```bash
cd services-web-app
npm test
```

## Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## Security

- JWT authentication with 24-hour expiration
- Password hashing with bcrypt
- CORS enabled for cross-origin requests
- Input validation and sanitization

## Development Status

This is a development version with mock data. The core authentication and marketplace browsing features are functional, with booking and provider management features currently in development.


## License

This project is licensed under the ISC License.