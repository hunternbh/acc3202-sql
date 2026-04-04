<template>
  <v-card class="pane-card" rounded="xl" elevation="0">
    <v-card-title class="pane-title d-flex justify-space-between align-center">
      <span>Query Editor</span>
      <span class="pane-meta">SQLite / SQL.js</span>
    </v-card-title>

    <v-card-text class="editor-wrap pa-5">
      <textarea
        class="sql-box"
        :value="modelValue"
        spellcheck="false"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        @keydown="handleKeydown"
      />
      <div class="editor-hint">
        Write one or more SQL statements separated by semicolons.
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits([
  'update:modelValue',
  'run-sql',
])

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    emit('run-sql')
  }
}
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
  font-size: 14px;
  font-weight: 700;
}

.pane-meta {
  font-size: 12px;
  color: rgba(229, 231, 235, 0.55);
}

.editor-wrap {
  display: flex;
  flex-direction: column;
  min-height: 380px;
}

.sql-box {
  flex: 1;
  width: 100%;
  min-height: 320px;
  resize: none;
  border: 0;
  outline: none;
  padding: 16px;
  background: rgba(15, 23, 42, 0.72);
  color: #e5e7eb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 14px;
  line-height: 1.55;
}

.editor-hint {
  border-top: 1px dashed rgba(148, 163, 184, 0.18);
  padding: 10px 14px;
  color: rgba(229, 231, 235, 0.58);
  font-size: 12px;
}
</style>