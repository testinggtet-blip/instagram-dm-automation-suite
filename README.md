# Instagram DM Automation Tool

A full-stack application for automating and managing Instagram direct messages through the Instagram Graph API. Built with Next.js 15 (frontend) and FastAPI (backend).

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Usage Guide](#usage-guide)
- [Webhook Setup](#webhook-setup)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### Core Functionality
- **Facebook/Instagram OAuth Integration**: Secure authentication via Facebook Login
- **Instagram Business Account Connection**: Connect and manage multiple Instagram Business accounts
- **Message Management**: View all conversations and messages in a unified inbox
- **Manual Messaging**: Send direct messages manually through the interface
- **Automation Rules**: Create sophisticated automation rules with multiple trigger types
- **Real-time Webhooks**: Process incoming messages in real-time
- **Statistics Dashboard**: Track performance metrics and automation statistics

### Automation Features
- **Keyword Triggers**: Auto-reply when messages contain specific keywords
- **Welcome Messages**: Automatically greet first-time contacts
- **New Message Triggers**: Respond to all incoming messages
- **Priority System**: Control rule execution order
- **Delay Configuration**: Add natural delays before sending automated replies
- **Success Tracking**: Monitor rule performance and success rates

## 🛠 Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Shadcn/UI**: Modern UI components
- **Lucide Icons**: Icon library

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: SQL ORM
- **PostgreSQL**: Primary database
- **httpx**: Async HTTP client for API calls
- **Python-Jose**: JWT token handling

## 📦 Prerequisites

### Required
- Node.js 18+ and npm/yarn/bun
- Python 3.10+
- PostgreSQL 13+
- Facebook Developer Account
- Instagram Business Account connected to a Facebook Page

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd instagram-dm-automation
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/instagram_dm_automation

# Facebook/Instagram API
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:8000/api/auth/callback

# JWT Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Server Configuration
API_HOST=0.0.0.0
API_PORT=8000
FRONTEND_URL=http://localhost:3000

# Webhook Configuration
WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
```

#### Initialize Database

```bash
# Create database
createdb instagram_dm_automation

# The application will automatically create tables on first run
```

#### Start Backend Server

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

### 3. Frontend Setup

#### Install Dependencies

```bash
cd ..  # Return to root directory
npm install
# or
yarn install
# or
bun install
```

#### Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Start Development Server

```bash
npm run dev
# or
yarn dev
# or
bun dev
```

The application will be available at `http://localhost:3000`

## ⚙️ Configuration

### Facebook App Setup

1. **Create Facebook App**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app with "Business" type
   - Add "Facebook Login" and "Instagram" products

2. **Configure Facebook Login**
   - Valid OAuth Redirect URIs: `http://localhost:8000/api/auth/callback`
   - Add your production URL when deploying

3. **Required Permissions**
   - `instagram_basic`
   - `instagram_manage_messages`
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_metadata`

4. **Connect Instagram Business Account**
   - Your Instagram account must be a Business or Creator account
   - It must be connected to a Facebook Page
   - You must be an admin of that Facebook Page

## 📚 API Documentation

### Authentication Endpoints

#### `GET /api/auth/login`
Returns Facebook OAuth URL for user authentication.

**Response:**
```json
{
  "auth_url": "https://www.facebook.com/v18.0/dialog/oauth?..."
}
```

#### `GET /api/auth/callback`
Handles OAuth callback and creates user session.

**Query Parameters:**
- `code`: Authorization code from Facebook

**Response:**
Redirects to frontend with JWT token

#### `GET /api/auth/me`
Get current authenticated user information.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "facebook_id": "123456789",
  "email": "user@example.com",
  "name": "John Doe",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Instagram Endpoints

#### `GET /api/instagram/accounts`
Get all connected Instagram accounts.

#### `POST /api/instagram/connect`
Connect Instagram Business account via Facebook.

#### `GET /api/instagram/accounts/{account_id}/conversations`
Get all conversations for an Instagram account.

#### `GET /api/instagram/conversations/{conversation_id}/messages`
Get messages from a specific conversation.

#### `POST /api/instagram/accounts/{account_id}/send-message`
Send a message to a user.

**Request Body:**
```json
{
  "recipient_id": "17841400000000001",
  "message_text": "Thank you for your message!"
}
```

#### `GET /api/instagram/stats`
Get Instagram statistics.

### Automation Endpoints

#### `GET /api/automation/rules`
Get all automation rules.

#### `POST /api/automation/rules`
Create a new automation rule.

**Request Body:**
```json
{
  "instagram_account_id": 1,
  "name": "Welcome Message",
  "trigger_type": "welcome",
  "reply_message": "Welcome! How can I help you?",
  "reply_delay_seconds": 0,
  "priority": 10
}
```

#### `PUT /api/automation/rules/{rule_id}`
Update an automation rule.

#### `DELETE /api/automation/rules/{rule_id}`
Delete an automation rule.

#### `POST /api/automation/rules/{rule_id}/toggle`
Toggle automation rule status (active/inactive).

#### `GET /api/automation/stats`
Get automation statistics.

### Webhook Endpoints

#### `GET /api/webhooks/instagram`
Webhook verification endpoint for Instagram.

#### `POST /api/webhooks/instagram`
Webhook handler for incoming Instagram messages.

## 📖 Usage Guide

### 1. Initial Setup

1. Start the backend server
2. Start the frontend development server
3. Navigate to `http://localhost:3000`
4. Click "Login with Facebook"
5. Authorize the application
6. Connect your Instagram Business account

### 2. Creating Automation Rules

1. Go to Dashboard → Automation Rules
2. Click "Create Rule"
3. Configure:
   - Select Instagram account
   - Enter rule name and description
   - Choose trigger type:
     - **Keyword**: Triggers when message contains specific words
     - **New Message**: Triggers for any incoming message
     - **Welcome**: Triggers for first-time contacts
   - Enter reply message
   - Set delay (optional)
   - Set priority (higher = checked first)
4. Click "Create Rule"

### 3. Managing Messages

1. Go to Dashboard → Inbox
2. Select a conversation from the list
3. View message history
4. Send manual replies
5. Automated messages are marked with "Auto" badge

## 🔗 Webhook Setup

### For Production Deployment

1. **Deploy Your Backend**
   - Deploy to a server with a public URL
   - Ensure HTTPS is enabled

2. **Configure Facebook Webhook**
   - Go to your Facebook App Dashboard
   - Navigate to Instagram → Configuration
   - Add Webhook URL: `https://your-domain.com/api/webhooks/instagram`
   - Enter your `WEBHOOK_VERIFY_TOKEN`
   - Subscribe to `messages` field

## 📁 Project Structure

```
instagram-dm-automation/
├── backend/
│   ├── app/
│   │   ├── api/routes/         # API route handlers
│   │   ├── core/               # Core configuration
│   │   ├── models/             # Database models
│   │   ├── services/           # Business logic
│   │   ├── schemas/            # Pydantic schemas
│   │   └── database.py         # Database setup
│   ├── main.py                 # FastAPI entry point
│   └── requirements.txt
│
├── src/
│   ├── app/                    # Next.js pages
│   ├── components/             # React components
│   ├── lib/                    # Utilities
│   └── types/                  # TypeScript types
│
└── README.md
```

## 🐛 Troubleshooting

### Common Issues

#### "No Instagram Business accounts found"
- Ensure your Instagram account is a Business or Creator account
- Verify it's connected to a Facebook Page
- Check you're an admin of the Facebook Page

#### "Failed to connect Instagram account"
- Verify Facebook App permissions are granted
- Check `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` in .env
- Ensure your Facebook Page has an Instagram Business account linked

#### "Webhook not receiving messages"
- Verify webhook URL is publicly accessible
- Check `WEBHOOK_VERIFY_TOKEN` matches in Facebook and .env
- Ensure HTTPS is enabled (required by Facebook)

#### "Authentication failed"
- Clear browser localStorage
- Check `FACEBOOK_REDIRECT_URI` matches exactly
- Verify `SECRET_KEY` is set in backend .env

## 🚀 Deployment Checklist

- [ ] Update `FACEBOOK_REDIRECT_URI` with production URL
- [ ] Set strong `SECRET_KEY` and `WEBHOOK_VERIFY_TOKEN`
- [ ] Configure production database
- [ ] Enable HTTPS
- [ ] Set up webhook in Facebook App
- [ ] Configure environment variables on hosting platform
- [ ] Test OAuth flow in production
- [ ] Test webhook delivery

## 📄 License

This project is provided as-is for educational purposes.

---

Built with ❤️ using Next.js, FastAPI, and Instagram Graph API