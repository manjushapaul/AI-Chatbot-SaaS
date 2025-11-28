# Authentication System Documentation

This document describes the comprehensive authentication system implemented for the AI Chatbot SaaS platform.

## 🚀 Features

### ✅ **What's Implemented:**

1. **User Authentication**
   - Email/password-based login
   - Secure password hashing with bcrypt
   - JWT-based sessions with NextAuth.js
   - Multi-tenant user isolation

2. **User Registration**
   - Secure signup with validation
   - Tenant-based user creation
   - Password strength requirements
   - Duplicate user prevention

3. **Session Management**
   - Persistent sessions (30 days)
   - Secure JWT tokens
   - Automatic session refresh
   - Proper logout functionality

4. **Route Protection**
   - Protected dashboard routes
   - Role-based access control
   - Automatic redirects for unauthenticated users
   - Loading states during authentication

5. **Security Features**
   - Password hashing with bcrypt
   - Input validation with Zod
   - CSRF protection via NextAuth
   - Secure cookie handling

## 🏗️ Architecture

### **Components Structure:**
```
src/
├── components/
│   ├── auth/
│   │   ├── SignInForm.tsx      # Login form
│   │   ├── SignUpForm.tsx      # Registration form
│   │   ├── ProtectedRoute.tsx  # Route protection
│   │   └── UserProfile.tsx     # User profile display
│   ├── ui/                     # Reusable UI components
│   └── providers/
│       └── SessionProvider.tsx # NextAuth session wrapper
├── lib/
│   ├── auth.ts                 # NextAuth configuration
│   ├── db.ts                   # Database utilities
│   └── utils.ts                # Utility functions
└── app/
    ├── api/auth/               # Authentication API routes
    ├── auth/                   # Authentication pages
    └── dashboard/              # Protected dashboard
```

### **Authentication Flow:**
1. User visits `/auth` page
2. Chooses between sign-in or sign-up
3. Form validation and submission
4. API call to authentication endpoint
5. NextAuth processes credentials
6. JWT session created and stored
7. Redirect to protected dashboard
8. Session maintained across requests

## 🔧 Setup & Configuration

### **1. Environment Variables**
Create a `.env.local` file with:
```bash
# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret"

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ai_chatbot_saas"
```

### **2. Generate NextAuth Secret**
```bash
node scripts/generate-secret.js
```

### **3. Database Setup**
```bash
# Update Prisma schema (password field added)
npx prisma generate
npx prisma db push
```

### **4. Install Dependencies**
```bash
npm install bcryptjs @types/bcryptjs
```

## 📱 Usage Examples

### **Sign In Component:**
```tsx
import { SignInForm } from '@/components/auth/SignInForm';

export default function LoginPage() {
  return (
    <div>
      <SignInForm 
        tenant="yourcompany"
        onSwitchToSignUp={() => setShowSignUp(true)}
      />
    </div>
  );
}
```

### **Sign Up Component:**
```tsx
import { SignUpForm } from '@/components/auth/SignUpForm';

export default function SignUpPage() {
  return (
    <div>
      <SignUpForm 
        tenant="yourcompany"
        onSwitchToSignIn={() => setShowSignIn(true)}
      />
    </div>
  );
}
```

### **Protected Routes:**
```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div>Admin-only content</div>
    </ProtectedRoute>
  );
}
```

### **User Session Access:**
```tsx
import { useSession } from 'next-auth/react';

export function UserInfo() {
  const { data: session } = useSession();
  
  if (session) {
    return (
      <div>
        <p>Welcome, {session.user.name}!</p>
        <p>Role: {session.user.role}</p>
        <p>Tenant: {session.user.tenant.name}</p>
      </div>
    );
  }
  
  return <p>Not signed in</p>;
}
```

## 🔒 Security Considerations

### **Password Security:**
- Passwords hashed with bcrypt (12 rounds)
- Minimum 8 character requirement
- Secure password comparison

### **Session Security:**
- JWT tokens with 30-day expiration
- Secure cookie settings
- CSRF protection enabled

### **Input Validation:**
- Zod schema validation
- SQL injection prevention
- XSS protection

### **Multi-tenancy:**
- User isolation by tenant
- Tenant validation on login
- Secure tenant context

## 🧪 Testing

### **Manual Testing:**
1. Visit `/auth` page
2. Test sign-up with new user
3. Test sign-in with created user
4. Verify dashboard access
5. Test logout functionality

### **API Testing:**
```bash
# Test signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "tenant": "testcompany"
  }'

# Test signin (via NextAuth)
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "tenant": "testcompany"
  }'
```

## 🚨 Troubleshooting

### **Common Issues:**

1. **"Invalid credentials" error:**
   - Check if user exists in database
   - Verify tenant subdomain is correct
   - Ensure password matches

2. **Session not persisting:**
   - Check NEXTAUTH_SECRET is set
   - Verify NEXTAUTH_URL is correct
   - Check browser cookie settings

3. **Database connection errors:**
   - Verify DATABASE_URL is correct
   - Check if database is running
   - Ensure Prisma schema is up to date

4. **Component import errors:**
   - Check file paths are correct
   - Verify TypeScript compilation
   - Ensure all dependencies are installed

### **Debug Mode:**
Enable NextAuth debug mode in `.env.local`:
```bash
NEXTAUTH_DEBUG=true
```

## 🔄 Future Enhancements

### **Planned Features:**
1. **Social Authentication**
   - Google OAuth
   - GitHub OAuth
   - Microsoft OAuth

2. **Advanced Security**
   - Two-factor authentication (2FA)
   - Password reset functionality
   - Account lockout after failed attempts

3. **User Management**
   - Admin user management
   - User role management
   - Bulk user operations

4. **Audit Logging**
   - Login/logout tracking
   - Failed authentication attempts
   - User activity monitoring

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [bcrypt.js Documentation](https://github.com/dcodeIO/bcrypt.js/)
- [Zod Validation](https://zod.dev/)

## 🤝 Contributing

When adding new authentication features:
1. Follow the existing component patterns
2. Add proper TypeScript types
3. Include error handling
4. Add validation with Zod
5. Update this documentation
6. Test thoroughly before submitting

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team 