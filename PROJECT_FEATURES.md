# iAzi - Project Features & Dependencies

## Project Overview
iAzi is a service booking platform that connects users with professionals and companies. The application supports service discovery, booking management, reviews, and gamification features.

---

## Core Features

### 1. Authentication & Authorization
- **Login**: Email/password authentication with JWT tokens
- **Registration**: User signup with invite code support
- **Forgot Password**: Password recovery flow
- **Token Management**: Access token + refresh token with automatic refresh
- **Role-based Access**: User, Professional, Company, Admin roles
- **Protected Routes**: Route guards for authenticated content

### 2. User Management
- **User Profile**: View and edit personal information
- **User Addresses**: CRUD operations for delivery/service addresses
- **Notifications**: Bell icon with notification center
- **Settings**: User preferences and account settings

### 3. Professional Features
- **Professional Profile**: Public-facing profile page
- **Professional Dashboard**: Statistics, appointments, popular services
- **Professional Calendar**: Schedule management with day/week views
- **Professional Bookings**: Manage incoming appointments
- **Professional Services**: Service management (CRUD)
- **Professional Reviews**: View and respond to ratings
- **Professional Reports**: Analytics and performance metrics
- **Professional Settings**: Account and availability configuration

### 4. Company Features
- **Company Registration**: Create a new company profile
- **Company Profile**: Public company page
- **Company Dashboard**: Admin panel for company management
- **Company Services**: Service catalog management
- **Company Staff**: Staff member management
- **Company Calendar**: Team scheduling
- **Company Reviews**: Review management
- **Company Reports**: Business analytics
- **Company Settings**: Company configuration

### 5. Booking System
- **Service Search**: Find services by category, professional, or keyword
- **Service Details**: Detailed service information with pricing
- **Booking Flow**: Multi-step booking with date/time selection
- **Booking History**: View past and upcoming appointments
- **Booking Reschedule**: Change appointment times
- **Appointment Status**: Pending, Confirmed, In-Progress, Completed, Cancelled, No-Show

### 6. Search & Discovery
- **Category Browsing**: Explore services by category
- **Search Dropdown**: Quick search with suggestions
- **Professional Directory**: Browse available professionals
- **Company Directory**: Browse registered companies
- **Filters**: Sort and filter results

### 7. Reviews & Ratings
- **Create Reviews**: Rate services, professionals, companies
- **Review History**: View submitted reviews
- **Review Statistics**: Average ratings and distributions

### 8. Social Features
- **Social Feed**: Activity feed on home page
- **Publications**: Share content (New Publication page)
- **Invite System**: Generate and share invite codes

### 9. Gamification
- **Achievements**: Unlock badges and milestones
- **Gamification Page**: View progress and rewards

### 10. PWA Features
- **Install App Button**: Prompt for mobile installation
- **Network Status**: Offline/online indicator
- **Service Worker**: Caching and background sync

---

## UI Components (shadcn/ui)

### Core Components
- Accordion, Alert, Alert-Dialog, Aspect-Ratio
- Avatar, Badge, Breadcrumb, Button
- Calendar, Card, Carousel, Chart
- Checkbox, Clear-Cache-Button, Collapsible, Command
- Context-Menu, Dialog, Drawer, Dropdown-Menu
- Form, Hover-Card, Input, Input-OTP
- Install-App-Button, Label, Loading, Menubar
- Navigation-Menu, Network-Status, Page-Container, Pagination
- Popover, Progress, PWA-Update-Notification, Radio-Group
- Resizable, Scroll-Area, Select, Separator
- Sheet, Sidebar, Skeleton, Slider
- Sonner (Toast), Switch, Table, Tabs
- Textarea, Toast, Toaster, Toggle, Toggle-Group, Tooltip

### Custom Components
- Navigation (Header)
- SearchDropdown
- HeroSection, CategorySection, ServicesSection, ProfessionalsSection
- PageFooter, FooterGroups
- AppointmentSection, SocialFeed
- InviteModal, ProtectedRoute
- ServiceCard, CategoryCard, ProfessionalCard
- BookingCalendar, BookingHeader, BookingTimeslots
- Various form components for profiles, services, reviews

---

## Dependencies

### Core Framework
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.2"
}
```

### State & Data Management
```json
{
  "@tanstack/react-query": "^5.56.2",
  "axios": "^1.9.0",
  "zod": "^3.23.8"
}
```

### Forms
```json
{
  "@hookform/resolvers": "^3.9.0",
  "react-hook-form": "^7.53.0"
}
```

### UI Framework
```json
{
  "tailwindcss": "^3.4.11",
  "tailwind-merge": "^2.5.2",
  "tailwindcss-animate": "^1.0.7",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1"
}
```

### Radix UI Primitives
```json
{
  "@radix-ui/react-accordion": "^1.2.0",
  "@radix-ui/react-alert-dialog": "^1.1.1",
  "@radix-ui/react-aspect-ratio": "^1.1.0",
  "@radix-ui/react-avatar": "^1.1.0",
  "@radix-ui/react-checkbox": "^1.1.1",
  "@radix-ui/react-collapsible": "^1.1.0",
  "@radix-ui/react-context-menu": "^2.2.1",
  "@radix-ui/react-dialog": "^1.1.2",
  "@radix-ui/react-dropdown-menu": "^2.1.1",
  "@radix-ui/react-hover-card": "^1.1.1",
  "@radix-ui/react-label": "^2.1.0",
  "@radix-ui/react-menubar": "^1.1.1",
  "@radix-ui/react-navigation-menu": "^1.2.0",
  "@radix-ui/react-popover": "^1.1.1",
  "@radix-ui/react-progress": "^1.1.0",
  "@radix-ui/react-radio-group": "^1.2.0",
  "@radix-ui/react-scroll-area": "^1.1.0",
  "@radix-ui/react-select": "^2.1.1",
  "@radix-ui/react-separator": "^1.1.0",
  "@radix-ui/react-slider": "^1.2.0",
  "@radix-ui/react-slot": "^1.1.0",
  "@radix-ui/react-switch": "^1.1.0",
  "@radix-ui/react-tabs": "^1.1.0",
  "@radix-ui/react-toast": "^1.2.1",
  "@radix-ui/react-toggle": "^1.1.0",
  "@radix-ui/react-toggle-group": "^1.1.0",
  "@radix-ui/react-tooltip": "^1.1.4"
}
```

### UI Utilities
```json
{
  "cmdk": "^1.0.0",
  "embla-carousel-react": "^8.3.0",
  "input-otp": "^1.2.4",
  "lucide-react": "^0.462.0",
  "next-themes": "^0.3.0",
  "react-day-picker": "^8.10.1",
  "react-resizable-panels": "^2.1.3",
  "recharts": "^2.12.7",
  "sonner": "^1.5.0",
  "vaul": "^0.9.3"
}
```

### Utilities
```json
{
  "date-fns": "^3.6.0",
  "lodash": "^4.17.21",
  "uuid": "^11.1.0"
}
```

### Dev Dependencies
```json
{
  "@types/node": "^22.5.5",
  "@types/react": "^18.3.3",
  "@types/react-dom": "^18.3.0",
  "@vitejs/plugin-react-swc": "^3.5.0",
  "autoprefixer": "^10.4.20",
  "postcss": "^8.4.47",
  "typescript": "^5.5.3",
  "vite": "^5.4.1"
}
```

---

## Color Palette (iAzi Brand)

```typescript
iazi: {
  white: '#fcfcfc',
  'rosa-1': '#f1d2d2',
  'rosa-2': '#edc4c4',
  'rosa-medio': '#e9b6b6',
  'rosa-escuro': '#e5a8a9',
  'text': '#333333',
  'primary': '#cc6677',
  'primary-hover': '#993344',
  'border': '#dddddd',
  'background-alt': '#f7f7f7'
}
```

---

## Typography

```typescript
fontFamily: {
  'inter': ['Inter', 'sans-serif'],
  'outfit': ['Outfit', 'sans-serif'],
  'playfair': ['Playfair Display', 'serif'],
}
```

---

## API Endpoints (Backend)

### Authentication
- `POST /auth/login` - Login with email/password
- `POST /auth/register` - Create new user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Invalidate refresh token
- `POST /auth/invites` - Generate invite code

### Users
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile
- `GET /users/me/addresses` - Get user addresses
- `POST /users/me/addresses` - Create address
- `PUT /users/me/addresses/:id` - Update address
- `DELETE /users/me/addresses/:id` - Delete address

### Professionals
- `GET /professionals` - List professionals
- `GET /professionals/:id` - Get professional details
- `GET /professionals/me` - Get current professional profile
- `PUT /professionals/me` - Update professional profile
- `POST /professionals` - Create professional profile
- `GET /professionals/:id/services` - Get professional services
- `GET /professionals/:id/availability` - Get availability

### Companies
- `GET /companies` - List companies
- `GET /companies/:id` - Get company details
- `POST /companies` - Register company
- `PUT /companies/:id` - Update company
- `GET /companies/:id/appointments` - Get company appointments
- `GET /companies/:id/services` - Get company services

### Services
- `GET /services` - List services
- `GET /services/:id` - Get service details

### Appointments
- `GET /appointments` - List appointments (with filters)
- `POST /appointments` - Create appointment
- `PATCH /appointments/:id/status` - Update status
- `PATCH /appointments/:id` - Reschedule

### Reviews
- `GET /reviews` - List reviews (with filters)
- `GET /reviews/:id` - Get review details
- `POST /reviews` - Create review
- `PUT /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review

### Categories
- `GET /categories` - List categories

### Search
- `GET /search` - Search services, professionals, companies
- `GET /search/quick-booking` - Quick booking suggestions

### Notifications
- `GET /notifications` - List notifications

---

## Migration to Next.js

### Key Changes
1. **Routing**: Replace react-router-dom with Next.js App Router
2. **API Client**: Use Next.js API routes or keep axios for external API
3. **SSR/SSG**: Leverage server components where appropriate
4. **Metadata**: Use Next.js metadata API for SEO
5. **Image Optimization**: Use next/image component
6. **Font Loading**: Use next/font for optimized font loading

### Folder Structure (Next.js App Router)
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (main)/
│   │   ├── page.tsx (Home)
│   │   ├── booking/[id]/page.tsx
│   │   ├── booking-history/page.tsx
│   │   ├── company/[id]/page.tsx
│   │   ├── professional/[id]/page.tsx
│   │   ├── search/page.tsx
│   │   ├── services/page.tsx
│   │   └── service/[id]/page.tsx
│   ├── profile/
│   │   ├── page.tsx
│   │   └── professional/
│   │       └── [...slug]/page.tsx
│   ├── company/
│   │   ├── register/page.tsx
│   │   └── my-company/
│   │       ├── dashboard/page.tsx
│   │       ├── services/page.tsx
│   │       └── ...
│   ├── layout.tsx
│   ├── globals.css
│   └── providers.tsx
├── components/
│   ├── ui/
│   ├── home/
│   ├── booking/
│   ├── professional/
│   ├── company/
│   └── ...
├── lib/
│   ├── api.ts
│   ├── utils.ts
│   └── api-config.ts
├── hooks/
│   ├── use-toast.ts
│   ├── use-mobile.ts
│   └── ...
├── contexts/
│   └── AuthContext.tsx
└── types/
    └── ...
```
