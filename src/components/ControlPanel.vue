<template>
  <v-card class="toolbar-card" rounded="xl" elevation="0">
    <v-card-text class="toolbar-root">
      <div class="toolbar-group">
        <div class="group-label">Exercises</div>

        <div class="seed-panel">
          <div class="seed-label">Seed</div>

          <div class="seed-row">
            <v-text-field
              :model-value="seedInput"
              type="number"
              min="1"
              max="100"
              variant="outlined"
              density="comfortable"
              hide-details
              class="seed-input"
              @update:model-value="$emit('update:seed-input', Number($event))"
            />
            <v-btn color="teal-darken-2" @click="$emit('build-exercises')">
              Build Set
            </v-btn>
            <v-btn variant="outlined" @click="$emit('toggle-instructor')">
              Instructor
            </v-btn>
          </div>
        </div>

        <div class="score-box">
          Score: {{ solvedCount }} / {{ exerciseCount }}
        </div>

        <div class="help-line">
          Press Ctrl/⌘ + Enter in the editor.
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{
  seedInput: number
  solvedCount: number
  exerciseCount: number
}>()

defineEmits([
  'build-exercises',
  'toggle-instructor',
  'update:seed-input',
])
</script>

<style scoped>
.toolbar-card {
  background: rgba(17, 24, 39, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.14);
  color: #e5e7eb;
}

.toolbar-root {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr;
}

.toolbar-group {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 14px;
  padding: 14px;
}

.group-label {
  font-size: 13px;
  font-weight: 700;
  color: rgba(229, 231, 235, 0.7);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.seed-panel {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
}

.seed-label {
  font-size: 12px;
  color: rgba(229, 231, 235, 0.62);
  margin-bottom: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.seed-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.seed-input {
  max-width: 110px;
}

.score-box,
.help-line {
  font-size: 13px;
  color: rgba(229, 231, 235, 0.68);
}

.score-box {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.12);
  margin-bottom: 10px;
}

:deep(.v-field) {
  background: rgba(15, 23, 42, 0.72);
  border-radius: 12px;
}

@media (max-width: 640px) {
  .seed-row {
    flex-direction: column;
    align-items: stretch;
  }

  .seed-input {
    max-width: none;
  }
}
</style>