<template>
  <v-card class="pane-card" rounded="xl" elevation="0">
    <v-card-title class="pane-title">
      <span>Schema Browser</span>
    </v-card-title>

    <v-card-text class="schema-wrap">
      <div class="schema-box">
        {{ schemaText || '(no database loaded)' }}
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{
  schemaText: string
}>()
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
  font-size: 14px;
  font-weight: 700;
  color: rgba(229, 231, 235, 0.9);
}

.schema-wrap {
  padding: 16px;
}

.schema-box {
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.7);
  padding: 14px;
  min-height: 320px;
  max-height: 520px;
  overflow: auto;
  white-space: pre-wrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.55;
  color: #e5e7eb;
}
</style>