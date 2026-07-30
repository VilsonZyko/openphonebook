<template>
  <!-- dark class is driven by the local darkMode ref (localStorage), not config,
       so the preference survives page refreshes without any server round-trip. -->
  <div :class="{ 'dark': darkMode }">
    <div class="flex flex-col min-h-screen bg-brand-bg text-brand-main antialiased selection:bg-sky-500 selection:text-white transition-colors duration-300 ease-in-out">
      
      <!-- Header -->
      <header class="sticky top-0 z-30 bg-brand-surface border-b border-brand-main shadow-sm backdrop-blur-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-18 py-3 gap-4">
            <div class="flex items-center gap-3">
              <div class="flex-shrink-0">
                <div class="h-10 w-10 rounded-lg bg-brand-primary flex items-center justify-center text-white shadow-md font-bold text-xl overflow-hidden">
                  <img v-if="config?.brandIcon" :src="config.brandIcon" class="w-full h-full object-cover" />
                  <i v-else class="fa-solid fa-address-book"></i>
                </div>
              </div>
              <div>
                <h1 class="text-xl font-bold text-brand-main tracking-tight leading-tight">{{ config?.siteTitle || 'OpenPhonebook' }}</h1>
                <p class="text-xs text-brand-muted font-medium">{{ config?.siteTagline || 'Corporate Directory' }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2 sm:gap-3">
              <button @click="toggleDarkMode" class="p-2 text-brand-muted hover:text-brand-main rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Toggle Dark Mode">
                <i class="fa-solid fa-moon text-lg" v-if="!darkMode"></i>
                <i class="fa-solid fa-sun text-lg text-amber-400" v-else></i>
              </button>

              <template v-if="$route.path === '/'">
                <router-link v-if="config?.isConfigured === false" to="/dev" class="btn-primary text-xs shadow-sm bg-amber-600 hover:bg-amber-700 animate-pulse">
                  <i class="fa-solid fa-triangle-exclamation"></i> <span class="hidden sm:inline">First-Time Setup</span>
                </router-link>
                <template v-else>
                  <router-link v-if="userRole" to="/admin" class="btn-primary text-xs shadow-sm">
                    <i class="fa-solid fa-shield-halved"></i> <span class="hidden sm:inline">Admin Panel</span>
                  </router-link>
                  <router-link v-if="userRole === 'dev'" to="/dev" class="btn-secondary text-xs shadow-sm">
                    <i class="fa-solid fa-code"></i> <span class="hidden sm:inline">Dev Panel</span>
                  </router-link>
                </template>
              </template>
              
              <template v-else>
                <router-link to="/" class="btn-primary text-xs shadow-sm bg-emerald-600 hover:bg-emerald-700">
                  <i class="fa-solid fa-address-book"></i> <span class="hidden sm:inline">Back to Directory</span>
                </router-link>
                <router-link v-if="userRole === 'dev' && $route.path === '/admin'" to="/dev" class="btn-secondary text-xs shadow-sm">
                  <i class="fa-solid fa-code"></i> <span class="hidden sm:inline">Dev Panel</span>
                </router-link>
                <router-link v-if="$route.path === '/dev'" to="/admin" class="btn-primary text-xs shadow-sm">
                  <i class="fa-solid fa-shield-halved"></i> <span class="hidden sm:inline">Admin Panel</span>
                </router-link>
              </template>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <router-view />
      </main>

      <!-- Footer -->
      <footer class="mt-auto border-t border-brand-main bg-brand-surface py-4">
        <div class="max-w-7xl mx-auto px-4 text-center text-xs text-brand-muted flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>OpenPhonebook</strong> &bull; Node.js + Vue.js Modern Edition
          </div>
          <div class="flex items-center gap-4">
            <span>Powered by SQLite</span>
          </div>
        </div>
      </footer>
    </div>
    <ToastNotification />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useStorage } from './composables/useStorage';
import ToastNotification from './components/ToastNotification.vue';

const { config, fetchConfig, saveConfig, authPin, verifyPinAPI } = useStorage();
const userRole = ref(null);

const DARK_MODE_KEY = 'openphonebook_darkMode';

// Read dark mode from localStorage immediately (before fetchConfig resolves)
// so the page never flashes from light → dark on load.
const darkMode = ref(localStorage.getItem(DARK_MODE_KEY) === 'true');

// Apply dark class to <html> based on local preference.
function applyDarkClass(val) {
  document.documentElement.classList.toggle('dark', val);
}
applyDarkClass(darkMode.value);

watch(darkMode, (val) => {
  applyDarkClass(val);
  localStorage.setItem(DARK_MODE_KEY, String(val));
});

// STATE-1 FIX: Guard against the empty-string initial value.
watch(authPin, async (newPin) => {
  if (newPin) {
    userRole.value = await verifyPinAPI(newPin);
  } else {
    userRole.value = null;
  }
}, { immediate: true });

onMounted(async () => {
  await fetchConfig();
  applyThemeColors(config.value);
  // If no localStorage preference exists yet, adopt the server default.
  if (localStorage.getItem(DARK_MODE_KEY) === null && config.value?.theme?.darkMode !== undefined) {
    darkMode.value = !!config.value.theme.darkMode;
  }
});

watch(config, (newConfig) => {
  if (newConfig) {
    applyThemeColors(newConfig);
    if (newConfig.brandIcon) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = newConfig.brandIcon;
    }
  }
}, { deep: true });

function toggleDarkMode() {
  // Toggle local preference immediately — no server round-trip needed.
  darkMode.value = !darkMode.value;

  // Also try to persist the new default to the server (for authenticated users
  // who want to set the default for all visitors). Failure is silently ignored
  // since localStorage is the source of truth for the current user.
  if (config.value) {
    const updated = JSON.parse(JSON.stringify(config.value));
    updated.theme.darkMode = darkMode.value;
    saveConfig(updated).catch(() => {/* unauthenticated — ok */});
  }
}

function applyThemeColors(cfg) {
  if (!cfg || !cfg.theme) return;
  const root = document.documentElement;
  if (cfg.theme.primaryColor) root.style.setProperty('--custom-primary', cfg.theme.primaryColor);
  if (cfg.theme.accentColor) root.style.setProperty('--custom-accent', cfg.theme.accentColor);
  if (cfg.theme.bgColor) root.style.setProperty('--custom-bg', cfg.theme.bgColor);
  if (cfg.theme.surfaceColor) root.style.setProperty('--custom-surface', cfg.theme.surfaceColor);
  if (cfg.theme.textColor) root.style.setProperty('--custom-text', cfg.theme.textColor);
}
</script>

