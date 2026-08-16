<template>
  <v-card class="hero-card" rounded="xl" elevation="0">
    <v-card-text class="pa-5">
      <div class="hero-row">
        <div>
          <div class="hero-title">Hunter’s Sci-fi Accounting</div>
          <div class="hero-subtitle">
            Practice SQL using a browser-based SQLite database with personalized accounting exercises.
          </div>
        </div>
        <v-btn color="teal-darken-2" prepend-icon="mdi-school" @click="$emit('open-advanced')">
          Advanced
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
defineEmits(['open-advanced'])
</script>

<style scoped>
.hero-card {
  background: rgba(17, 24, 39, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.14);
  color: #e5e7eb;
}

.hero-title {
  font-size: clamp(22px, 2.2vw, 30px);
  font-weight: 800;
  letter-spacing: 0.2px;
}

.hero-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.hero-subtitle {
  margin-top: 8px;
  color: rgba(229, 231, 235, 0.68);
  font-size: 15px;
  line-height: 1.55;
}

@media (max-width: 640px) {
  .hero-row {
    flex-direction: column;
  }
}
</style>
