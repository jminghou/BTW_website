# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build production version
npm run start        # Start production server
npm run lint         # Run ESLint code linting
```

## Project Architecture

This is a **Next.js 14** business website for ByTheWay (浩華智能取餐) with an integrated admin panel for managing company data.

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Styled Components
- **Database**: Neon PostgreSQL (serverless)
- **Email**: EmailJS + Nodemailer
- **Analytics**: Google Analytics
- **Authentication**: Custom bcrypt-based auth

### Key Architecture Patterns

#### Dual-Purpose Application
The app serves two distinct purposes:
1. **Public Website** (`/`) - Marketing site for BTW smart food vending machines
2. **Admin Panel** (`/admin`) - Internal management system with authentication

#### Database Integration
- Central database utility at `src/lib/db.ts` using Neon serverless PostgreSQL
- Comprehensive CRUD operations for all entities (users, contacts, goals, stats, partners, regions)
- Auto-initialization system that creates tables and default admin user (admin/5241)

#### Component Organization
```
src/components/
├── admin/           # Admin panel components (auth-protected)
├── cards/           # Reusable card components  
├── buttons/         # Button components
└── [feature].tsx    # Main landing page sections
```

#### API Structure
```
src/app/api/
├── auth/           # Authentication endpoints
├── contacts/       # Contact form management
├── users/          # User management
├── annual-goals/   # Company goals tracking
├── company-stats/  # Business metrics
├── partners/       # Client management
├── regions/        # Regional data
└── db/             # Database utilities
```

### Authentication Flow
- Admin access requires login via `/admin`
- Database auto-initializes if tables don't exist
- Default admin credentials: `admin` / `5241`
- User info stored in localStorage post-login

### Path Aliases
- `@/*` maps to `src/*` for clean imports

### Environment Requirements
- `DATABASE_URL` - Neon PostgreSQL connection string
- `GA_MEASUREMENT_ID` - Google Analytics tracking ID

### Data Management
The admin panel manages several data types:
- **Contacts**: Customer inquiries from contact forms
- **Users**: Admin user accounts with role-based access
- **Annual Goals**: Progress tracking with percentages
- **Company Stats**: Business metrics with trends
- **Partners**: Enterprise client relationships
- **Regions**: Geographic performance data

### Styling Approach
- Tailwind CSS for utility-first styling
- Styled Components for complex component styles
- Responsive design with mobile-first approach
- Custom color palette matching BTW brand identity

### Development Notes
- ESLint configured to ignore unused variables warnings
- TypeScript strict mode enabled
- App Router file-based routing system
- CSV data processing capabilities for bulk imports