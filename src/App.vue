<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center">
            <h1 class="text-2xl font-heading font-bold text-university-primary">
              Materials Estructurals
            </h1>
            <span class="ml-3 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Quiz App
            </span>
          </div>
          
          <div class="flex items-center space-x-4">
            <button 
              @click="showStats = !showStats"
              class="btn-secondary text-sm"
            >
              📊 Estadístiques
            </button>
            
            <button 
              v-if="currentView !== 'selector'"
              @click="goHome"
              class="btn-primary text-sm"
            >
              🏠 Inici
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Stats Panel (Modal) -->
      <StatsPanel 
        v-if="showStats" 
        @close="showStats = false"
        :stats="globalStats"
      />
      
      <!-- Quiz Selector -->
      <QuizSelector 
        v-if="currentView === 'selector'"
        :available-tests="availableTests"
        @start-quiz="startQuiz"
        @load-tests="loadAvailableTests"
      />
      
      <!-- Quiz Runner -->
      <QuizRunner
        v-if="currentView === 'quiz'"
        :quiz-data="currentQuiz"
        @quiz-completed="onQuizCompleted"
        @go-home="goHome"
      />
      
      <!-- Results Panel -->
      <ResultsPanel
        v-if="currentView === 'results'"
        :results="quizResults"
        :quiz-data="currentQuiz"
        @restart-quiz="restartQuiz"
        @go-home="goHome"
      />
    </main>
  </div>
</template>

<script>
import QuizSelector from './components/QuizSelector.vue'
import QuizRunner from './components/QuizRunner.vue'
import ResultsPanel from './components/ResultsPanel.vue'
import StatsPanel from './components/StatsPanel.vue'
import { questionaryParser } from './utils/questionaryParser.js'
import { fileManager } from './utils/fileManager.js'
import { statsManager } from './utils/statsManager.js'

export default {
  name: 'App',
  components: {
    QuizSelector,
    QuizRunner,
    ResultsPanel,
    StatsPanel
  },
  data() {
    return {
      currentView: 'selector', // selector, quiz, results
      showStats: false,
      availableTests: [],
      currentQuiz: null,
      quizResults: null,
      globalStats: {}
    }
  },
  async mounted() {
    await this.loadAvailableTests()
    this.loadGlobalStats()
  },
  methods: {
    async loadAvailableTests() {
      try {
        this.availableTests = await fileManager.getAvailableTests()
      } catch (error) {
        console.error('Error loading tests:', error)
      }
    },
    
    async startQuiz(testData) {
      try {
        const content = await fileManager.loadTestContent(testData.filename)
        this.currentQuiz = questionaryParser.parse(content)
        this.currentQuiz.metadata = testData
        this.currentView = 'quiz'
      } catch (error) {
        console.error('Error starting quiz:', error)
        this.currentView = 'quiz'
      }
    },
    
    async onQuizCompleted(results) {
      this.quizResults = results
      
      // Save results
      try {
        await fileManager.saveCompletedQuiz(this.currentQuiz, results)
        await this.updateGlobalStats(results)
      } catch (error) {
        console.error('Error saving results:', error)
      }
      
      this.currentView = 'results'
    },
    
    async updateGlobalStats(results) {
      const stats = await statsManager.updateStats(this.currentQuiz, results)
      this.globalStats = stats
    },
    
    loadGlobalStats() {
      this.globalStats = statsManager.getGlobalStats()
    },
    
    restartQuiz() {
      this.currentView = 'quiz'
      this.quizResults = null
    },
    
    goHome() {
      this.currentView = 'selector'
      this.currentQuiz = null
      this.quizResults = null
    }
  }
}
</script>