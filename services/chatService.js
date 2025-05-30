const axios = require("axios");

class ChatService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.model =
      process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat-v3-0324:free";
    this.baseUrl = "https://openrouter.ai/api/v1";
    this.conversationHistory = new Map(); // Store conversation history by session
    this.requestTimeout = parseInt(process.env.AI_REQUEST_TIMEOUT) || 60000; // 60 seconds default
  }

  async generateResponse(message, resumeData, sessionId = "default") {
    // Check if resume data is available
    if (!resumeData) {
      throw new Error(
        "No resume data available. Please upload a resume file first."
      );
    }

    // Get or create conversation history for this session
    if (!this.conversationHistory.has(sessionId)) {
      this.conversationHistory.set(sessionId, []);
    }

    const history = this.conversationHistory.get(sessionId);

    // Create context from resume data
    const resumeContext = this.createResumeContext(resumeData);

    // Create system prompt and user message separately
    const systemPrompt = this.createSystemPrompt(resumeContext);
    const userMessage = message;

    // Call OpenRouter API
    const response = await this.tryOpenRouterAPI(systemPrompt, userMessage);

    // Update conversation history
    history.push({ user: message, bot: response });

    // Keep only last 10 exchanges to manage memory
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }

    return response;
  }

  async tryOpenRouterAPI(systemPrompt, userMessage) {
    // Check if API key is configured
    if (!this.apiKey || this.apiKey === "your_openrouter_api_key_here") {
      throw new Error(
        "OpenRouter API key not configured. Please set OPENROUTER_API_KEY in your .env file."
      );
    }

    console.log(
      "Attempting OpenRouter API call to:",
      `${this.baseUrl}/chat/completions`
    );

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.requestTimeout
      );

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: 300,
          temperature: 0.3,
        }),
        signal: controller.signal,
      });

      // Clear the timeout if request completes successfully
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `OpenRouter API error (HTTP ${response.status}): ${errorText}`
        );
      }

      const data = await response.json();

      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        console.log("OpenRouter API call successful");
        return data.choices[0].message.content.trim();
      }

      throw new Error(
        `OpenRouter API returned unexpected response format: ${JSON.stringify(
          data
        )}`
      );
    } catch (error) {
      // Provide more specific error messages
      if (error.name === "AbortError") {
        throw new Error(
          `Request timeout: AI response took longer than ${
            this.requestTimeout / 1000
          } seconds. Please try again.`
        );
      } else if (
        error.name === "TypeError" &&
        error.message.includes("fetch")
      ) {
        throw new Error(
          "Network error: Unable to connect to OpenRouter API. Check your internet connection."
        );
      } else if (error.message.includes("ENOTFOUND")) {
        throw new Error(
          "DNS error: Cannot resolve openrouter.ai. Check your DNS settings."
        );
      } else if (error.message.includes("ECONNREFUSED")) {
        throw new Error(
          "Connection refused: OpenRouter API might be down. Please try again later."
        );
      } else if (error.message.includes("timeout")) {
        throw new Error(
          "Request timeout: OpenRouter API is responding slowly. Please try again."
        );
      } else {
        // Re-throw the original error if it's already a proper error message
        throw error;
      }
    }
  }

  createResumeContext(resumeData) {
    if (!resumeData) return "";

    const { sections } = resumeData;
    let context = "Resume Information:\n";

    if (sections.contact.name) {
      context += `Name: ${sections.contact.name}\n`;
    }

    if (sections.contact.email) {
      context += `Email: ${sections.contact.email}\n`;
    }

    if (sections.summary) {
      context += `Summary: ${sections.summary}\n`;
    }

    if (sections.experience && sections.experience.length > 0) {
      context += "Experience:\n";
      sections.experience.forEach((exp, index) => {
        context += `${index + 1}. ${exp.title}\n`;
        if (exp.description && exp.description.length > 0) {
          context += `   ${exp.description.join(" ")}\n`;
        }
      });
    }

    if (sections.education && sections.education.length > 0) {
      context += `Education: ${sections.education.join(", ")}\n`;
    }

    if (sections.skills && sections.skills.length > 0) {
      context += `Skills: ${sections.skills.join(", ")}\n`;
    }

    return context;
  }

  createSystemPrompt(resumeContext) {
    let systemPrompt =
      "You are a helpful assistant that answers questions about a resume. ";
    systemPrompt +=
      "Provide concise, direct answers based only on the resume information provided. ";
    systemPrompt += "If information is not in the resume, say so clearly.\n\n";

    // Add the resume context
    if (resumeContext) {
      systemPrompt += `Resume Information:\n${resumeContext}`;
    }

    return systemPrompt;
  }

  clearConversation(sessionId = "default") {
    this.conversationHistory.delete(sessionId);
  }

  getConversationHistory(sessionId = "default") {
    return this.conversationHistory.get(sessionId) || [];
  }

  async testConnection() {
    try {
      console.log("Testing OpenRouter API connectivity...");

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.requestTimeout
      );

      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      });

      // Clear the timeout if request completes successfully
      clearTimeout(timeoutId);

      if (response.ok) {
        console.log("OpenRouter API is reachable");
        return true;
      } else {
        console.log(`OpenRouter API returned status: ${response.status}`);
        return false;
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.error(
          `OpenRouter API connectivity test timed out after ${
            this.requestTimeout / 1000
          } seconds`
        );
      } else {
        console.error(
          "OpenRouter API connectivity test failed:",
          error.message
        );
      }
      return false;
    }
  }
}

module.exports = ChatService;
