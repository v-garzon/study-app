<template>
  <div class="card">
    <div class="card-header">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center mb-2">
            <span class="bg-university-primary text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center mr-3">
              {{ questionNumber }}
            </span>
            <span class="text-sm text-university-primary bg-blue-50 px-2 py-1 rounded">
              {{ question.topic }}
            </span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 leading-relaxed">
            {{ question.question }}
          </h3>
        </div>
        
        <!-- Answer Status -->
        <div class="ml-4 flex-shrink-0">
          <div 
            v-if="selectedAnswer !== undefined"
            class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center"
          >
            <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
          <div 
            v-else
            class="w-6 h-6 rounded-full border-2 border-gray-300"
          ></div>
        </div>
      </div>
    </div>
    
    <div class="card-body">
      <div class="space-y-3">
        <div
          v-for="(option, index) in question.options"
          :key="index"
          class="option-container"
          :class="getOptionClasses(index)"
          @click="selectAnswer(index)"
        >
          <div class="flex items-center p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-gray-50">
            <!-- Radio Button -->
            <div class="flex-shrink-0 mr-4">
              <div 
                class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                :class="getRadioClasses(index)"
              >
                <div 
                  v-if="selectedAnswer === index"
                  class="w-3 h-3 rounded-full bg-white"
                ></div>
              </div>
            </div>
            
            <!-- Option Letter -->
            <div class="flex-shrink-0 mr-3">
              <span 
                class="w-6 h-6 rounded text-sm font-semibold flex items-center justify-center"
                :class="getLetterClasses(index)"
              >
                {{ String.fromCharCode(97 + index) }}
              </span>
            </div>
            
            <!-- Option Text -->
            <div class="flex-1 text-gray-900">
              {{ option }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Question Metadata -->
      <div class="mt-4 pt-4 border-t border-gray-100">
        <div class="flex items-center justify-between text-xs text-gray-500">
          <div>
            Pregunta {{ questionNumber }} de {{ totalQuestions || '?' }}
          </div>
          <div v-if="selectedAnswer !== undefined" class="text-green-600 font-medium">
            Respondida
          </div>
          <div v-else class="text-orange-600 font-medium">
            Pendent
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QuestionCard',
  props: {
    question: {
      type: Object,
      required: true
    },
    questionNumber: {
      type: Number,
      required: true
    },
    selectedAnswer: {
      type: Number,
      default: undefined
    },
    totalQuestions: {
      type: Number,
      default: null
    }
  },
  emits: ['answer-selected'],
  methods: {
    selectAnswer(index) {
      this.$emit('answer-selected', index)
    },
    
    getOptionClasses(index) {
      const base = 'option-container'
      if (this.selectedAnswer === index) {
        return `${base} selected`
      }
      return base
    },
    
    getRadioClasses(index) {
      if (this.selectedAnswer === index) {
        return 'border-university-primary bg-university-primary'
      }
      return 'border-gray-300 bg-white hover:border-university-primary'
    },
    
    getLetterClasses(index) {
      if (this.selectedAnswer === index) {
        return 'bg-university-primary text-white'
      }
      return 'bg-gray-100 text-gray-600'
    }
  }
}
</script>

<style scoped>
.option-container.selected .flex {
  @apply border-university-primary bg-blue-50;
}

.option-container:hover .flex {
  @apply border-gray-300;
}

.option-container.selected:hover .flex {
  @apply border-university-primary;
}
</style>
