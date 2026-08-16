<template>
  <main class="advanced-shell">
    <div class="advanced-toolbar">
      <div>
        <div class="eyebrow">Optional enrichment</div>
        <h1>Advanced SQL Study Guide</h1>
        <p>Read the complete study material here without visiting GitHub.</p>
        <p class="source-note">Local snapshot of material by Devinterview.io, retrieved August 15, 2026.</p>
      </div>
      <v-btn variant="outlined" prepend-icon="mdi-arrow-left" @click="$emit('back')">
        Back to SQL Lab
      </v-btn>
    </div>

    <article class="markdown-body" v-html="renderedContent"></article>
  </main>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import advancedSqlMarkdown from '../content/advanced-sql.md?raw'

defineEmits(['back'])

const renderedContent = marked.parse(advancedSqlMarkdown, {
  async: false,
  gfm: true,
}) as string
</script>

<style scoped>
.advanced-shell {
  width: min(980px, calc(100% - 32px));
  margin: 0 auto;
  padding: 32px 0 64px;
}

.advanced-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 18px;
  background: rgba(17, 24, 39, 0.9);
}

.eyebrow {
  color: #5eead4;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

h1 {
  margin-top: 4px;
  color: #f8fafc;
  font-size: clamp(25px, 4vw, 38px);
  font-weight: 800;
  line-height: 1.2;
}

.advanced-toolbar p {
  margin-top: 8px;
  color: rgba(229, 231, 235, 0.7);
}

.advanced-toolbar .source-note {
  color: rgba(229, 231, 235, 0.52);
  font-size: 12px;
}

.markdown-body {
  padding: clamp(20px, 4vw, 48px);
  overflow-wrap: anywhere;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 18px;
  background: #f8fafc;
  color: #1e293b;
  line-height: 1.75;
}

:deep(.markdown-body h1),
:deep(.markdown-body h2),
:deep(.markdown-body h3),
:deep(.markdown-body h4) {
  margin: 1.4em 0 0.55em;
  color: #0f172a;
  font-weight: 800;
  line-height: 1.28;
}

:deep(.markdown-body h1) {
  margin-top: 0;
  font-size: clamp(28px, 5vw, 44px);
}

:deep(.markdown-body h2) {
  padding-top: 0.5em;
  border-top: 1px solid #cbd5e1;
  font-size: clamp(22px, 3vw, 30px);
}

:deep(.markdown-body p),
:deep(.markdown-body ul),
:deep(.markdown-body ol) {
  margin: 0.75em 0;
}

:deep(.markdown-body pre) {
  margin: 1em 0;
  padding: 16px;
  overflow-x: auto;
  border-radius: 12px;
  background: #0f172a;
  color: #e2e8f0;
}

:deep(.markdown-body code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

:deep(.markdown-body :not(pre) > code) {
  padding: 0.12em 0.35em;
  border-radius: 5px;
  background: #e2e8f0;
  color: #0f172a;
}

:deep(.markdown-body table) {
  display: block;
  width: 100%;
  margin: 1em 0;
  overflow-x: auto;
  border-collapse: collapse;
}

:deep(.markdown-body th),
:deep(.markdown-body td) {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  text-align: left;
}

:deep(.markdown-body img) {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
}

:deep(.markdown-body a) {
  color: #0f766e;
}

@media (max-width: 700px) {
  .advanced-toolbar {
    flex-direction: column;
  }
}
</style>
