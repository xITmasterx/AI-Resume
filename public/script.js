class ResumeChat {
  constructor() {
    this.sessionId = null;
    this.hasResume = false;
    this.initializeEventListeners();
    this.checkSession();
  }

  initializeEventListeners() {
    // Upload form
    document.getElementById("uploadForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleFileUpload();
    });

    // Chat form
    const chatForm = document.getElementById("chatForm");
    if (chatForm) {
      chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        console.log("Chat form submitted");
        this.handleChatMessage();
      });
    }

    // Email form
    document.getElementById("emailForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleEmailSend();
    });

    // Clear session button
    document.getElementById("clearSessionBtn").addEventListener("click", () => {
      this.clearSession();
    });

    // Scroll to bottom button
    const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
    if (scrollToBottomBtn) {
      scrollToBottomBtn.addEventListener("click", () => {
        this.scrollToBottomManual();
      });
    }

    // File input change
    document.getElementById("resumeFile").addEventListener("change", (e) => {
      const fileName = e.target.files[0]?.name || "Choose .docx file";
      document.querySelector(".file-text").textContent = fileName;
    });
  }

  async checkSession() {
    try {
      const response = await fetch("/session");
      const data = await response.json();

      if (data.hasResume) {
        this.hasResume = true;
        this.sessionId = data.sessionId;
        this.showChatInterface(data.candidateName);
      }
    } catch (error) {
      console.error("Error checking session:", error);
    }
  }

  async handleFileUpload() {
    const fileInput = document.getElementById("resumeFile");
    const file = fileInput.files[0];

    if (!file) {
      this.showStatus("uploadStatus", "Please select a file", "error");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".docx")) {
      this.showStatus("uploadStatus", "Please select a .docx file", "error");
      return;
    }

    this.showLoading(true);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        this.hasResume = true;
        this.sessionId = data.sessionId;
        this.showStatus("uploadStatus", data.message, "success");
        this.showChatInterface(data.candidateName);
      } else {
        this.showStatus("uploadStatus", data.error || "Upload failed", "error");
      }
    } catch (error) {
      console.error("Upload error:", error);
      this.showStatus(
        "uploadStatus",
        "Upload failed. Please try again.",
        "error"
      );
    } finally {
      this.showLoading(false);
    }
  }

  async handleChatMessage() {
    console.log("handleChatMessage called");
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();

    console.log("Message:", message);
    console.log("Has resume:", this.hasResume);

    if (!message) return;

    if (!this.hasResume) {
      this.addMessage("Please upload a resume first.", "bot");
      return;
    }

    // Disable input temporarily to prevent double submission
    messageInput.disabled = true;

    // Add user message to chat
    this.addMessage(message, "user");
    messageInput.value = "";

    // Show typing indicator
    const typingId = this.addMessage("Thinking...", "bot");

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          sessionId: this.sessionId,
        }),
      });

      const data = await response.json();

      // Remove typing indicator
      this.removeMessage(typingId);

      if (data.success) {
        this.addMessage(data.response, "bot");
      } else {
        this.addMessage(
          "Sorry, I encountered an error. Please try again.",
          "bot"
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      this.removeMessage(typingId);
      this.addMessage(
        "Sorry, I encountered an error. Please try again.",
        "bot"
      );
    } finally {
      // Re-enable input and focus it
      messageInput.disabled = false;
      messageInput.focus();
      console.log("Chat message handling completed, input re-enabled");
    }
  }

  async handleEmailSend() {
    const emailInput = document.getElementById("emailInput");
    const email = emailInput.value.trim();

    if (!email) return;

    if (!this.hasResume) {
      this.showStatus("emailStatus", "Please upload a resume first.", "error");
      return;
    }

    this.showLoading(true);

    try {
      const response = await fetch("/send-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          sessionId: this.sessionId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        this.showStatus("emailStatus", "Email sent successfully!", "success");
        emailInput.value = "";
      } else {
        this.showStatus(
          "emailStatus",
          data.error || "Failed to send email",
          "error"
        );
      }
    } catch (error) {
      console.error("Email error:", error);
      this.showStatus(
        "emailStatus",
        "Failed to send email. Please try again.",
        "error"
      );
    } finally {
      this.showLoading(false);
    }
  }

  async clearSession() {
    try {
      await fetch("/clear-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
        }),
      });

      this.hasResume = false;
      this.sessionId = null;
      this.hideChatInterface();
      this.clearMessages();
      this.showStatus(
        "uploadStatus",
        "Session cleared. Upload a new resume to start.",
        "info"
      );

      // Reset file input
      document.getElementById("resumeFile").value = "";
      document.querySelector(".file-text").textContent = "Choose .docx file";
    } catch (error) {
      console.error("Clear session error:", error);
    }
  }

  showChatInterface(candidateName) {
    console.log("Showing chat interface for:", candidateName);

    document.getElementById("uploadSection").style.display = "none";
    document.getElementById("chatSection").style.display = "block";
    document.getElementById("emailSection").style.display = "block";

    if (candidateName && candidateName !== "Unknown") {
      document.getElementById(
        "candidateName"
      ).textContent = `Chat about ${candidateName}'s Resume`;
    }

    // Add welcome message if no messages exist
    const chatMessages = document.getElementById("chatMessages");
    if (chatMessages.children.length === 0) {
      this.addMessage(
        "Hi! I can answer questions about this resume. What would you like to know?",
        "bot"
      );
    }

    // Setup scroll detection for the chat messages
    this.setupScrollDetection();

    // Ensure the message input is enabled and focused
    const messageInput = document.getElementById("messageInput");
    if (messageInput) {
      messageInput.disabled = false;
      setTimeout(() => messageInput.focus(), 100);
    }

    // Debug the interface state
    setTimeout(() => this.debugChatInterface(), 200);
  }

  hideChatInterface() {
    document.getElementById("uploadSection").style.display = "block";
    document.getElementById("chatSection").style.display = "none";
    document.getElementById("emailSection").style.display = "none";
  }

  addMessage(text, sender) {
    const chatMessages = document.getElementById("chatMessages");
    const messageDiv = document.createElement("div");
    const messageId = Date.now() + Math.random();

    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = text;
    messageDiv.dataset.messageId = messageId;

    // Check if user is near bottom before adding message
    const { scrollTop, scrollHeight, clientHeight } = chatMessages;
    const wasNearBottom = scrollHeight - scrollTop - clientHeight < 50;

    chatMessages.appendChild(messageDiv);

    // Only auto-scroll if user was near bottom, otherwise show scroll button
    if (wasNearBottom) {
      this.scrollToBottom(chatMessages);
    } else if (sender === "bot") {
      // Show scroll button with notification for new bot messages
      this.showScrollToBottomButton();
    }

    return messageId;
  }

  scrollToBottom(chatContainer) {
    // Use requestAnimationFrame for smooth scrolling
    requestAnimationFrame(() => {
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: "smooth",
      });
    });
  }

  scrollToBottomManual() {
    const chatMessages = document.getElementById("chatMessages");
    if (chatMessages) {
      this.scrollToBottom(chatMessages);
      // Hide the scroll button after manual scroll
      this.hideScrollToBottomButton();
    }
  }

  setupScrollDetection() {
    const chatMessages = document.getElementById("chatMessages");
    const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");

    if (!chatMessages || !scrollToBottomBtn) return;

    // Remove existing listener if any
    chatMessages.removeEventListener("scroll", this.handleScroll);

    // Add scroll event listener
    this.handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatMessages;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;

      if (isNearBottom) {
        this.hideScrollToBottomButton();
      } else {
        this.showScrollToBottomButton();
      }
    };

    chatMessages.addEventListener("scroll", this.handleScroll);
  }

  showScrollToBottomButton() {
    const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
    if (scrollToBottomBtn) {
      scrollToBottomBtn.classList.add("show");
    }
  }

  hideScrollToBottomButton() {
    const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
    if (scrollToBottomBtn) {
      scrollToBottomBtn.classList.remove("show");
    }
  }

  removeMessage(messageId) {
    const message = document.querySelector(`[data-message-id="${messageId}"]`);
    if (message) {
      message.remove();
    }
  }

  clearMessages() {
    document.getElementById("chatMessages").innerHTML = "";
  }

  showStatus(elementId, message, type) {
    const statusElement = document.getElementById(elementId);
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    statusElement.style.display = "block";

    // Auto-hide success messages after 5 seconds
    if (type === "success") {
      setTimeout(() => {
        statusElement.style.display = "none";
      }, 5000);
    }
  }

  showLoading(show) {
    const overlay = document.getElementById("loadingOverlay");
    overlay.style.display = show ? "flex" : "none";
  }

  // Debug function to check chat interface state
  debugChatInterface() {
    const chatSection = document.getElementById("chatSection");
    const messageInput = document.getElementById("messageInput");
    const chatForm = document.getElementById("chatForm");

    console.log("=== Chat Interface Debug ===");
    console.log("Chat section display:", chatSection?.style.display);
    console.log("Message input exists:", !!messageInput);
    console.log("Message input disabled:", messageInput?.disabled);
    console.log("Chat form exists:", !!chatForm);
    console.log("Has resume:", this.hasResume);
    console.log("Session ID:", this.sessionId);
    console.log("============================");
  }
}

// Initialize the application when the page loads
document.addEventListener("DOMContentLoaded", () => {
  window.resumeChat = new ResumeChat();
});

// Global debug function for browser console
window.debugChat = () => {
  if (window.resumeChat) {
    window.resumeChat.debugChatInterface();
  } else {
    console.log("Resume chat not initialized yet");
  }
};
