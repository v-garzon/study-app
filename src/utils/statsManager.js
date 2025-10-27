export const statsManager = {
  // Update global statistics with new quiz results
  async updateStats(quizData, results) {
    try {
      const currentStats = this.getGlobalStats()
      
      // Update basic stats
      currentStats.totalTests = (currentStats.totalTests || 0) + 1
      currentStats.totalQuestions = (currentStats.totalQuestions || 0) + results.totalQuestions
      currentStats.totalCorrectAnswers = (currentStats.totalCorrectAnswers || 0) + results.correctAnswers
      currentStats.totalTimeSpent = (currentStats.totalTimeSpent || 0) + results.timeElapsed
      
      // Update completed tests array
      if (!currentStats.completedTests) {
        currentStats.completedTests = []
      }
      
      currentStats.completedTests.push({
        id: `test_${Date.now()}`,
        title: quizData.title,
        completedAt: results.completedAt,
        score: results.score,
        grade: results.grade.level,
        timeElapsed: results.timeElapsed,
        totalQuestions: results.totalQuestions,
        correctAnswers: results.correctAnswers,
        topics: quizData.metadata?.topics || []
      })
      
      // Update topic performance
      if (!currentStats.topicPerformance) {
        currentStats.topicPerformance = {}
      }
      
      results.questionResults.forEach(questionResult => {
        const topic = questionResult.topic
        if (!currentStats.topicPerformance[topic]) {
          currentStats.topicPerformance[topic] = {
            total: 0,
            correct: 0
          }
        }
        
        currentStats.topicPerformance[topic].total += 1
        if (questionResult.isCorrect) {
          currentStats.topicPerformance[topic].correct += 1
        }
      })
      
      // Update difficulty performance
      if (!currentStats.difficultyPerformance) {
        currentStats.difficultyPerformance = {}
      }
      
      const difficulty = quizData.metadata?.difficulty || 'unknown'
      if (!currentStats.difficultyPerformance[difficulty]) {
        currentStats.difficultyPerformance[difficulty] = {
          tests: 0,
          totalScore: 0,
          bestScore: 0,
          averageScore: 0
        }
      }
      
      const diffStats = currentStats.difficultyPerformance[difficulty]
      diffStats.tests += 1
      diffStats.totalScore += results.score
      diffStats.bestScore = Math.max(diffStats.bestScore, results.score)
      diffStats.averageScore = Math.round(diffStats.totalScore / diffStats.tests)
      
      // Update streaks and achievements
      this.updateStreaks(currentStats, results)
      this.updateAchievements(currentStats, results)
      
      // Calculate derived stats
      currentStats.averageScore = currentStats.totalTests > 0 
        ? Math.round(currentStats.completedTests.reduce((sum, test) => sum + test.score, 0) / currentStats.totalTests)
        : 0
      
      currentStats.averageTime = currentStats.totalTests > 0
        ? Math.round(currentStats.totalTimeSpent / currentStats.totalTests)
        : 0
      
      currentStats.overallAccuracy = currentStats.totalQuestions > 0
        ? Math.round((currentStats.totalCorrectAnswers / currentStats.totalQuestions) * 100)
        : 0
      
      // Update last activity
      currentStats.lastActivity = results.completedAt
      currentStats.updatedAt = new Date().toISOString()
      
      // Save to localStorage
      localStorage.setItem('globalStats', JSON.stringify(currentStats))
      
      return currentStats
    } catch (error) {
      console.error('Error updating stats:', error)
      return this.getGlobalStats()
    }
  },
  
  // Get global statistics
  getGlobalStats() {
    try {
      const stored = localStorage.getItem('globalStats')
      if (stored) {
        return JSON.parse(stored)
      }
      
      // Return default stats structure
      return {
        totalTests: 0,
        totalQuestions: 0,
        totalCorrectAnswers: 0,
        totalTimeSpent: 0,
        averageScore: 0,
        averageTime: 0,
        overallAccuracy: 0,
        completedTests: [],
        topicPerformance: {},
        difficultyPerformance: {},
        streaks: {
          current: 0,
          best: 0,
          lastTestPassed: false
        },
        achievements: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActivity: null
      }
    } catch (error) {
      console.error('Error getting global stats:', error)
      return {}
    }
  },
  
  // Update streaks
  updateStreaks(stats, results) {
    if (!stats.streaks) {
      stats.streaks = {
        current: 0,
        best: 0,
        lastTestPassed: false
      }
    }
    
    const passed = results.score >= 70 // Consider 70% as passing
    
    if (passed) {
      if (stats.streaks.lastTestPassed) {
        stats.streaks.current += 1
      } else {
        stats.streaks.current = 1
      }
      stats.streaks.best = Math.max(stats.streaks.best, stats.streaks.current)
    } else {
      stats.streaks.current = 0
    }
    
    stats.streaks.lastTestPassed = passed
  },
  
  // Update achievements
  updateAchievements(stats, results) {
    if (!stats.achievements) {
      stats.achievements = {}
    }
    
    const achievements = stats.achievements
    
    // First test completed
    if (stats.totalTests === 1) {
      achievements.first_test = {
        earned: true,
        earnedAt: results.completedAt,
        title: 'Primer Test',
        description: 'Has completat el teu primer test'
      }
    }
    
    // Perfect score
    if (results.score === 100) {
      achievements.perfect_score = {
        earned: true,
        earnedAt: results.completedAt,
        title: 'Puntuació Perfecta',
        description: 'Has aconseguit un 100% en un test'
      }
    }
    
    // Multiple tests milestones
    const testMilestones = [5, 10, 25, 50, 100]
    testMilestones.forEach(milestone => {
      if (stats.totalTests === milestone) {
        achievements[`tests_${milestone}`] = {
          earned: true,
          earnedAt: results.completedAt,
          title: `${milestone} Tests`,
          description: `Has completat ${milestone} tests`
        }
      }
    })
    
    // High average score
    if (stats.averageScore >= 85 && stats.totalTests >= 5) {
      achievements.high_average = {
        earned: true,
        earnedAt: results.completedAt,
        title: 'Excel·lència Acadèmica',
        description: 'Mitjana de 85% o superior amb almenys 5 tests'
      }
    }
    
    // Speed demon (fast completion)
    const averageTimePerQuestion = results.timeElapsed / results.totalQuestions
    if (averageTimePerQuestion < 30000 && results.score >= 80) { // Less than 30s per question with good score
      achievements.speed_demon = {
        earned: true,
        earnedAt: results.completedAt,
        title: 'Velocitat de la Llum',
        description: 'Test ràpid amb bona puntuació'
      }
    }
    
    // Topic mastery (80%+ in a topic with at least 10 questions)
    Object.entries(stats.topicPerformance).forEach(([topic, performance]) => {
      const accuracy = (performance.correct / performance.total) * 100
      if (accuracy >= 80 && performance.total >= 10) {
        achievements[`master_${topic.replace(/\s+/g, '_').toLowerCase()}`] = {
          earned: true,
          earnedAt: results.completedAt,
          title: `Mestre de ${topic}`,
          description: `80% o superior en ${topic} amb almenys 10 preguntes`
        }
      }
    })
    
    // Consistency (5 tests in a row with 70%+)
    if (stats.streaks.current >= 5) {
      achievements.consistency = {
        earned: true,
        earnedAt: results.completedAt,
        title: 'Consistència',
        description: '5 tests consecutius aprovats'
      }
    }
  },
  
  // Get topic performance summary
  getTopicSummary() {
    const stats = this.getGlobalStats()
    
    if (!stats.topicPerformance) return []
    
    return Object.entries(stats.topicPerformance).map(([topic, data]) => ({
      topic,
      total: data.total,
      correct: data.correct,
      accuracy: Math.round((data.correct / data.total) * 100),
      grade: this.getGradeFromAccuracy((data.correct / data.total) * 100)
    })).sort((a, b) => b.accuracy - a.accuracy)
  },
  
  // Get performance trends
  getPerformanceTrends(limit = 10) {
    const stats = this.getGlobalStats()
    
    if (!stats.completedTests || stats.completedTests.length === 0) {
      return []
    }
    
    return stats.completedTests
      .slice(-limit)
      .map((test, index) => ({
        test: index + 1,
        score: test.score,
        date: new Date(test.completedAt).toLocaleDateString(),
        title: test.title
      }))
  },
  
  // Get recent achievements
  getRecentAchievements(limit = 5) {
    const stats = this.getGlobalStats()
    
    if (!stats.achievements) return []
    
    return Object.values(stats.achievements)
      .filter(achievement => achievement.earned)
      .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
      .slice(0, limit)
  },
  
  // Export statistics
  exportStats() {
    const stats = this.getGlobalStats()
    const exportData = {
      ...stats,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quiz_stats_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
  
  // Import statistics
  async importStats(file) {
    try {
      const content = await file.text()
      const importedStats = JSON.parse(content)
      
      // Validate structure
      if (!importedStats.totalTests && !importedStats.completedTests) {
        throw new Error('Invalid statistics file format')
      }
      
      // Merge with current stats or replace
      const shouldMerge = confirm('¿Quieres fusionar con las estadísticas existentes o reemplazarlas?')
      
      if (shouldMerge) {
        const currentStats = this.getGlobalStats()
        const mergedStats = this.mergeStats(currentStats, importedStats)
        localStorage.setItem('globalStats', JSON.stringify(mergedStats))
      } else {
        localStorage.setItem('globalStats', JSON.stringify(importedStats))
      }
      
      return true
    } catch (error) {
      console.error('Error importing stats:', error)
      throw error
    }
  },
  
  // Merge statistics
  mergeStats(current, imported) {
    // Simple merge strategy - could be more sophisticated
    return {
      ...current,
      ...imported,
      completedTests: [...(current.completedTests || []), ...(imported.completedTests || [])],
      totalTests: (current.totalTests || 0) + (imported.totalTests || 0),
      updatedAt: new Date().toISOString()
    }
  },
  
  // Reset statistics
  resetStats() {
    if (confirm('¿Estás seguro de que quieres borrar todas las estadísticas? Esta acción no se puede deshacer.')) {
      localStorage.removeItem('globalStats')
      localStorage.removeItem('completedTests')
      return true
    }
    return false
  },
  
  // Helper function to get grade from accuracy
  getGradeFromAccuracy(accuracy) {
    if (accuracy >= 90) return 'Excelent'
    if (accuracy >= 80) return 'Notable'
    if (accuracy >= 70) return 'Bé'
    if (accuracy >= 60) return 'Aprovat'
    return 'Suspès'
  }
}
