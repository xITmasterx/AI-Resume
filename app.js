require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

// Import services
const ResumeParser = require("./services/resumeParser");
const ChatService = require("./services/chatService");
const EmailService = require("./services/emailService");

const app = express();

// Initialize services
const resumeParser = new ResumeParser();
const chatService = new ChatService();
const emailService = new EmailService();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .docx files are allowed!"), false);
    }
  },
});

// Store current session data (in production, use a proper session store)
let currentSession = {
  resumeData: null,
  sessionId: null,
};

// Routes
app.get("/", (request, response) => {
  response.sendFile(path.join(__dirname, "public", "index.html"));
});

// Upload and parse resume
app.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("Processing uploaded file:", req.file.filename);

    // Parse the resume
    const resumeData = await resumeParser.parseDocx(
      req.file.path,
      req.file.filename
    );

    // Store in current session
    currentSession.resumeData = resumeData;
    currentSession.sessionId = Date.now().toString();

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.json({
      success: true,
      message: "Resume uploaded and parsed successfully",
      candidateName: resumeData.sections.contact.name || "Unknown",
      sessionId: currentSession.sessionId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Use current session data
    const response = await chatService.generateResponse(
      message,
      currentSession.resumeData,
      sessionId || currentSession.sessionId
    );

    res.json({
      success: true,
      response: response,
      sessionId: sessionId || currentSession.sessionId,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Send email summary
app.post("/send-summary", async (req, res) => {
  try {
    const { email, sessionId } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!currentSession.resumeData) {
      return res.status(400).json({ error: "No resume data available" });
    }

    // Get conversation history
    const conversationHistory = chatService.getConversationHistory(
      sessionId || currentSession.sessionId
    );

    // Send email
    const result = await emailService.sendChatSummary(
      email,
      currentSession.resumeData,
      conversationHistory
    );

    if (result.success) {
      res.json({
        success: true,
        message: "Email sent successfully",
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get current session info
app.get("/session", (req, res) => {
  res.json({
    hasResume: !!currentSession.resumeData,
    candidateName: currentSession.resumeData?.sections?.contact?.name || null,
    sessionId: currentSession.sessionId,
  });
});

// Clear session
app.post("/clear-session", (req, res) => {
  const { sessionId } = req.body;
  chatService.clearConversation(sessionId || currentSession.sessionId);
  currentSession = { resumeData: null, sessionId: null };
  res.json({ success: true, message: "Session cleared" });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Test API connectivity
app.get("/test-api", async (req, res) => {
  try {
    const isConnected = await chatService.testConnection();
    res.json({
      success: true,
      connected: isConnected,
      message: isConnected ? "API is reachable" : "API is not reachable",
    });
  } catch (error) {
    res.json({
      success: false,
      connected: false,
      error: error.message,
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large" });
    }
  }
  res.status(500).json({ error: error.message });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

app.listen(PORT, HOST, () => {
  console.log(`Server is running on ${HOST}:${PORT}`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`http://localhost:${PORT}`);
    console.log("\nTo get started:");
    console.log("1. Update the .env file with your API keys");
    console.log("2. Upload a .docx resume file");
    console.log("3. Start chatting about the resume!");
  } else {
    console.log("Production server started successfully");
  }
});
