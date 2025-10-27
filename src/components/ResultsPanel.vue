<template>
  <div class="space-y-6">
    <!-- Results Header -->
    <div class="card">
      <div class="card-body text-center">
        <div class="mb-6">
          <div 
            class="inline-flex items-center justify-center w-20 h-20 rounded-full text-4xl font-bold mb-4"
            :class="results.grade.bg + ' ' + results.grade.color"
          >
            {{ results.score }}%
          </div>
          <h2 class="text-3xl font-heading font-bold text-gray-900 mb-2">
            {{ results.grade.level }}
          </h2>
          <p class="text-lg text-gray-600">
            {{ results.correctAnswers }} de {{ results.totalQuestions }} preguntes correctes
          </p>
        </div>
        
        <!-- Stats Row -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-university-primary">
              {{ results.score }}%
            </div>
            <div class="text-sm text-gray-600">Puntuació</div>
          </div>
          
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-green-600">
              {{ results.correctAnswers }}
            </div>
            <div class="text-sm text-gray-600">Correctes</div>
          </div>
          
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-red-600">
              {{ results.totalQuestions - results.correctAnswers }}
            </div>
            <div class="text-sm text-gray-600">Incorrectes</div>
          </div>
          
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-2xl font-bold text-blue-600">
              {{ formatTime(results.timeElapsed) }}
            </div>
            <div class="text-sm text-gray-600">Temps</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-center space-x-4">
      <button @click="$emit('restart-quiz')" class="btn-secondary">
        🔄 Repetir Test
      </button>
      <button @click="$emit('go-home')" class="btn-primary">
        🏠 Tornar a l'Inici
      </button>
      <button @click="exportResults" class="btn-secondary">
        📄 Exportar Resultats
      </button>
    </div>

    <!-- Detailed Results -->
    <div class="card">
      <div class="card-header">
        <h3 class="text-xl font-semibold text-gray-900">
          Revisió Detallada
        </h3>
        <p class="text-sm text-gray-600 mt-1">
          Revisa les teves respostes i aprèn dels errors
        </p>
      </div>
      
      <div class="card-body">
        <!-- Filter Options -->
        <div class="flex flex-wrap gap-2 mb-6">
          <button 
            @click="filter = 'all'"
            class="px-3 py-1 rounded-full text-sm font-medium transition-colors"
            :class="filter === 'all' ? 'bg-university-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
          >
            Totes ({{ results.questionResults.length }})
          </button>
          <button 
            @click="filter = 'correct'"
            class="px-3 py-1 rounded-full text-sm font-medium transition-colors"
            :class="filter === 'correct' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
          >
            Correctes ({{ correctCount }})
          </button>
          <button 
            @click="filter = 'incorrect'"
            class="px-3 py-1 rounded-full text-sm font-medium transition-colors"
            :class="filter === 'incorrect' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
          >
            Incorrectes ({{ incorrectCount }})
          </button>
          <button 
            @click="filter = 'unanswered'"
            class="px-3 py-1 rounded-full text-sm font-medium transition-colors"
            :class="filter === 'unanswered' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
          >
            No contestades ({{ unansweredCount }})
          </button>
        </div>

        <!-- Questions List -->
        <div class="space-y-4">
          <div 
            v-for="(result, index) in filteredResults" 
            :key="index"
            class="border rounded-lg p-4"
            :class="getQuestionCardClasses(result)"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center">
                <span class="bg-gray-100 text-gray-800 text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center mr-3">
                  {{ result.questionIndex + 1 }}
                </span>
                <span class="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {{ result.topic }}
                </span>
              </div>
              
              <div class="flex items-center">
                <span 
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="getStatusBadgeClasses(result)"
                >
                  {{ getStatusText(result) }}
                </span>
              </div>
            </div>
            
            <h4 class="font-semibold text-gray-900 mb-3">
              {{ result.question }}
            </h4>
            
            <div class="space-y-2 mb-3">
              <div 
                v-for="(option, optionIndex) in result.options" 
                :key="optionIndex"
                class="flex items-center p-2 rounded"
                :class="getOptionClasses(result, optionIndex)"
              >
                <span class="w-6 h-6 rounded text-sm font-semibold flex items-center justify-center mr-3">
                  {{ String.fromCharCode(97 + optionIndex) }}
                </span>
                <span>{{ option }}</span>
                
                <!-- Icons -->
                <div class="ml-auto flex items-center space-x-2">
                  <span v-if="result.userAnswer === optionIndex" class="text-blue-600">
                    👤 La teva
                  </span>
                  <span v-if="result.correctAnswer === optionIndex" class="text-green-600">
                    ✅ Correcta
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Explanation -->
            <div v-if="result.explanation" class="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
              <h5 class="font-semibold text-blue-900 mb-1">Explicació:</h5>
              <p class="text-blue-800 text-sm">{{ result.explanation }}</p>
            </div>
            
            <!-- No answer given -->
            <div v-if="result.userAnswer === undefined" class="bg-orange-50 border-l-4 border-orange-400 p-3 rounded">
              <p class="text-orange-800 text-sm">
                ⚠️ No has contestat aquesta pregunta
              </p>
            </div>
          </div>
        </div>
        
        <!-- Empty state for filters -->
        <div v-if="filteredResults.length === 0" class="text-center py-8 text-gray-500">
          <p>No hi ha preguntes que coincideixin amb el filtre seleccionat.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResultsPanel',
  props: {
    results: {
      type: Object,
      required: true
    },
    quizData: {
      type: Object,
      required: true
    }
  },
  emits: ['restart-quiz', 'go-home'],
  data() {
    return {
      filter: 'all' // all, correct, incorrect, unanswered
    }
  },
  computed: {
    correctCount() {
      return this.results.questionResults.filter(r => r.isCorrect).length
    },
    
    incorrectCount() {
      return this.results.questionResults.filter(r => !r.isCorrect && r.userAnswer !== undefined).length
    },
    
    unansweredCount() {
      return this.results.questionResults.filter(r => r.userAnswer === undefined).length
    },
    
    filteredResults() {
      switch (this.filter) {
        case 'correct':
          return this.results.questionResults.filter(r => r.isCorrect)
        case 'incorrect':
          return this.results.questionResults.filter(r => !r.isCorrect && r.userAnswer !== undefined)
        case 'unanswered':
          return this.results.questionResults.filter(r => r.userAnswer === undefined)
        default:
          return this.results.questionResults
      }
    }
  },
  methods: {
    formatTime(milliseconds) {
      const totalSeconds = Math.floor(milliseconds / 1000)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    },
    
    getQuestionCardClasses(result) {
      if (result.userAnswer === undefined) {
        return 'border-orange-200 bg-orange-50'
      } else if (result.isCorrect) {
        return 'border-green-200 bg-green-50'
      } else {
        return 'border-red-200 bg-red-50'
      }
    },
    
    getStatusBadgeClasses(result) {
      if (result.userAnswer === undefined) {
        return 'bg-orange-100 text-orange-800'
      } else if (result.isCorrect) {
        return 'bg-green-100 text-green-800'
      } else {
        return 'bg-red-100 text-red-800'
      }
    },
    
    getStatusText(result) {
      if (result.userAnswer === undefined) {
        return 'No contestada'
      } else if (result.isCorrect) {
        return 'Correcta'
      } else {
        return 'Incorrecta'
      }
    },
    
    getOptionClasses(result, optionIndex) {
      const classes = []
      
      if (result.correctAnswer === optionIndex) {
        classes.push('bg-green-100 border border-green-200')
      } else if (result.userAnswer === optionIndex && !result.isCorrect) {
        classes.push('bg-red-100 border border-red-200')
      } else {
        classes.push('bg-gray-50')
      }
      
      return classes.join(' ')
    },
    
    exportResults() {
      const data = {
        quiz: this.quizData.title,
        completed: this.results.completedAt,
        score: this.results.score,
        grade: this.results.grade.level,
        time: this.formatTime(this.results.timeElapsed),
        results: this.results.questionResults.map(r => ({
          question: r.question,
          topic: r.topic,
          userAnswer: r.userAnswer !== undefined ? r.options[r.userAnswer] : 'No contestada',
          correctAnswer: r.options[r.correctAnswer],
          isCorrect: r.isCorrect
        }))
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resultats_${this.quizData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }
}
</script>
