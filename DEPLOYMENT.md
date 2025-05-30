# Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Recommended - Free Tier Available)

1. **Sign up at [Railway](https://railway.app/)**
2. **Connect your GitHub repository**
3. **Deploy with one click**
4. **Set environment variables in Railway dashboard:**
   - `OPENROUTER_API_KEY`: Your OpenRouter API key
   - `OPENROUTER_MODEL`: deepseek/deepseek-v3-base:free
   - `EMAIL_HOST`: smtp.gmail.com
   - `EMAIL_PORT`: 587
   - `EMAIL_SECURE`: false
   - `EMAIL_USER`: your_email@gmail.com
   - `EMAIL_PASS`: your_gmail_app_password
   - `MAX_FILE_SIZE`: 10485760

### Option 2: Render (Free Tier Available)

1. **Sign up at [Render](https://render.com/)**
2. **Create a new Web Service**
3. **Connect your GitHub repository**
4. **Configure:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node
5. **Add environment variables** (same as Railway)

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

## Environment Variables Required

Copy from `.env.example` and update with your actual values:

- `OPENROUTER_API_KEY`: Get from https://openrouter.ai/
- `EMAIL_USER` & `EMAIL_PASS`: Gmail credentials (use App Password)
- Other variables can use default values

## Local Development

1. **Clone repository**
2. **Install dependencies:** `npm install`
3. **Copy environment file:** `cp .env.example .env`
4. **Update .env with your credentials**
5. **Start server:** `npm start`
6. **Visit:** http://localhost:3000

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
