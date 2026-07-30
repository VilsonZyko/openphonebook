import { ref } from 'vue';
import { apiFetch } from './api';

const config = ref(null);

const DEFAULT_CONFIG = {
  siteTitle: 'OpenPhonebook Directory',
  siteTagline: 'Corporate & Organization API Directory',
  theme: {
    primaryColor: '#0284c7',
    accentColor: '#0369a1',
    bgColor: '#cbd5e1',
    surfaceColor: '#f1f5f9',
    textColor: '#0f172a',
    darkMode: false
  },
  features: {
    enableFax: false,
    enableCsvExport: true,
    enablePrintView: true,
    enableClickToCopy: true,
    enablePinProtection: true,
    enableColumnSorting: true,
    allowDuplicateExtensions: false,
    allowDuplicatePhones: false,
    viewMode: 'table'
  },
  fields: [
    { id: 'name', label: 'Name', type: 'text', visible: true, required: true, unique: false, sortable: true },
    { id: 'department', label: 'Department', type: 'text', visible: true, required: false, unique: false, sortable: true },
    { id: 'extension', label: 'Extension', type: 'text', visible: true, required: false, unique: false, sortable: true },
    { id: 'phone', label: 'Phone', type: 'text', visible: true, required: false, unique: false, sortable: false },
    { id: 'email', label: 'Email', type: 'email', visible: true, required: false, unique: false, sortable: false }
  ]
};

export function useConfig() {
  async function fetchConfig() {
    try {
      const data = await apiFetch('/config');
      if (!data || Object.keys(data).length === 0) {
        // STATE-1 FIX: Do NOT auto-save DEFAULT_CONFIG here. On a fresh install
        // (no PIN set yet), this saveConfig call would immediately 401 because
        // no auth token exists. The DevPanel first-save is the correct
        // initialization path. We just render with defaults in memory.
        config.value = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      } else {
        config.value = { 
          ...DEFAULT_CONFIG, 
          ...data, 
          theme: { ...DEFAULT_CONFIG.theme, ...(data.theme || {}) }, 
          features: { ...DEFAULT_CONFIG.features, ...(data.features || {}) },
          fields: data.fields || DEFAULT_CONFIG.fields
        };
      }
    } catch (e) {
      console.error("Failed to get config:", e);
      config.value = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
    return config.value;
  }

  async function saveConfig(newConfig) {
    // BUG-2 FIX: Deep-clone the incoming config before assigning to the global ref.
    // This prevents aliasing: if the caller mutates their local object afterwards
    // (e.g. DevPanel wiping PIN fields), it will not corrupt the global store.
    // BUG-2 FIX: Store previous value for rollback on network failure.
    const previous = config.value;
    const cloned = JSON.parse(JSON.stringify(newConfig));
    config.value = cloned;
    try {
      await apiFetch('/config', {
        method: 'POST',
        body: JSON.stringify(newConfig)
      });
    } catch (e) {
      // Rollback the optimistic update if the network request failed.
      config.value = previous;
      throw e;
    }
  }

  return { config, fetchConfig, saveConfig };
}

