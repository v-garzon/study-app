export const fileManager = {
  // Get available tests from the tests folder
  async getAvailableTests() {
    try {
      // In a real file system environment, this would read the tests directory
      // For now, we'll simulate with localStorage or provide fallback data
      
      const tests = []
      
      // Try to get from localStorage first (for browser-based file handling)
      const storedTests = localStorage.getItem('availableTests')
      console.log('Retrieving available tests from localStorage')
      console.log('Stored tests data:', storedTests)
      if (storedTests) {
        return JSON.parse(storedTests)
      }
      
    } catch (error) {
      console.error('Error getting available tests:', error)
      return []
    }
  },
  
  // Load test content from file
  async loadTestContent(filename) {
    try {
      // Try localStorage first
      const content = localStorage.getItem(`test_${filename}`)
      if (content) {
        return content
      }
      
      // Try File System Access API (modern browsers)
      if ('showOpenFilePicker' in window) {
        return await this.loadFromFileSystem(filename)
      }
      
      throw new Error('Test file not found: ' + filename)
    } catch (error) {
      console.error('Error loading test content:', error)
      throw error
    }
  },
  
  // Load from File System Access API
  async loadFromFileSystem(filename) {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Questionary files',
            accept: {
              'text/plain': ['.questionary']
            }
          }
        ]
      })
      
      const file = await fileHandle.getFile()
      const content = await file.text()
      
      // Cache in localStorage
      localStorage.setItem(`test_${filename}`, content)
      
      return content
    } catch (error) {
      throw new Error('Error accessing file system: ' + error.message)
    }
  },
  
  // Save completed quiz
  async saveCompletedQuiz(quizData, results) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `${quizData.metadata?.filename || 'quiz'}_${timestamp}`
      
      // Save completed questionary
      const completedQuiz = {
        ...quizData,
        completedAt: results.completedAt,
        results: {
          score: results.score,
          timeElapsed: results.timeElapsed,
          totalQuestions: results.totalQuestions,
          correctAnswers: results.correctAnswers
        }
      }
      
      localStorage.setItem(`completed_${filename}`, JSON.stringify(completedQuiz))
      
      // Save user solutions
      const solutions = {
        quiz: quizData.title,
        completedAt: results.completedAt,
        answers: results.questionResults.map(q => ({
          question: q.questionIndex + 1,
          topic: q.topic,
          userAnswer: q.userAnswer !== undefined ? q.options[q.userAnswer] : 'No contestada',
          correctAnswer: q.options[q.correctAnswer],
          isCorrect: q.isCorrect
        })),
        summary: {
          score: results.score,
          grade: results.grade.level,
          time: this.formatTime(results.timeElapsed),
          correct: results.correctAnswers,
          total: results.totalQuestions
        }
      }
      
      localStorage.setItem(`solutions_${filename}`, JSON.stringify(solutions, null, 2))
      
      // Update completed tests list
      this.updateCompletedTestsList(filename, quizData, results)
      
      return { filename, success: true }
    } catch (error) {
      console.error('Error saving completed quiz:', error)
      throw error
    }
  },
  
  // Update list of completed tests
  updateCompletedTestsList(filename, quizData, results) {
    try {
      const completedTests = this.getCompletedTests()
      
      completedTests.push({
        id: filename,
        title: quizData.title,
        completedAt: results.completedAt,
        score: results.score,
        grade: results.grade.level,
        timeElapsed: results.timeElapsed,
        totalQuestions: results.totalQuestions,
        correctAnswers: results.correctAnswers,
        topics: quizData.metadata?.topics || []
      })
      
      localStorage.setItem('completedTests', JSON.stringify(completedTests))
    } catch (error) {
      console.error('Error updating completed tests list:', error)
    }
  },
  
  // Get completed tests
  getCompletedTests() {
    try {
      const stored = localStorage.getItem('completedTests')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error getting completed tests:', error)
      return []
    }
  },
  
  // Import tests from file input
  async importTests(files) {
    const imported = []
    const errors = []
    
    for (const file of files) {
      try {
        if (!file.name.endsWith('.questionary')) {
          errors.push(`${file.name}: Invalid file extension. Use .questionary`)
          continue
        }
        
        const content = await file.text()
        
        // Validate content
        const { isValid, errors: validationErrors } = await import('./questionaryParser.js')
          .then(module => module.questionaryParser.validate(content))
        
        if (!isValid) {
          errors.push(`${file.name}: ${validationErrors.join(', ')}`)
          continue
        }
        
        // Store in localStorage
        localStorage.setItem(`test_${file.name}`, content)
        
        // Extract metadata for test list
        const lines = content.split('\n')
        const title = lines.find(l => l.startsWith('###'))?.replace('###', '').trim() || file.name
        const subtitle = lines.find(l => l.startsWith('##'))?.replace('##', '').trim() || ''
        const duration = lines.find(l => l.startsWith('@duration'))?.split(':')[1]?.trim() || '15min'
        const difficulty = lines.find(l => l.startsWith('@difficulty'))?.split(':')[1]?.trim() || 'medio'
        const topics = lines.find(l => l.startsWith('@topics'))?.split(':')[1]?.split(',').map(s => s.trim()) || []
        
        imported.push({
          filename: file.name,
          title,
          subtitle,
          duration,
          difficulty,
          topics,
          lastModified: new Date(file.lastModified).toISOString(),
          size: this.formatFileSize(file.size)
        })
        
      } catch (error) {
        errors.push(`${file.name}: ${error.message}`)
      }
    }
    
    // Update available tests list
    if (imported.length > 0) {
      const currentTests = await this.getAvailableTests()
      const allTests = [...currentTests.filter(t => !imported.find(i => i.filename === t.filename)), ...imported]
      localStorage.setItem('availableTests', JSON.stringify(allTests))
    }
    
    return { imported, errors }
  },
  
  // Export test results
  async exportResults(results, format = 'json') {
    try {
      let content, mimeType, extension
      
      switch (format) {
        case 'csv':
          content = this.resultsToCSV(results)
          mimeType = 'text/csv'
          extension = 'csv'
          break
        case 'json':
        default:
          content = JSON.stringify(results, null, 2)
          mimeType = 'application/json'
          extension = 'json'
          break
      }
      
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quiz_results_${Date.now()}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
      console.error('Error exporting results:', error)
      return false
    }
  },
  
  // Convert results to CSV
  resultsToCSV(results) {
    const headers = ['Question', 'Topic', 'User Answer', 'Correct Answer', 'Is Correct']
    const rows = results.questionResults.map(q => [
      q.questionIndex + 1,
      q.topic,
      q.userAnswer !== undefined ? q.options[q.userAnswer] : 'No answer',
      q.options[q.correctAnswer],
      q.isCorrect ? 'Yes' : 'No'
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  },
  
  // Helper functions
  formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  },
  
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  },
  
}