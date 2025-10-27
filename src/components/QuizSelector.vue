<template>
  <div class="space-y-6">
    <!-- Welcome Section -->
    <div class="text-center">
      <h2 class="text-3xl font-heading font-bold text-gray-900 mb-4">
        Selecciona un Test
      </h2>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        Tria el test que vols realitzar. Tots els tests es basen en els exàmens oficials de Materials Estructurals.
      </p>
    </div>

    <!-- Load Tests Button -->
    <div class="text-center">
      <button 
        @click="$emit('load-tests')"
        class="btn-secondary mr-4"
      >
        🔄 Recarregar Tests
      </button>
      <span class="text-sm text-gray-500">
        Tests disponibles: {{ availableTests.length }}
      </span>
    </div>

    <!-- Tests Grid -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div 
        v-for="test in availableTests" 
        :key="test.filename"
        class="card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
        @click="startTest(test)"
      >
        <div class="card-header">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ test.title }}
          </h3>
          <p class="text-sm text-gray-600 mt-1">
            {{ test.subtitle }}
          </p>
        </div>
        
        <div class="card-body">
          <div class="flex flex-wrap gap-2 mb-4">
            <span 
              v-for="topic in test.topics" 
              :key="topic"
              class="badge badge-info"
            >
              {{ topic }}
            </span>
          </div>
          
          <div class="flex justify-between items-center text-sm text-gray-500">
            <div class="flex items-center">
              <span class="mr-4">
                ⏱️ {{ test.duration }}
              </span>
              <span class="flex items-center">
                📊 
                <span 
                  class="ml-1 px-2 py-1 rounded text-xs"
                  :class="getDifficultyClass(test.difficulty)"
                >
                  {{ test.difficulty }}
                </span>
              </span>
            </div>
            
            <div class="flex items-center text-university-primary">
              <span class="text-sm font-medium">Començar</span>
              <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="availableTests.length === 0" class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-500 mb-2">
        No s'han trobat tests
      </h3>
      <p class="text-gray-400 mb-4">
        Afegeix arxius .questionary a la carpeta 'tests' per començar.
      </p>
      <button @click="$emit('load-tests')" class="btn-primary">
        Tornar a cercar
      </button>
    </div>

    <!-- Instructions -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
      <h4 class="text-lg font-semibold text-blue-900 mb-3">
        📋 Instruccions d'ús
      </h4>
      <ul class="text-blue-800 space-y-2">
        <li class="flex items-start">
          <span class="text-blue-500 mr-2">•</span>
          Selecciona un test de la llista per començar
        </li>
        <li class="flex items-start">
          <span class="text-blue-500 mr-2">•</span>
          Podràs veure totes les preguntes en la mateixa pàgina
        </li>
        <li class="flex items-start">
          <span class="text-blue-500 mr-2">•</span>
          El temps es controla automàticament
        </li>
        <li class="flex items-start">
          <span class="text-blue-500 mr-2">•</span>
          Els resultats es guarden automàticament
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QuizSelector',
  props: {
    availableTests: {
      type: Array,
      default: () => []
    }
  },
  emits: ['start-quiz', 'load-tests'],
  methods: {
    startTest(test) {
      this.$emit('start-quiz', test)
    },
    
    getDifficultyClass(difficulty) {
      switch (difficulty?.toLowerCase()) {
        case 'fàcil':
        case 'facil':
          return 'bg-green-100 text-green-800'
        case 'medio':
        case 'mitjà':
          return 'bg-yellow-100 text-yellow-800'
        case 'difícil':
        case 'dificil':
          return 'bg-red-100 text-red-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    }
  }
}
</script>
