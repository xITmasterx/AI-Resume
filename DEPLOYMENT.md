# Deployment Guide - Secure Resume Chat App

This guide explains how to deploy your Resume Chat Application while keeping your API keys and passwords secure.

## 🔒 Security Overview

Your repository is configured for secure deployment:

- ✅ **Safe to push to GitHub**: No credentials in version control
- ✅ **Local development**: Uses `.env.local` (ignored by Git)
- ✅ **Production deployment**: Uses platform environment variables

## 🚀 Quick Deploy Options

### Option 1: Render (Recommended - Free Tier Available)

1. **Sign up at [Render](https://render.com/)**
2. **Create a new Web Service**
3. **Connect your GitHub repository**
4. **Configure:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node
5. **Set environment variables in Render dashboard:**
   ```
   NODE_ENV=production
   OPENROUTER_API_KEY=your_actual_openrouter_api_key_here
   EMAIL_USER=your_actual_email@gmail.com
   EMAIL_PASS=your_actual_app_password_here
   ```

### Option 2: Railway (Free Tier Available)

1. **Sign up at [Railway](https://railway.app/)**
2. **Connect your GitHub repository**
3. **Deploy with one click**
4. **Set environment variables in Railway dashboard:**
   ```
   NODE_ENV=production
   OPENROUTER_API_KEY=your_actual_openrouter_api_key_here
   EMAIL_USER=your_actual_email@gmail.com
   EMAIL_PASS=your_actual_app_password_here
   ```

### Option 3: Heroku (Paid)

1. **Install Heroku CLI**
2. **Login and create app:**
   ```bash
   heroku login
   heroku create your-app-name
   ```
3. **Set environment variables:**
   ```bash
   heroku config:set OPENROUTER_API_KEY=your_key
   heroku config:set OPENROUTER_MODEL=deepseek/deepseek-v3-base:free
   # ... add other variables
   ```
4. **Deploy:**
   ```bash
   git push heroku main
   ```

### Option 4: DigitalOcean App Platform

1. **Sign up at [DigitalOcean](https://www.digitalocean.com/)**
2. **Create a new App**
3. **Connect your GitHub repository**
4. **Configure environment variables**
5. **Deploy**

## 🔧 How Environment Loading Works

The application automatically detects the environment:

```javascript
// In development: loads .env.local (not committed to Git)
// In production: uses platform environment variables
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: ".env.local" });
}
```

## 📋 Required Environment Variables

| Variable             | Description        | Required | Example               |
| -------------------- | ------------------ | -------- | --------------------- |
| `NODE_ENV`           | Environment type   | Yes      | `production`          |
| `OPENROUTER_API_KEY` | OpenRouter API key | Yes      | `sk-or-v1-...`        |
| `EMAIL_USER`         | Gmail address      | Yes      | `your@gmail.com`      |
| `EMAIL_PASS`         | Gmail app password | Yes      | `abcd efgh ijkl mnop` |

## 🏠 Local Development Setup

1. **Clone repository**
2. **Install dependencies:** `npm install`
3. **Create local environment file:** `cp .env.local.example .env.local`
4. **Update .env.local with your actual credentials**
5. **Start server:** `npm start`
6. **Visit:** http://localhost:3000

> **Note**: Never commit `.env.local` - it's automatically ignored by Git!

## Features

- Upload DOCX resume files
- AI-powered chat about resume content
- Email conversation summaries
- Real-time streaming responses
- Session management

## Tech Stack

- **Backend:** Node.js, Express
- **AI:** OpenRouter API (DeepSeek V3)
- **File Processing:** Mammoth (DOCX parsing)
- **Email:** Nodemailer
- **Frontend:** Vanilla HTML/CSS/JavaScript
