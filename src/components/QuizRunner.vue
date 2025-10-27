<template>
  <div class="space-y-6">
    <!-- Quiz Header -->
    <div class="card">
      <div class="card-header">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-heading font-bold text-gray-900">
              {{ quizData.title }}
            </h2>
            <p class="text-gray-600 mt-1">{{ quizData.subtitle }}</p>
            <p class="text-sm text-gray-500 mt-2">{{ quizData.instructions }}</p>
          </div>
          
          <div class="text-right">
            <div class="text-2xl font-bold text-university-primary">
              {{ formatTime(timeElapsed) }}
            </div>
            <div class="text-sm text-gray-500">temps transcorregut</div>
            <div v-if="quizData.metadata?.duration" class="text-xs text-gray-400">
              límit: {{ quizData.metadata.duration }}
            </div>
          </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="mt-4">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-gray-600">Progrés</span>
            <span class="text-sm text-gray-600">
              {{ answeredQuestions }} / {{ quizData.questions.length }}
            </span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill"
              :style="{ width: progressPercentage + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Questions -->
    <div class="space-y-6">
      <QuestionCard
        v-for="(question, index) in quizData.questions"
        :key="question.id || index"
        :question="question"
        :question-number="index + 1"
        :selected-answer="userAnswers[index]"
        @answer-selected="onAnswerSelected(index, $event)"
      />
    </div>

    <!-- Submit Section -->
    <div class="card">
      <div class="card-body">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Finalitzar Test</h3>
            <p class="text-sm text-gray-600">
              Has contestat {{ answeredQuestions }} de {{ quizData.questions.length }} preguntes
            </p>
            <p v-if="unansweredQuestions > 0" class="text-sm text-orange-600 mt-1">
              ⚠️ Queden {{ unansweredQuestions }} preguntes sense respondre
            </p>
          </div>
          
          <div class="flex space-x-3">
            <button 
              @click="$emit('go-home')"
              class="btn-secondary"
            >
              Cancelar
            </button>
            <button 
              @click="submitQuiz"
              class="btn-primary"
              :disabled="!canSubmit"
              :class="{ 'opacity-50 cursor-not-allowed': !canSubmit }"
            >
              {{ submitButtonText }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Action Button (for mobile) -->
    <div class="fixed bottom-6 right-6 md:hidden">
      <button 
        @click="scrollToTop"
        class="bg-university-primary text-white p-3 rounded-full shadow-lg hover:bg-upc-blue-700 transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
import QuestionCard from './QuestionCard.vue'

export default {
  name: 'QuizRunner',
  components: {
    QuestionCard
  },
  props: {
    quizData: {
      type: Object,
      required: true
    }
  },
  emits: ['quiz-completed', 'go-home'],
  data() {
    return {
      userAnswers: {},
      startTime: Date.now(),
      timeElapsed: 0,
      timer: null
    }
  },
  computed: {
    answeredQuestions() {
      return Object.keys(this.userAnswers).length
    },
    
    unansweredQuestions() {
      return this.quizData.questions.length - this.answeredQuestions
    },
    
    progressPercentage() {
      return (this.answeredQuestions / this.quizData.questions.length) * 100
    },
    
    canSubmit() {
      return this.answeredQuestions > 0
    },
    
    submitButtonText() {
      if (this.answeredQuestions === 0) {
        return 'Respon almenys una pregunta'
      } else if (this.unansweredQuestions > 0) {
        return `Enviar (${this.unansweredQuestions} sense respondre)`
      } else {
        return 'Enviar Test Complet'
      }
    }
  },
  mounted() {
    this.startTimer()
  },
  beforeUnmount() {
    this.stopTimer()
  },
  methods: {
    startTimer() {
      this.timer = setInterval(() => {
        this.timeElapsed = Date.now() - this.startTime
      }, 1000)
    },
    
    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    
    formatTime(milliseconds) {
      const totalSeconds = Math.floor(milliseconds / 1000)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    },
    
    onAnswerSelected(questionIndex, answerIndex) {
      this.userAnswers = {
        ...this.userAnswers,
        [questionIndex]: answerIndex
      }
    },
    
    submitQuiz() {
      this.stopTimer()
      
      // Calculate results
      const results = this.calculateResults()
      
      this.$emit('quiz-completed', results)
    },
    
    calculateResults() {
      const totalQuestions = this.quizData.questions.length
      let correctAnswers = 0
      const questionResults = []
      
      this.quizData.questions.forEach((question, index) => {
        const userAnswer = this.userAnswers[index]
        const isCorrect = userAnswer === question.correct
        
        if (isCorrect) {
          correctAnswers++
        }
        
        questionResults.push({
          questionIndex: index,
          question: question.question,
          topic: question.topic,
          userAnswer: userAnswer,
          correctAnswer: question.correct,
          isCorrect,
          explanation: question.explanation,
          options: question.options
        })
      })
      
      const score = Math.round((correctAnswers / totalQuestions) * 100)
      const grade = this.getGrade(score)
      
      return {
        totalQuestions,
        answeredQuestions: this.answeredQuestions,
        correctAnswers,
        score,
        grade,
        timeElapsed: this.timeElapsed,
        completedAt: new Date().toISOString(),
        questionResults,
        quizMetadata: this.quizData.metadata
      }
    },
    
    getGrade(score) {
      if (score >= 90) return { level: 'Excelent', color: 'text-green-600', bg: 'bg-green-100' }
      if (score >= 80) return { level: 'Notable', color: 'text-blue-600', bg: 'bg-blue-100' }
      if (score >= 70) return { level: 'Bé', color: 'text-yellow-600', bg: 'bg-yellow-100' }
      if (score >= 60) return { level: 'Aprovat', color: 'text-orange-600', bg: 'bg-orange-100' }
      return { level: 'Suspès', color: 'text-red-600', bg: 'bg-red-100' }
    },
    
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}
</script>
