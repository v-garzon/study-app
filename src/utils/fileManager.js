export const fileManager = {
  // Get available tests from the public/tests folder
  async getAvailableTests() {
    try {
      // Try to load manifest.json first (faster and more reliable)
      try {
        const response = await fetch('/tests/manifest.json')
        if (response.ok) {
          const manifest = await response.json()
          console.log(`Loaded ${manifest.tests.length} tests from manifest.json`)
          return manifest.tests
        }
      } catch (manifestError) {
        console.log('No manifest.json found, will scan directory')
      }
      
      // Fallback: try to auto-discover tests (requires a known list or server-side support)
      // For now, return empty array if no manifest exists
      console.warn('No manifest.json found. Please create one or run the generate-manifest script.')
      return []
      
    } catch (error) {
      console.error('Error getting available tests:', error)
      return []
    }
  },
  
  // Load test content from file
  async loadTestContent(filename) {
    try {
      const response = await fetch(`/tests/${filename}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const content = await response.text()
      console.log(`Loaded test content for: ${filename}`)
      return content
      
    } catch (error) {
      console.error('Error loading test content:', error)
      throw new Error(`Failed to load test: ${filename}`)
    }
  },
  
  // Refresh available tests (re-reads manifest.json)
  async refreshTests() {
    console.log('Refreshing test list...')
    return await this.getAvailableTests()
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