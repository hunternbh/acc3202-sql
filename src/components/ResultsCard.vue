<template>
  <v-card class="pane-card" rounded="xl" elevation="0">
    <v-card-title class="pane-title">
      <div class="title-row">
        <span>Results</span>
        <span class="result-badge">{{ resultSummary }}</span>
      </div>
    </v-card-title>

    <v-card-text class="results-wrap">
      <div v-if="resultError" class="message error-box">
        {{ resultError }}
      </div>

      <div v-else-if="lastResults.length === 0 && hasRunOnce" class="message info-box">
        No rows returned.
      </div>

      <template v-else>
        <div v-for="(set, idx) in lastResults" :key="idx" class="result-set">
          <div class="result-caption">
            Result {{ idx + 1 }} — {{ set.values.length }} row(s)
          </div>

          <div class="table-wrap">
            <table class="result-table">
              <thead>
                <tr>
                  <th v-for="col in set.columns" :key="col">
                    {{ col }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rIdx) in set.values" :key="rIdx">
                  <td v-for="(cell, cIdx) in row" :key="cIdx">
                    {{ cell === null ? 'NULL' : String(cell) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{
  lastResults: { columns: string[]; values: unknown[][] }[]
  resultError: string
  hasRunOnce: boolean
  resultSummary: string
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

.result-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(148, 163, 184, 0.14);
  color: rgba(229, 231, 235, 0.76);
  font-size: 12px;
  white-space: nowrap;
}

.results-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 520px;
  overflow: auto;
  padding: 16px;
}

.message {
  padding: 12px 14px;
  border-radius: 12px;
  line-height: 1.5;
  font-size: 14px;
}

.error-box {
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.24);
  color: #fecaca;
}

.info-box {
  background: rgba(59, 130, 246, 0.14);
  border: 1px solid rgba(59, 130, 246, 0.24);
  color: #bfdbfe;
}

.result-set {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-caption {
  color: rgba(229, 231, 235, 0.62);
  font-size: 12px;
}

.table-wrap {
  overflow: auto;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.55);
}

.result-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 520px;
}

.result-table th,
.result-table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  text-align: left;
  white-space: nowrap;
  font-size: 13px;
}

.result-table th {
  position: sticky;
  top: 0;
  background: rgba(15, 23, 42, 0.95);
  color: #f8fafc;
  font-weight: 700;
  z-index: 1;
}

.result-table td {
  color: rgba(229, 231, 235, 0.88);
}

.result-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}
</style>