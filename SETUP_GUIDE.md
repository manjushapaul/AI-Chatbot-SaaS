# 🚀 Quick Setup Guide - Get Access to Dashboard

## Prerequisites

1. **Database Setup**: Make sure your PostgreSQL database is running and accessible
2. **Environment Variables**: Ensure your `.env` file has the correct `DATABASE_URL`
3. **Dependencies**: All required packages are already installed

## 🎯 Quick Setup (3 Steps)

### Step 1: Run Database Migrations
```bash
cd ai-chatbot-saas
npx prisma migrate dev
npx prisma generate
```

### Step 2: Create Test Account
```bash
node scripts/setup-test-account.js
```

### Step 3: Start Development Server
```bash
npm run dev
```

## 🔑 Login Credentials

After running the setup script, you'll have access with:

- **Email**: `admin@test.com`
- **Password**: `password123`
- **Tenant**: `test`
- **Dashboard URL**: `http://localhost:3000/dashboard`

## 🎉 What You'll Get

The setup script creates:
- ✅ **Test Company** tenant
- ✅ **Test Bot** with AI capabilities
- ✅ **Test Knowledge Base** for content
- ✅ **Test Widget** ready for embedding
- ✅ **Admin User** with full access

## 🧪 Test the System

1. **Login to Dashboard**: Use the credentials above
2. **Create a Bot**: Customize your chatbot
3. **Configure Widget**: Set colors, position, theme
4. **Test Chat**: Use the test page at `/test-widget.html`
5. **Embed Widget**: Copy the widget code to any website

## 🔧 Troubleshooting

### If you get "Tenant not found" error:
- Make sure you ran the setup script
- Check that the database migrations completed successfully
- Verify your `.env` file has the correct `DATABASE_URL`

### If you get "User already exists":
- The test account was already created
- Use the credentials: `admin@test.com` / `password123`

### If the setup script fails:
- Check your database connection
- Ensure PostgreSQL is running
- Verify your database user has create permissions

## 📱 Dashboard Features

Once logged in, you can:
- **Manage Bots**: Create, edit, and configure AI chatbots
- **Knowledge Bases**: Upload documents and create FAQs
- **Widgets**: Customize and embed chat widgets
- **Analytics**: View chat statistics and user engagement
- **User Management**: Manage team members and permissions

## 🚀 Next Steps

After accessing the dashboard:
1. **Customize your bot** with personality and knowledge
2. **Upload documents** to your knowledge base
3. **Configure widgets** with your brand colors
4. **Test the public chat** endpoint
5. **Embed widgets** on your website

---

**Need Help?** Check the console output from the setup script for detailed information about what was created. 