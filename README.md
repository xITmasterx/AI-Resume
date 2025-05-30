# Resume Chat Application

A web application that allows users to upload DOCX resume files, parse them into structured data, and chat about the resume content using AI. The application also supports sending email summaries of the chat conversations.

## Features

- **DOCX Resume Parsing**: Upload and parse .docx resume files into structured JSON data
- **AI-Powered Chat**: Chat about resume content using OpenRouter API with DeepSeek R1T Chimera (free)
- **Email Notifications**: Send chat summaries via email using SMTP
- **Modern Web Interface**: Clean, responsive frontend with real-time chat
- **Session Management**: Maintain conversation history and context

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Resume Parsing**: Mammoth.js (DOCX to text)
- **AI Integration**: OpenRouter API with DeepSeek R1T Chimera (free)
- **Email**: Nodemailer with SMTP
- **File Upload**: Multer

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the `.env` file and update it with your credentials:

```env
# Server Configuration
PORT=3000

# Hugging Face API Configuration (Free tier)
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
HUGGINGFACE_MODEL=microsoft/DialoGPT-medium

# Email Configuration (Gmail SMTP example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Application Settings
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=.docx
```

### 3. Get Free API Keys

#### OpenRouter API (Free)

1. Go to [OpenRouter](https://openrouter.ai/)
2. Create a free account
3. Go to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the key to your `.env` file

#### Gmail SMTP (Free)

1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings > Security
3. Generate an "App Password" for this application
4. Use your Gmail address and the app password in `.env`

### 4. Run the Application

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. **Upload Resume**: Click "Choose .docx file" and select a resume file
2. **Start Chatting**: Once uploaded, ask questions about the resume
3. **Send Summary**: Enter an email address to receive a chat summary

## API Endpoints

- `GET /` - Serve the main application
- `POST /upload` - Upload and parse resume file
- `POST /chat` - Send chat message and get AI response
- `POST /send-summary` - Send email summary
- `GET /session` - Get current session info
- `POST /clear-session` - Clear current session

## Project Structure

```
├── app.js                 # Main server file
├── package.json          # Dependencies and scripts
├── .env                  # Environment variables
├── README.md             # This file
├── public/               # Static frontend files
│   ├── index.html        # Main HTML page
│   ├── style.css         # Styles
│   └── script.js         # Frontend JavaScript
├── services/             # Backend services
│   ├── resumeParser.js   # DOCX parsing logic
│   ├── chatService.js    # AI chat integration
│   └── emailService.js   # Email functionality
├── uploads/              # Temporary file storage
└── parsed/               # Processed resume data
```

## AI Model Information

The application uses **OpenRouter API** with the **DeepSeek Chat V3** model:

- **Model**: `deepseek/deepseek-chat-v3-0324:free`
- **Cost**: Completely free
- **Quality**: High-quality conversational responses
- **Speed**: Fast response times with 60-second timeout
- **Error Handling**: Clear error messages if API fails

### Alternative Options

1. **Ollama** (Local)

   - Completely free
   - Requires local installation
   - Better privacy (local processing)

2. **Other OpenRouter Models**
   - Many free and paid options available
   - Easy to switch by changing the model name in `.env`

## Troubleshooting

### Common Issues

1. **File Upload Fails**

   - Ensure the file is a valid .docx format
   - Check file size (max 10MB by default)

2. **Chat Not Working**

   - Verify OpenRouter API key is correct
   - Check internet connection
   - The app will fall back to rule-based responses if API fails

3. **Email Not Sending**
   - Verify SMTP credentials
   - Check Gmail app password setup
   - Ensure 2FA is enabled on Gmail

### Logs

Check the console output for detailed error messages and debugging information.

## Development

To run in development mode with auto-restart:

```bash
npm run dev
```

## Security Notes

- This is a demo application
- In production, implement proper session management
- Add authentication and authorization
- Use environment-specific configurations
- Implement rate limiting and input validation

## License

This project is for demonstration purposes. Feel free to modify and use as needed.

# AI-Resume
