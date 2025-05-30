const axios = require("axios");

class ChatService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.model =
      process.env.OPENROUTER_MODEL || "tngtech/deepseek-r1t-chimera:free";
    this.baseUrl = "https://openrouter.ai/api/v1";
    this.conversationHistory = new Map(); // Store conversation history by session
  }

  async generateResponse(message, resumeData, sessionId = "default") {
    try {
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

      // Try OpenRouter API first
      let response = await this.tryOpenRouterAPI(systemPrompt, userMessage);

      // If OpenRouter fails, use fallback response
      if (!response) {
        response = this.generateFallbackResponse(message, resumeData);
      }

      // Update conversation history
      history.push({ user: message, bot: response });

      // Keep only last 10 exchanges to manage memory
      if (history.length > 10) {
        history.splice(0, history.length - 10);
      }

      return response;
    } catch (error) {
      console.error("Chat service error:", error);
      return this.generateFallbackResponse(message, resumeData);
    }
  }

  async tryOpenRouterAPI(systemPrompt, userMessage) {
    try {
      if (!this.apiKey || this.apiKey === "your_openrouter_api_key_here") {
        console.log(
          "OpenRouter API key not configured, using fallback responses"
        );
        return null; // Skip API call if no valid key
      }

      console.log(
        "Attempting OpenRouter API call to:",
        `${this.baseUrl}/chat/completions`
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
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        console.log("OpenRouter API call successful");
        return data.choices[0].message.content.trim();
      }

      console.log("OpenRouter API returned unexpected response format:", data);
      return null;
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        console.error(
          "OpenRouter API error: Network error - Check your internet connection"
        );
      } else if (error.message.includes("ENOTFOUND")) {
        console.error(
          "OpenRouter API error: Cannot resolve openrouter.ai - Check your DNS settings"
        );
      } else if (error.message.includes("ECONNREFUSED")) {
        console.error(
          "OpenRouter API error: Connection refused - API might be down"
        );
      } else if (error.message.includes("timeout")) {
        console.error(
          "OpenRouter API error: Request timeout - Network or API is slow"
        );
      } else {
        console.error("OpenRouter API error:", error.message);
      }

      console.log("Falling back to rule-based responses");
      return null;
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

  generateFallbackResponse(message, resumeData) {
    const lowerMessage = message.toLowerCase();

    if (!resumeData) {
      return "I'd be happy to help you with questions about the resume, but I don't see any resume data loaded yet. Please upload a resume file first.";
    }

    const { sections } = resumeData;

    // Handle common question patterns
    if (lowerMessage.includes("name") || lowerMessage.includes("who")) {
      return sections.contact.name
        ? `The candidate's name is ${sections.contact.name}.`
        : "I don't see a name specified in the resume.";
    }

    if (lowerMessage.includes("email") || lowerMessage.includes("contact")) {
      const contact = [];
      if (sections.contact.email)
        contact.push(`Email: ${sections.contact.email}`);
      if (sections.contact.phone)
        contact.push(`Phone: ${sections.contact.phone}`);

      return contact.length > 0
        ? `Contact information: ${contact.join(", ")}`
        : "I don't see contact information in the resume.";
    }

    if (
      lowerMessage.includes("experience") ||
      lowerMessage.includes("work") ||
      lowerMessage.includes("job")
    ) {
      if (sections.experience && sections.experience.length > 0) {
        const expList = sections.experience
          .map((exp, index) => `${index + 1}. ${exp.title}`)
          .join("\n");
        return `Work experience includes:\n${expList}`;
      }
      return "I don't see work experience listed in the resume.";
    }

    if (
      lowerMessage.includes("education") ||
      lowerMessage.includes("degree") ||
      lowerMessage.includes("school")
    ) {
      if (sections.education && sections.education.length > 0) {
        return `Education: ${sections.education.join(", ")}`;
      }
      return "I don't see education information in the resume.";
    }

    if (
      lowerMessage.includes("skill") ||
      lowerMessage.includes("technology") ||
      lowerMessage.includes("tool")
    ) {
      if (sections.skills && sections.skills.length > 0) {
        return `Skills include: ${sections.skills.join(", ")}`;
      }
      return "I don't see skills listed in the resume.";
    }

    if (lowerMessage.includes("summary") || lowerMessage.includes("about")) {
      return sections.summary
        ? `Summary: ${sections.summary}`
        : "I don't see a summary section in the resume.";
    }

    // Generic response
    return "I'm here to help you analyze this resume. You can ask me about:\n• The candidate's work experience and job history\n• Educational background and qualifications\n• Technical and professional skills\n• Contact information\n• Career summary or objectives\n• Any other details mentioned in the resume document\n\nWhat specific information would you like to know?";
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
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (response.ok) {
        console.log("OpenRouter API is reachable");
        return true;
      } else {
        console.log(`OpenRouter API returned status: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error("OpenRouter API connectivity test failed:", error.message);
      return false;
    }
  }
}

module.exports = ChatService;
