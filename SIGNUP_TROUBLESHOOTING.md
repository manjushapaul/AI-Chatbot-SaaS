# 🔧 Signup Troubleshooting Guide

## 🚨 **"Tenant not found" Error - FIXED!**

### **What Was Wrong**
The signup system was expecting existing tenants instead of creating new ones during signup.

### **What We Fixed**
- ✅ **Signup now creates new organizations** automatically
- ✅ **First user becomes admin** of their organization
- ✅ **Free plan subscription** is created automatically
- ✅ **Proper error handling** for duplicate subdomains

---

## 🎯 **How Signup Works Now**

### **Step 1: Enter Your Information**
```
Email: your-email@company.com
Name: Your Full Name
Organization Subdomain: yourcompany (unique identifier)
Password: StrongPassword123!
```

### **Step 2: System Creates**
1. **New Organization** with your subdomain
2. **Admin Account** for you
3. **Free Plan Subscription** automatically
4. **Ready-to-use workspace**

### **Step 3: Start Using**
- Login with your credentials
- Access your dashboard
- Create your first bot
- Start building knowledge bases

---

## 🔍 **Common Signup Issues & Solutions**

### **Issue 1: "Organization subdomain already exists"**
**Solution**: Choose a different subdomain
```
❌ yourcompany (already taken)
✅ yourcompany2024
✅ yourcompanyinc
✅ yourcompanyai
```

### **Issue 2: "User with this email already exists"**
**Solution**: Use a different email or sign in instead
```
❌ john@company.com (already exists)
✅ john.doe@company.com
✅ john+new@company.com
```

### **Issue 3: "Password too short"**
**Solution**: Use at least 8 characters
```
❌ 1234567 (too short)
✅ MySecurePass123!
✅ Company2024!
```

### **Issue 4: "Invalid email format"**
**Solution**: Use valid email format
```
❌ john.company (missing @ and domain)
✅ john@company.com
✅ john.doe@company.co.uk
```

---

## 🚀 **Quick Signup Steps**

### **1. Visit Signup Page**
```
Go to: https://your-domain.com/auth
Click: "Sign Up" or "Create Account"
```

### **2. Fill Form**
```
Organization: yourcompany
Name: John Doe
Email: john@company.com
Password: SecurePass123!
Confirm: SecurePass123!
```

### **3. Submit & Verify**
```
Click: "Create Account"
Check: Email for verification (if required)
Login: With your credentials
```

---

## ✅ **Verification Checklist**

### **Before Signup**
- [ ] Choose unique organization subdomain
- [ ] Use valid email address
- [ ] Create strong password (8+ characters)
- [ ] Have access to email for verification

### **After Signup**
- [ ] Account created successfully
- [ ] Can login to dashboard
- [ ] See your organization name
- [ ] Access to create bots and knowledge bases

---

## 🆘 **Still Having Issues?**

### **Check These First**
1. **Browser Console** - Look for JavaScript errors
2. **Network Tab** - Check if API calls are failing
3. **Email Format** - Ensure valid email address
4. **Password Strength** - At least 8 characters

### **Common Solutions**
1. **Clear Browser Cache** - Remove old data
2. **Try Different Browser** - Test in incognito mode
3. **Check Internet** - Ensure stable connection
4. **Contact Support** - If issues persist

---

## 🎉 **Success Indicators**

### **Signup Successful When You See**
- ✅ "Account and organization created successfully!"
- ✅ Redirect to sign-in page
- ✅ Can login with your credentials
- ✅ Access to main dashboard

### **What You Get**
- 🏢 **Your own organization workspace**
- 👤 **Admin account with full access**
- 🤖 **Ability to create AI chatbots**
- 📚 **Knowledge base management**
- 👥 **Team member invitations**
- 📊 **Analytics and insights**

---

## 🔄 **Testing the Fix**

### **Run This Command to Test**
```bash
# In your project directory
node scripts/test-signup.js
```

### **Expected Output**
```
🧪 Testing signup process...

1. Testing tenant creation...
✅ Tenant created successfully: testorg1234567890

2. Testing user creation...
✅ User created successfully: test1234567890@example.com

3. Testing subscription creation...
✅ Subscription created successfully: abc123...

4. Cleaning up test data...
✅ Test data cleaned up successfully

🎉 All signup tests passed! The system is working correctly.
```

---

## 📞 **Need Help?**

### **Support Channels**
- **📖 Documentation**: Check other README files
- **🐛 Bug Reports**: Create issue in repository
- **💬 Community**: Ask in user forums
- **📧 Email**: Contact support team

### **Include This Information**
```
Error Message: [Copy the exact error]
Steps Taken: [What you tried]
Browser: [Chrome, Firefox, Safari, Edge]
Operating System: [Windows, Mac, Linux]
```

---

**🎯 The signup issue has been fixed! You should now be able to create accounts successfully.**

**Try signing up again with the steps above. If you still encounter issues, please provide the exact error message and we'll help you resolve it!** 🚀 