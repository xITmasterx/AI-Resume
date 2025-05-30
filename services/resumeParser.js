const mammoth = require('mammoth');
const fs = require('fs').promises;
const path = require('path');

class ResumeParser {
  constructor() {
    this.parsedDir = path.join(__dirname, '..', 'parsed');
  }

  async parseDocx(filePath, fileName) {
    try {
      // Extract text from DOCX file
      const result = await mammoth.extractRawText({ path: filePath });
      const rawText = result.value;

      // Parse the text into structured data
      const parsedResume = this.structureResumeData(rawText, fileName);

      // Save parsed data
      const jsonFileName = fileName.replace('.docx', '.json');
      const jsonPath = path.join(this.parsedDir, jsonFileName);
      await fs.writeFile(jsonPath, JSON.stringify(parsedResume, null, 2));

      return parsedResume;
    } catch (error) {
      throw new Error(`Failed to parse resume: ${error.message}`);
    }
  }

  structureResumeData(text, fileName) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    const resume = {
      fileName: fileName,
      parsedAt: new Date().toISOString(),
      rawText: text,
      sections: {
        contact: this.extractContact(lines),
        summary: this.extractSummary(lines),
        experience: this.extractExperience(lines),
        education: this.extractEducation(lines),
        skills: this.extractSkills(lines)
      }
    };

    return resume;
  }

  extractContact(lines) {
    const contact = {
      name: '',
      email: '',
      phone: '',
      location: ''
    };

    // Look for email pattern
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    // Look for phone pattern
    const phoneRegex = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;

    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i];
      
      // First non-empty line is likely the name
      if (!contact.name && line.length > 2 && !emailRegex.test(line) && !phoneRegex.test(line)) {
        contact.name = line;
      }
      
      // Extract email
      const emailMatch = line.match(emailRegex);
      if (emailMatch) {
        contact.email = emailMatch[0];
      }
      
      // Extract phone
      const phoneMatch = line.match(phoneRegex);
      if (phoneMatch) {
        contact.phone = phoneMatch[0];
      }
    }

    return contact;
  }

  extractSummary(lines) {
    const summaryKeywords = ['summary', 'objective', 'profile', 'about'];
    let summaryStart = -1;
    let summaryEnd = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (summaryKeywords.some(keyword => line.includes(keyword))) {
        summaryStart = i + 1;
        break;
      }
    }

    if (summaryStart > -1) {
      // Find the end of summary (next section or empty line)
      for (let i = summaryStart; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.includes('experience') || line.includes('education') || 
            line.includes('skills') || line.includes('work') || lines[i] === '') {
          summaryEnd = i;
          break;
        }
      }
      
      if (summaryEnd === -1) summaryEnd = Math.min(summaryStart + 5, lines.length);
      
      return lines.slice(summaryStart, summaryEnd).join(' ');
    }

    return '';
  }

  extractExperience(lines) {
    const experienceKeywords = ['experience', 'work', 'employment', 'career'];
    const experiences = [];
    let experienceStart = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (experienceKeywords.some(keyword => line.includes(keyword))) {
        experienceStart = i + 1;
        break;
      }
    }

    if (experienceStart > -1) {
      let currentExperience = null;
      
      for (let i = experienceStart; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();
        
        // Stop if we hit another major section
        if (lowerLine.includes('education') || lowerLine.includes('skills')) {
          break;
        }
        
        // Look for job titles/companies (lines that might be headers)
        if (line.length > 0 && !line.startsWith('-') && !line.startsWith('•')) {
          if (currentExperience) {
            experiences.push(currentExperience);
          }
          currentExperience = {
            title: line,
            description: []
          };
        } else if (currentExperience && line.length > 0) {
          currentExperience.description.push(line);
        }
      }
      
      if (currentExperience) {
        experiences.push(currentExperience);
      }
    }

    return experiences;
  }

  extractEducation(lines) {
    const educationKeywords = ['education', 'academic', 'degree', 'university', 'college'];
    const education = [];
    let educationStart = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (educationKeywords.some(keyword => line.includes(keyword))) {
        educationStart = i + 1;
        break;
      }
    }

    if (educationStart > -1) {
      for (let i = educationStart; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();
        
        // Stop if we hit another major section
        if (lowerLine.includes('skills') || lowerLine.includes('experience')) {
          break;
        }
        
        if (line.length > 0) {
          education.push(line);
        }
      }
    }

    return education;
  }

  extractSkills(lines) {
    const skillsKeywords = ['skills', 'competencies', 'technologies', 'tools'];
    const skills = [];
    let skillsStart = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (skillsKeywords.some(keyword => line.includes(keyword))) {
        skillsStart = i + 1;
        break;
      }
    }

    if (skillsStart > -1) {
      for (let i = skillsStart; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.length > 0) {
          // Split by common delimiters
          const lineSkills = line.split(/[,;|•-]/).map(skill => skill.trim()).filter(skill => skill);
          skills.push(...lineSkills);
        }
      }
    }

    return skills;
  }

  async getResumeData(fileName) {
    try {
      const jsonFileName = fileName.replace('.docx', '.json');
      const jsonPath = path.join(this.parsedDir, jsonFileName);
      const data = await fs.readFile(jsonPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to retrieve resume data: ${error.message}`);
    }
  }
}

module.exports = ResumeParser;
