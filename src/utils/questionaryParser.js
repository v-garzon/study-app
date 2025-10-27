export const questionaryParser = {
  parse(content) {
    try {
      const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0)
      
      const result = {
        title: '',
        subtitle: '',
        instructions: '',
        metadata: {},
        questions: []
      }
      
      let currentSection = 'header'
      let currentQuestion = null
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // Skip separator lines
        if (line === '---') continue
        
        // Parse header information
        if (line.startsWith('###')) {
          result.title = line.replace('###', '').trim()
        } else if (line.startsWith('##')) {
          result.subtitle = line.replace('##', '').trim()
        } else if (line.startsWith('#')) {
          result.instructions = line.replace('#', '').trim()
        }
        // Parse metadata
        else if (line.startsWith('@')) {
          const [key, value] = line.substring(1).split(':').map(s => s.trim())
          if (key === 'topics') {
            result.metadata[key] = value.split(',').map(s => s.trim())
          } else {
            result.metadata[key] = value
          }
        }
        // Parse questions
        else if (line.match(/^\d+\)/)) {
          // Save previous question before starting new one
          if (currentQuestion && currentQuestion.options.length > 0) {
            result.questions.push(currentQuestion)
          }
          
          const questionMatch = line.match(/^(\d+)\)\s*\[([^\]]+)\]\/\/\[([^\]]+)\]/)
          if (questionMatch) {
            currentQuestion = {
              id: parseInt(questionMatch[1]),
              topic: questionMatch[2],
              question: questionMatch[3],
              options: [],
              correct: null,
              explanation: ''
            }
          }
        }
        // Parse options
        else if (line.match(/^\d+\.\d+\)/)) {
          if (currentQuestion) {
            const optionMatch = line.match(/^\d+\.\d+\)\s*\[([^\]]+)\]/)
            if (optionMatch) {
              currentQuestion.options.push(optionMatch[1])
            }
          }
        }
        // Parse correct answer and explanation
        else if (line.match(/^\d+\.o\)/)) {
          if (currentQuestion) {
            const correctMatch = line.match(/^\d+\.o\)\s*\[(\d+)\](?:\/\/\[([^\]]+)\])?/)
            if (correctMatch) {
              currentQuestion.correct = parseInt(correctMatch[1]) - 1 // Convert to 0-based index
              currentQuestion.explanation = correctMatch[2] || ''
            }
          }
        }
      }
      
      // CRITICAL FIX: Add the last question if it exists and has content
      if (currentQuestion && currentQuestion.options.length > 0) {
        result.questions.push(currentQuestion)
      }
      
      return result
    } catch (error) {
      console.error('Error parsing questionary:', error)
      throw new Error('Error parsing questionary file: ' + error.message)
    }
  },
  
  // Helper to validate questionary format
  validate(content) {
    try {
      const parsed = this.parse(content)
      
      const errors = []
      
      if (!parsed.title) errors.push('Missing title (###)')
      if (!parsed.subtitle) errors.push('Missing subtitle (##)')
      if (!parsed.instructions) errors.push('Missing instructions (#)')
      if (parsed.questions.length === 0) errors.push('No questions found')
      
      parsed.questions.forEach((q, index) => {
        if (!q.topic) errors.push(`Question ${index + 1}: Missing topic`)
        if (!q.question) errors.push(`Question ${index + 1}: Missing question text`)
        if (q.options.length === 0) errors.push(`Question ${index + 1}: No options provided`)
        if (q.correct === null) errors.push(`Question ${index + 1}: No correct answer specified`)
        if (q.correct >= q.options.length) errors.push(`Question ${index + 1}: Correct answer index out of range`)
      })
      
      return {
        isValid: errors.length === 0,
        errors,
        parsed: errors.length === 0 ? parsed : null
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message],
        parsed: null
      }
    }
  },
  
  // Helper to generate sample questionary
  generateSample() {
    return `---
### Sample Quiz Title
## Sample Subtitle
# Mark only one answer per question
@duration: 15min
@difficulty: medio
@topics: Topic1,Topic2
1) [Topic 1 - Sample Topic]//[What is the sample question?]
1.1) [First option]
1.2) [Second option]
1.3) [Third option]
1.4) [Fourth option]
1.o) [2]//[This is the explanation for the correct answer]
---`
  },
  
  // Test function to verify the fix
  testWithYourFile() {
    // You can use this to test the parser with your questionary file
    console.log('Testing parser...')
    return this
  }
}

// Additional debugging function
export function debugParser(content) {
  console.log('=== PARSER DEBUG ===')
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  console.log(`Total lines: ${lines.length}`)
  
  const questionLines = lines.filter(line => line.match(/^\d+\)/))
  console.log(`Question lines found: ${questionLines.length}`)
  questionLines.forEach((line, index) => {
    console.log(`${index + 1}: ${line.substring(0, 80)}...`)
  })
  
  const parsed = questionaryParser.parse(content)
  console.log(`Questions parsed: ${parsed.questions.length}`)
  console.log('===================')
  
  return parsed
}