<template>
  <v-app>
    <v-main class="app-shell">
      <v-container
        class="py-4"
        style="max-width: 1180px; padding-left: 16px; padding-right: 16px;"
      >
        <div class="hero-wrap mb-4">
          <HeroSection />
          <div class="image-center">
            <img src="/frontpage.gif" alt="Cover" class="front-image" />
          </div>
        </div>

        <!-- Row 1: Seed / summary panel + Schema Browser -->
        <v-row class="pane-grid" dense>
          <v-col cols="12" md="6">
            <div class="toolbar-wrap top-pane">
              <ControlPanel
                :seed-input="seedInput"
                :solved-count="solvedCount"
                :exercise-count="exercises.length"
                @build-exercises="() => buildExercises(seedInput)"
                @toggle-instructor="toggleInstructorMode"
                @update:seed-input="seedInput = $event"
              />
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <div class="pane-wrap top-pane">
              <SchemaCard :schema-text="schemaText" />
            </div>
          </v-col>
        </v-row>

        <!-- Row 2: Editor + Results stacked, Exercises on the right -->
        <v-row class="pane-grid mt-1" dense>
          <v-col cols="12" md="8">
            <v-row class="pane-grid" dense>
              <v-col cols="12">
                <div class="pane-wrap bottom-pane-half editor-pane">
  <SqlEditorCard
    v-model="editorText"
    @run-sql="runSql"
  />
</div>
              </v-col>

              <v-col cols="12">
                <div class="pane-wrap bottom-pane-half results-pane">
  <ResultsCard
    :last-results="lastResults"
    :result-error="resultError"
    :has-run-once="hasRunOnce"
    :result-summary="resultSummary"
  />
</div>
              </v-col>
            </v-row>
          </v-col>

          <v-col cols="12" md="4">
            <div class="pane-wrap bottom-pane-tall">
              <ExercisesCard
                :exercises="exercises"
                :current-seed="currentSeed"
                :instructor-mode="instructorMode"
                :exercise-status="exerciseStatus"
                :expanded-expected="expandedExpected"
                @export-answer-key="exportAnswerKey"
                @check-exercise="checkExercise"
                @toggle-expected="toggleExpected"
                @copy-sql="copySql"
                :expected-text="expectedText"
              />
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HeroSection from './components/HeroSection.vue'
import ControlPanel from './components/ControlPanel.vue'
import SqlEditorCard from './components/SqlEditorCard.vue'
import ResultsCard from './components/ResultsCard.vue'
import SchemaCard from './components/SchemaCard.vue'
import ExercisesCard from './components/ExercisesCard.vue'
import { useSqlLab } from './composables/useSqlLab'

const {
  seedInput,
  currentSeed,
  instructorMode,
  editorText,
  schemaText,
  lastResults,
  resultError,
  hasRunOnce,
  exercises,
  expandedExpected,
  exerciseStatus,
  solvedCount,
  buildExercises,
  toggleInstructorMode,
  runSql,
  exportAnswerKey,
  checkExercise,
  toggleExpected,
  copySql,
  expectedText,
} = useSqlLab()

const resultSummary = computed(() => {
  if (resultError.value) return 'Error'
  if (!hasRunOnce.value) return 'Ready'
  return `${lastResults.value.length} result set(s)`
})
</script>

<style scoped>
.app-shell {
  background:
    linear-gradient(180deg, rgba(11, 16, 34, 0.92), rgba(10, 15, 29, 0.92)),
    #0f172a;
  min-height: 100vh;
  padding: 12px;
}

.hero-wrap,
.toolbar-wrap,
.pane-wrap {
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 18px;
  background: rgba(17, 24, 39, 0.78);
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
}

.toolbar-wrap,
.pane-wrap {
  overflow: hidden;
}

.top-pane {
  min-height: 320px;
  height: 100%;
}

.bottom-pane-half.editor-pane {
  min-height: 220px;
  height: 100%;
}

.bottom-pane-half.results-pane {
  min-height: 290px;
  height: 100%;
}

.bottom-pane-tall {
  min-height: 522px;
  height: 100%;
}

.pane-grid {
  row-gap: 12px;
}

.image-center {
  display: flex;
  justify-content: center;
}

.front-image {
  max-width: 100%;
  width: 720px;
  height: auto;
  border-radius: 16px;
}
</style>