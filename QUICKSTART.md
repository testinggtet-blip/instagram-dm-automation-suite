# Quick Start Guide

Get your Instagram DM Automation Tool running in 5 minutes!

## ⚡ Quick Setup

### 1. Clone and Setup

```bash
# Install frontend dependencies
npm install  # or bun install

# Setup backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/instagram_dm_automation
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:8000/api/auth/callback
SECRET_KEY=your-secret-key
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Create Database

```bash
createdb instagram_dm_automation
```

### 4. Run Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python main.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev  # or bun dev
```

### 5. Access the App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🔑 Facebook App Requirements

Before using the app, set up a Facebook App:

1. Go to https://developers.facebook.com/
2. Create new app → Business type
3. Add products:
   - Facebook Login
   - Instagram Graph API
4. Settings → Basic:
   - Copy App ID and App Secret
5. Facebook Login → Settings:
   - Add OAuth Redirect: `http://localhost:8000/api/auth/callback`
6. Permissions needed:
   - `instagram_basic`
   - `instagram_manage_messages`
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_metadata`

## 📱 Testing Flow

1. **Login**: Click "Login with Facebook" on homepage
2. **Connect Account**: Choose your Instagram Business account
3. **Create Rule**: Go to Automation → Create a keyword-based rule
4. **Test**: Send a DM with the keyword to trigger automation
5. **Check Inbox**: View conversations and messages

## 🐛 Common Issues

**"No Instagram accounts found"**
- Make sure you have an Instagram Business or Creator account
- It must be connected to a Facebook Page
- Check App permissions in Facebook Developer Console

**Backend won't start**
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify DATABASE_URL is correct
- Make sure port 8000 is not in use

**Frontend can't connect**
- Check backend is running on port 8000
- Verify NEXT_PUBLIC_API_URL in .env.local
- Check CORS settings in backend

## 📖 Next Steps

- Read full [README.md](./README.md) for detailed documentation
- Check [API Documentation](http://localhost:8000/docs)
- Set up webhooks for production deployment

## 🚀 Production Deployment

### Quick Deploy Checklist

- [ ] Generate strong SECRET_KEY: `openssl rand -hex 32`
- [ ] Deploy backend to Railway/Heroku
- [ ] Deploy frontend to Vercel
- [ ] Setup managed PostgreSQL database
- [ ] Configure production URLs in Facebook App
- [ ] Setup Instagram webhooks
- [ ] Enable HTTPS (required for webhooks)
- [ ] Test end-to-end flow

---

Happy Automating! 🤖✨
