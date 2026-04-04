<template>
  <v-card class="pane-card" rounded="xl" elevation="0">
    <v-card-title class="pane-title">
      <div class="title-row">
        <span>Exercises</span>
        <span class="seed-badge">Seed {{ currentSeed }}</span>
      </div>
    </v-card-title>

    <v-card-text class="exercise-list">
      <v-btn
        v-if="instructorMode"
        variant="outlined"
        class="mb-2 align-self-start"
        @click="$emit('export-answer-key')"
      >
        Export Answer Key
      </v-btn>

      <div
        v-for="(ex, idx) in exercises"
        :key="ex.id"
        class="exercise-item"
      >
        <div class="exercise-header">
          <span class="exercise-chip">#{{ idx + 1 }}</span>
          <div class="exercise-title">{{ ex.title }}</div>
        </div>

        <div class="exercise-prompt">
          {{ ex.prompt }}
        </div>

        <div class="exercise-actions">
          <v-btn variant="outlined" @click="$emit('check-exercise', ex.id)">
            Check
          </v-btn>

          <v-btn
            v-if="instructorMode"
            variant="outlined"
            @click="$emit('toggle-expected', ex.id)"
          >
            Show expected
          </v-btn>

          <v-btn
            v-if="instructorMode"
            variant="outlined"
            @click="$emit('copy-sql', ex.sql)"
          >
            Copy SQL
          </v-btn>
        </div>

        <div
          v-if="exerciseStatus[ex.id]"
          class="exercise-status"
          :class="exerciseStatus[ex.id] === 'correct' ? 'ok' : 'fail'"
        >
          {{
            exerciseStatus[ex.id] === 'correct'
              ? '✅ Correct!'
              : exerciseStatus[ex.id]
          }}
        </div>

        <pre
          v-if="instructorMode && expandedExpected[ex.id]"
          class="expected-box"
        >{{ expectedText(ex) }}</pre>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
type Exercise = {
  id: string
  title: string
  prompt: string
  sql: string
}

defineProps<{
  exercises: Exercise[]
  currentSeed: number
  instructorMode: boolean
  exerciseStatus: Record<string, string>
  expandedExpected: Record<string, boolean>
  expectedText: (ex: Exercise) => string
}>()

defineEmits([
  'export-answer-key',
  'check-exercise',
  'toggle-expected',
  'copy-sql',
])
</script>

<style scoped>
.pane-card {
  background: rgba(17, 24, 39, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.14);
  color: #e5e7eb;
  height: 100%;
}

.pane-title {
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  padding: 14px 16px;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
  font-size: 14px;
  font-weight: 700;
  color: #e5e7eb;
}

.seed-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(8, 145, 178, 0.22);
  border: 1px solid rgba(34, 211, 238, 0.25);
  color: #cffafe;
  font-size: 12px;
  white-space: nowrap;
}

.exercise-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 520px;
  overflow: auto;
  padding: 16px;
}

.exercise-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 14px;
  padding: 16px;
}

.exercise-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.exercise-chip {
  flex: 0 0 auto;
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: #0f766e;
  color: white;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
}

.exercise-title {
  min-width: 0;
  flex: 1 1 auto;
  color: #f8fafc;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.exercise-prompt {
  margin-top: 10px;
  color: rgba(229, 231, 235, 0.82);
  font-size: 14px;
  line-height: 1.7;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.exercise-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.exercise-status {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.5;
}

.exercise-status.ok {
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid rgba(16, 185, 129, 0.24);
  color: #a7f3d0;
}

.exercise-status.fail {
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.24);
  color: #fecaca;
}

.expected-box {
  margin-top: 12px;
  padding: 14px;
  white-space: pre-wrap;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.55;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 12px;
  color: #e5e7eb;
}

@media (max-width: 640px) {
  .exercise-item {
    padding: 14px;
  }

  .exercise-title {
    font-size: 14px;
  }

  .exercise-prompt {
    font-size: 13px;
    line-height: 1.6;
  }
}
</style>