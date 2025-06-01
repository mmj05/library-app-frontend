# Authentication Migration: Okta to JWT

## Overview
This document outlines the migration from Okta authentication to JWT token-based authentication for the Library App frontend.

## Changes Made

### 1. Dependencies Updated
- **Removed**: `@okta/okta-react`, `@okta/okta-signin-widget`
- **Added**: `axios` for HTTP client management
- **Updated**: `package.json` to remove Okta dependencies

### 2. New Authentication System

#### AuthContext (`src/context/AuthContext.tsx`)
- Created new React Context for JWT authentication
- Manages authentication state (user, token, isAuthenticated, isLoading)
- Provides login, register, logout, and getCurrentUser functions
- Automatically configures axios headers with JWT token
- Handles token storage in localStorage

#### API Configuration (`src/lib/apiConfig.ts`)
- Centralized API configuration
- Base URL: `http://localhost:8080/api` (configurable via environment)
- Timeout and default headers configuration

#### API Service (`src/lib/apiService.ts`)
- Centralized HTTP client with axios
- Automatic token injection via interceptors
- Automatic logout on 401 responses
- All backend endpoints organized by feature

### 3. Authentication Components

#### Login Form (`src/Auth/LoginForm.tsx`)
- Custom login form replacing Okta widget
- Email/password authentication
- Error handling and loading states
- Redirects to registration page

#### Registration Form (`src/Auth/RegisterForm.tsx`)
- User registration with email, password, first name, last name
- Password confirmation validation
- Success/error messaging
- Auto-redirect to login after successful registration

#### Protected Route (`src/components/ProtectedRoute.tsx`)
- Replaces Okta's SecureRoute
- Supports admin-only routes
- Automatic redirect to login for unauthenticated users

### 4. Updated Components

#### App.tsx
- Removed Okta Security wrapper
- Added AuthProvider wrapper
- Updated routing to use ProtectedRoute
- Added registration route

#### Navbar.tsx
- Updated to use new authentication context
- Shows user name from JWT token
- Added registration button
- Updated admin role checking

#### All Page Components
- Updated to use `useAuth()` instead of `useOktaAuth()`
- Changed token access from `authState.accessToken?.accessToken` to `authState.token`
- Updated user email access from `authState.accessToken?.claims.sub` to `authState.user?.email`
- Updated admin role checking from `authState.accessToken?.claims.userType` to `authState.user?.role`

### 5. API Integration

#### Backend Compatibility
- All API calls now use JWT Bearer tokens
- Endpoints match backend JWT authentication system:
  - `POST /api/auth/login` - User login
  - `POST /api/auth/register` - User registration
  - `GET /api/auth/me` - Get current user info

#### Token Management
- JWT tokens stored in localStorage as 'jwtToken'
- Automatic token injection in all authenticated requests
- Automatic logout on token expiration (401 responses)

### 6. Environment Configuration
- Created `.env` file with `REACT_APP_API=http://localhost:8080/api`
- All API calls now use centralized configuration

## Backend Requirements

The frontend now expects the backend to provide:

### Authentication Endpoints
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "token": "jwt-token-here",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER" | "ADMIN"
}

POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password",
  "firstName": "John",
  "lastName": "Doe"
}

GET /api/auth/me
Headers: Authorization: Bearer <jwt-token>
Response:
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER" | "ADMIN"
}
```

### JWT Token Format
- Standard JWT token with user information
- Should include user email as subject
- Role information for authorization
- Configurable expiration time

## Testing

### Build Status
✅ Application builds successfully with `npm run build`
✅ Development server starts with `npm start`
⚠️ Some linting warnings remain (non-blocking)

### Manual Testing Required
1. User registration flow
2. User login flow
3. Protected route access
4. Admin-only route access
5. Token persistence across browser refresh
6. Automatic logout on token expiration

## Migration Benefits

1. **Simplified Architecture**: Removed dependency on external Okta service
2. **Better Control**: Full control over authentication flow
3. **Cost Effective**: No external service costs
4. **Customizable**: Easy to modify authentication logic
5. **Backend Integration**: Direct integration with custom JWT backend

## Next Steps

1. Test all authentication flows manually
2. Verify all protected routes work correctly
3. Test admin-only functionality
4. Ensure proper error handling
5. Add refresh token functionality if needed
6. Implement password reset functionality if required

## Files Modified

### New Files
- `src/context/AuthContext.tsx`
- `src/Auth/LoginForm.tsx`
- `src/Auth/RegisterForm.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/lib/apiService.ts`
- `.env`

### Modified Files
- `package.json`
- `src/App.tsx`
- `src/layouts/NavbarAndFooter/Navbar.tsx`
- All page components (BookCheckoutPage, ManageLibraryPage, etc.)
- All component files that used Okta authentication

### Deleted Files
- `src/lib/oktaConfig.ts`
- `src/Auth/OktaSignInWidget.jsx`
- `src/Auth/LoginWidget.jsx` 