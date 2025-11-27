# Step-by-Step Guide: Deploying to Render

This guide will walk you through deploying your ConnectHub application to Render with MongoDB Atlas.

---

## Prerequisites

- A GitHub account
- Your code pushed to a GitHub repository
- A MongoDB Atlas account (free tier available)

---

## Step 1: Set Up MongoDB Atlas

### 1.1 Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Click **"Try Free"** or **"Sign Up"**
3. Fill in your details and create an account

### 1.2 Create a Free Cluster

1. After logging in, you'll see the **"Deploy a cloud database"** screen
2. Select **"M0 Free"** (Free Shared Cluster)
3. Choose a cloud provider and region (closest to your Render region)
4. Click **"Create"** (cluster name is optional)
5. Wait 3-5 minutes for the cluster to be created

### 1.3 Create Database User

1. In the left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication method
4. Enter a username (e.g., `connecthub-user`)
5. Enter a strong password (save this securely!)
6. Under **"Database User Privileges"**, select **"Read and write to any database"**
7. Click **"Add User"**

### 1.4 Configure Network Access

1. In the left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (this adds `0.0.0.0/0`)
   - For production, you can restrict to Render's IPs, but allowing all is fine for now
4. Click **"Confirm"**

### 1.5 Get Your Connection String

1. In the left sidebar, click **"Database"**
2. Click **"Connect"** on your cluster
3. Select **"Connect your application"**
4. Choose **"Node.js"** as the driver and **"4.1 or later"** as the version
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Important:** Replace `<username>` and `<password>` with your database user credentials
7. Add your database name at the end:
   ```
   mongodb+srv://connecthub-user:yourpassword@cluster0.xxxxx.mongodb.net/user_blog_portal?retryWrites=true&w=majority
   ```
8. **Save this connection string** - you'll need it in Step 3!

---

## Step 2: Push Code to GitHub

### 2.1 Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit - ready for Render deployment"
```

### 2.2 Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon → **"New repository"**
3. Enter repository name (e.g., `connecthub-blogging-platform`)
4. Choose **Public** or **Private**
5. **Do NOT** initialize with README, .gitignore, or license
6. Click **"Create repository"**

### 2.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

---

## Step 3: Deploy to Render

### 3.1 Create Render Account

1. Go to [Render](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with GitHub (recommended) or email
4. Authorize Render to access your GitHub repositories

### 3.2 Create New Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub account if prompted
3. Find and select your repository
4. Click **"Connect"**

### 3.3 Configure Service Settings

Fill in the following:

- **Name**: `user-blog-portal` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: Leave empty (or `.` if needed)
- **Runtime**: `Node`
- **Build Command**: 
  ```
  npm install --include=dev && npm run deploy:prep
  ```
- **Start Command**: 
  ```
  npm run start
  ```
- **Plan**: `Free` (or choose a paid plan)

### 3.4 Set Environment Variables

Scroll down to **"Environment Variables"** section and add:

1. **NODE_ENV**
   - Key: `NODE_ENV`
   - Value: `production`

2. **DATABASE_URL**
   - Key: `DATABASE_URL`
   - Value: Your MongoDB Atlas connection string from Step 1.5
   - Example: `mongodb+srv://connecthub-user:password@cluster0.xxxxx.mongodb.net/user_blog_portal?retryWrites=true&w=majority`

3. **SESSION_SECRET**
   - Key: `SESSION_SECRET`
   - Value: Generate a random string:
     - **On Mac/Linux**: Run `openssl rand -base64 32` in terminal
     - **On Windows**: Run `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
     - **Or use**: Any long random string (at least 32 characters)

4. **PORT** (Optional)
   - Render automatically sets this, but you can leave it empty or set to `10000`

### 3.5 Deploy

1. Scroll down and click **"Create Web Service"**
2. Render will start building your application
3. Watch the build logs - it should show:
   - Installing dependencies
   - Running TypeScript check
   - Building client and server
   - Starting the application

### 3.6 Verify Deployment

1. Wait for the build to complete (usually 2-5 minutes)
2. Check the logs for:
   - ✅ "Connected to MongoDB"
   - ✅ "serving on port 10000" (or your port)
3. Click on your service URL (e.g., `https://user-blog-portal.onrender.com`)
4. You should see your application!

---

## Step 4: Troubleshooting

### Build Fails

- **Check build logs** for specific errors
- Ensure all dependencies are in `package.json`
- Verify `buildCommand` is correct

### MongoDB Connection Fails

- **Verify DATABASE_URL** in Render environment variables
- Check MongoDB Atlas:
  - Network Access allows all IPs (0.0.0.0/0)
  - Database user credentials are correct
  - Connection string includes database name
- Check Render logs for specific error messages

### Application Crashes

- **Check runtime logs** in Render dashboard
- Verify all environment variables are set
- Ensure `SESSION_SECRET` is set
- Check MongoDB connection is working

### Common Errors

**"Invalid scheme" error:**
- Your `DATABASE_URL` must start with `mongodb://` or `mongodb+srv://`
- Double-check your MongoDB Atlas connection string

**"Authentication failed":**
- Verify your MongoDB Atlas username and password
- Ensure database user has read/write permissions

**"Connection timeout":**
- Check MongoDB Atlas Network Access settings
- Ensure IP whitelist includes Render's IPs (or allows all)

---

## Step 5: Updating Your Deployment

After making changes to your code:

1. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. Render will automatically detect the push and redeploy
3. Monitor the deployment in Render dashboard

---

## Step 6: Custom Domain (Optional)

1. In your Render service, go to **"Settings"**
2. Scroll to **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Enter your domain name
5. Follow Render's instructions to configure DNS

---

## Quick Reference

### Environment Variables Summary

| Variable | Value | Required |
|----------|-------|----------|
| `NODE_ENV` | `production` | Yes |
| `DATABASE_URL` | MongoDB Atlas connection string | Yes |
| `SESSION_SECRET` | Random 32+ character string | Yes |
| `PORT` | Auto-set by Render | No |

### MongoDB Atlas Connection String Format

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### Render Service URLs

- Your app will be available at: `https://your-service-name.onrender.com`
- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds

---

## Support

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Project Issues**: Check your GitHub repository issues

---

## Success Checklist

- [ ] MongoDB Atlas cluster created and running
- [ ] Database user created with read/write permissions
- [ ] Network access configured (all IPs allowed)
- [ ] Connection string copied and formatted correctly
- [ ] Code pushed to GitHub
- [ ] Render service created
- [ ] All environment variables set in Render
- [ ] Build completed successfully
- [ ] Application accessible via Render URL
- [ ] Can create account and post content

🎉 **Congratulations!** Your application is now live on Render!

