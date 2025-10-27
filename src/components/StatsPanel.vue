<template>
  <!-- Modal Overlay -->
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" @click="$emit('close')">
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden" @click.stop>
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 class="text-2xl font-heading font-bold text-gray-900">
          📊 Estadístiques Generals
        </h2>
        <button 
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
        <div v-if="!hasStats" class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-500 mb-2">
            Encara no tens estadístiques
          </h3>
          <p class="text-gray-400">
            Completa alguns tests per veure les teves estadístiques aquí.
          </p>
        </div>
        
        <div v-else class="space-y-6">
          <!-- Overall Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 text-center">
              <div class="text-2xl font-bold">{{ stats.totalTests || 0 }}</div>
              <div class="text-sm opacity-90">Tests Completats</div>
            </div>
            
            <div class="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 text-center">
              <div class="text-2xl font-bold">{{ averageScore }}%</div>
              <div class="text-sm opacity-90">Puntuació Mitjana</div>
            </div>
            
            <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4 text-center">
              <div class="text-2xl font-bold">{{ totalQuestions }}</div>
              <div class="text-sm opacity-90">Preguntes Contestades</div>
            </div>
            
            <div class="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-4 text-center">
              <div class="text-2xl font-bold">{{ totalTimeSpent }}</div>
              <div class="text-sm opacity-90">Temps Total</div>
            </div>
          </div>

          <!-- Performance by Topic -->
          <div v-if="topicStats.length > 0" class="card">
            <div class="card-header">
              <h3 class="text-lg font-semibold text-gray-900">Rendiment per Tema</h3>
            </div>
            <div class="card-body">
              <div class="space-y-4">
                <div 
                  v-for="topic in topicStats" 
                  :key="topic.name"
                  class="flex items-center justify-between"
                >
                  <div class="flex-1">
                    <div class="flex justify-between items-center mb-2">
                      <span class="font-medium text-gray-900">{{ topic.name }}</span>
                      <span class="text-sm text-gray-600">
                        {{ topic.correct }}/{{ topic.total }} ({{ topic.percentage }}%)
                      </span>
                    </div>
                    <div class="progress-bar">
                      <div 
                        class="h-2 rounded-full transition-all duration-300"
                        :class="getPerformanceColor(topic.percentage)"
                        :style="{ width: topic.percentage + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div v-if="recentTests.length > 0" class="card">
            <div class="card-header">
              <h3 class="text-lg font-semibold text-gray-900">Activitat Recent</h3>
            </div>
            <div class="card-body">
              <div class="space-y-3">
                <div 
                  v-for="test in recentTests" 
                  :key="test.id"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div class="font-medium text-gray-900">{{ test.title }}</div>
                    <div class="text-sm text-gray-600">{{ formatDate(test.completedAt) }}</div>
                  </div>
                  <div class="text-right">
                    <div 
                      class="text-lg font-bold"
                      :class="getScoreColor(test.score)"
                    >
                      {{ test.score }}%
                    </div>
                    <div class="text-xs text-gray-500">{{ test.time }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Performance Trends -->
          <div v-if="performanceTrend.length > 0" class="card">
            <div class="card-header">
              <h3 class="text-lg font-semibold text-gray-900">Evolució del Rendiment</h3>
            </div>
            <div class="card-body">
              <div class="text-center text-gray-600 mb-4">
                <p class="text-sm">Últims {{ performanceTrend.length }} tests completats</p>
              </div>
              
              <!-- Simple trend visualization -->
              <div class="flex items-end justify-between h-32 border-b border-gray-200">
                <div 
                  v-for="(point, index) in performanceTrend" 
                  :key="index"
                  class="flex flex-col items-center flex-1"
                >
                  <div 
                    class="bg-university-primary rounded-t mb-2 w-8 transition-all duration-300"
                    :style="{ height: (point.score / 100 * 100) + 'px' }"
                    :title="`Test ${index + 1}: ${point.score}%`"
                  ></div>
                  <div class="text-xs text-gray-500">{{ index + 1 }}</div>
                </div>
              </div>
              
              <div class="flex justify-between text-xs text-gray-500 mt-2">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <!-- Achievement Badges -->
          <div class="card">
            <div class="card-header">
              <h3 class="text-lg font-semibold text-gray-900">Fites Assolides</h3>
            </div>
            <div class="card-body">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div 
                  v-for="achievement in achievements" 
                  :key="achievement.id"
                  class="text-center p-4 rounded-lg"
                  :class="achievement.earned ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'"
                >
                  <div class="text-2xl mb-2">{{ achievement.icon }}</div>
                  <div 
                    class="font-medium text-sm"
                    :class="achievement.earned ? 'text-yellow-800' : 'text-gray-500'"
                  >
                    {{ achievement.title }}
                  </div>
                  <div 
                    class="text-xs mt-1"
                    :class="achievement.earned ? 'text-yellow-600' : 'text-gray-400'"
                  >
                    {{ achievement.description }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatsPanel',
  props: {
    stats: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close'],
  computed: {
    hasStats() {
      return this.stats && (this.stats.totalTests > 0 || this.stats.completedTests?.length > 0)
    },
    
    averageScore() {
      if (!this.stats.completedTests?.length) return 0
      const total = this.stats.completedTests.reduce((sum, test) => sum + test.score, 0)
      return Math.round(total / this.stats.completedTests.length)
    },
    
    totalQuestions() {
      if (!this.stats.completedTests?.length) return 0
      return this.stats.completedTests.reduce((sum, test) => sum + test.totalQuestions, 0)
    },
    
    totalTimeSpent() {
      if (!this.stats.completedTests?.length) return '0min'
      const totalMs = this.stats.completedTests.reduce((sum, test) => sum + test.timeElapsed, 0)
      const totalMinutes = Math.round(totalMs / (1000 * 60))
      return `${totalMinutes}min`
    },
    
    topicStats() {
      if (!this.stats.topicPerformance) return []
      
      return Object.entries(this.stats.topicPerformance).map(([topic, data]) => ({
        name: topic,
        correct: data.correct,
        total: data.total,
        percentage: Math.round((data.correct / data.total) * 100)
      })).sort((a, b) => b.percentage - a.percentage)
    },
    
    recentTests() {
      if (!this.stats.completedTests?.length) return []
      
      return this.stats.completedTests
        .slice(-5)
        .reverse()
        .map(test => ({
          ...test,
          time: this.formatTime(test.timeElapsed)
        }))
    },
    
    performanceTrend() {
      if (!this.stats.completedTests?.length) return []
      
      return this.stats.completedTests
        .slice(-10)
        .map(test => ({ score: test.score }))
    },
    
    achievements() {
      const completedTests = this.stats.completedTests?.length || 0
      const avgScore = this.averageScore
      const perfectScores = this.stats.completedTests?.filter(t => t.score === 100).length || 0
      
      return [
        {
          id: 'first_test',
          icon: '🎯',
          title: 'Primer Test',
          description: 'Completa el teu primer test',
          earned: completedTests >= 1
        },
        {
          id: 'five_tests',
          icon: '🔥',
          title: 'En Forma',
          description: 'Completa 5 tests',
          earned: completedTests >= 5
        },
        {
          id: 'perfect_score',
          icon: '⭐',
          title: 'Perfecte',
          description: 'Aconsegueix un 100%',
          earned: perfectScores >= 1
        },
        {
          id: 'high_average',
          icon: '🏆',
          title: 'Excel·lent',
          description: 'Mitjana >85%',
          earned: avgScore >= 85
        }
      ]
    }
  },
  methods: {
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('ca-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    formatTime(milliseconds) {
      const totalSeconds = Math.floor(milliseconds / 1000)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    },
    
    getPerformanceColor(percentage) {
      if (percentage >= 85) return 'bg-green-500'
      if (percentage >= 70) return 'bg-yellow-500'
      return 'bg-red-500'
    },
    
    getScoreColor(score) {
      if (score >= 85) return 'text-green-600'
      if (score >= 70) return 'text-yellow-600'
      return 'text-red-600'
    }
  }
}
</script>
