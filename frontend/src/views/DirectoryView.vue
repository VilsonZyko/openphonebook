<template>
  <section class="space-y-6">
    <div class="bg-brand-surface border border-brand-main rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="relative w-full md:w-96">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-muted">
            <i class="fa-solid fa-magnifying-glass"></i>
          </div>
          <input 
            type="text" 
            v-model="rawSearchQuery"
            ref="searchInputRef"
            placeholder="Search directory..." 
            class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-main bg-brand-bg text-brand-main placeholder-brand-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition shadow-inner"
          />
        </div>

        <div class="w-full md:w-64" v-if="hasDepartmentField">
          <select 
            v-model="selectedDepartment"
            class="w-full px-4 py-2.5 rounded-xl border border-brand-main bg-brand-bg text-brand-main text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition shadow-inner appearance-none cursor-pointer"
            :disabled="isLoading"
          >
            <option value="All">All Departments</option>
            <option v-for="dept in uniqueDepartments" :key="dept" :value="dept">
              {{ dept }}
            </option>
          </select>
        </div>
      </div>
      <div class="flex items-center justify-between border-t border-brand-main pt-3 text-xs text-brand-muted">
        <div class="flex items-center gap-2" aria-live="polite">
          <span>Showing:</span>
          <span class="font-semibold text-brand-main bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            {{ filteredContacts.length }} contacts
          </span>
        </div>
        <div class="flex items-center bg-brand-bg rounded-lg border border-brand-main p-0.5">
          <button @click="isGridView = false" :class="!isGridView ? 'bg-brand-surface shadow-sm text-brand-primary' : 'text-brand-muted hover:text-brand-main'" class="px-2 py-1 rounded-md transition" aria-label="List View" title="List View">
            <i class="fa-solid fa-list"></i>
          </button>
          <button @click="isGridView = true" :class="isGridView ? 'bg-brand-surface shadow-sm text-brand-primary' : 'text-brand-muted hover:text-brand-main'" class="px-2 py-1 rounded-md transition" aria-label="Grid View" title="Grid View">
            <i class="fa-solid fa-border-all"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Directory Table / Grid -->
    <div class="bg-brand-surface border border-brand-main rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <template v-if="!isGridView">
        <div class="overflow-x-auto">
        <table class="custom-table w-full">
          <thead>
            <tr>
              <th v-for="field in visibleFields" :key="field.id" 
                  class="text-left select-none group" 
                  :class="{'cursor-pointer hover:text-brand-primary': field.sortable}"
                  @click="field.sortable ? sortBy(field.id) : null">
                <div class="flex items-center gap-1.5">
                  {{ field.label }}
                  <span v-if="field.sortable" class="text-xs transition-opacity" :class="sortKey === field.id ? 'text-brand-primary opacity-100' : 'text-brand-main opacity-30 group-hover:opacity-60'">
                    <template v-if="field.type === 'number' || field.id === 'extension' || field.id === 'phone'">
                      <i class="fa-solid fa-arrow-down-1-9" v-if="sortKey === field.id && sortAsc"></i>
                      <i class="fa-solid fa-arrow-up-9-1" v-else-if="sortKey === field.id && !sortAsc"></i>
                      <i class="fa-solid fa-sort" v-else></i>
                    </template>
                    <template v-else>
                      <i class="fa-solid fa-arrow-down-a-z" v-if="sortKey === field.id && sortAsc"></i>
                      <i class="fa-solid fa-arrow-up-z-a" v-else-if="sortKey === field.id && !sortAsc"></i>
                      <i class="fa-solid fa-sort" v-else></i>
                    </template>
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- Skeleton Loader -->
            <template v-if="isLoading">
              <tr v-for="n in itemsPerPage" :key="'skeleton-'+n" class="animate-pulse">
                <td v-for="field in visibleFields" :key="field.id" class="py-4 px-4">
                  <div class="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4"></div>
                </td>
              </tr>
            </template>

            <!-- Real Data -->
            <template v-else>
              <tr v-for="contact in paginatedContacts" :key="contact.id">
                <td v-for="field in visibleFields" :key="field.id">
                  <div class="flex items-center gap-2 group/copy min-w-0">
                    <div class="truncate">
                      <template v-if="field.type === 'email' && contact[field.id]">
                        <a :href="'mailto:'+contact[field.id]" class="text-brand-primary hover:underline">{{ contact[field.id] }}</a>
                      </template>
                      <template v-else-if="field.id === 'department' && contact[field.id]">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                          {{ contact[field.id] }}
                        </span>
                      </template>
                      <template v-else-if="field.id === 'name'"><span class="font-semibold">{{ contact[field.id] || '-' }}</span></template>
                      <template v-else>{{ contact[field.id] || '-' }}</template>
                    </div>
                    <button v-if="field.copyable && contact[field.id]" @click="copyToClipboard(contact[field.id])" class="text-brand-muted hover:text-brand-primary opacity-0 group-hover/copy:opacity-100 transition px-1 shrink-0" title="Copy value">
                      <i class="fa-regular fa-copy"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredContacts.length === 0">
                <td :colspan="visibleFields.length" class="text-center py-12 text-brand-muted">
                  <i class="fa-solid fa-folder-open text-3xl mb-3 opacity-50 block"></i>
                  No contacts found matching your criteria.
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      </template>

      <!-- Grid View -->
      <template v-else>
        <div class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-brand-surface">
          <!-- Skeleton Loader for Grid -->
          <template v-if="isLoading">
            <div v-for="n in itemsPerPage" :key="'grid-skel-'+n" class="border border-brand-main rounded-xl p-4 space-y-3 animate-pulse bg-brand-bg">
              <div class="h-5 bg-slate-200 dark:bg-slate-700/50 rounded w-1/2"></div>
              <div class="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-full"></div>
              <div class="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4"></div>
            </div>
          </template>
          
          <!-- Real Data Grid -->
          <template v-else>
            <div v-for="contact in paginatedContacts" :key="contact.id" class="border border-brand-main rounded-xl p-4 bg-brand-bg hover:shadow-md transition group flex flex-col gap-3">
              <div v-for="field in visibleFields" :key="field.id" class="flex flex-col">
                <span 
                  class="text-[10px] uppercase font-bold tracking-wider mb-0.5 flex items-center gap-1 w-max"
                  :class="field.copyable && contact[field.id] ? 'text-brand-primary cursor-pointer hover:underline' : 'text-brand-muted'"
                  :title="field.copyable && contact[field.id] ? 'Click to copy' : ''"
                  @click="field.copyable && contact[field.id] ? copyToClipboard(contact[field.id]) : null"
                >
                  {{ field.label }} <i v-if="field.copyable && contact[field.id]" class="fa-regular fa-copy"></i>
                </span>
                <template v-if="field.type === 'email' && contact[field.id]">
                  <a :href="'mailto:'+contact[field.id]" class="text-sm text-brand-primary hover:underline break-all">{{ contact[field.id] }}</a>
                </template>
                <template v-else-if="field.id === 'department' && contact[field.id]">
                  <div>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                      {{ contact[field.id] }}
                    </span>
                  </div>
                </template>
                <template v-else-if="field.id === 'name'">
                  <span class="text-base font-bold text-brand-main truncate">{{ contact[field.id] || '-' }}</span>
                </template>
                <template v-else>
                  <span class="text-sm text-brand-main truncate">{{ contact[field.id] || '-' }}</span>
                </template>
              </div>
            </div>
          </template>
        </div>
        <div v-if="!isLoading && filteredContacts.length === 0" class="text-center py-12 text-brand-muted bg-brand-surface border-t border-brand-main">
          <i class="fa-solid fa-folder-open text-3xl mb-3 opacity-50 block"></i>
          No contacts found matching your criteria.
        </div>
      </template>

      <!-- Pagination Controls -->
      <div v-if="!isLoading && totalPages > 1" class="border-t border-brand-main p-4 bg-brand-surface flex items-center justify-between">
        <button @click="prevPage" :disabled="currentPage === 1" class="px-3 py-1.5 rounded-lg border border-brand-main text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-brand-main">
          Previous
        </button>
        
        <!-- PERF-1 FIX: Windowed page range — renders at most 7 buttons. -->
        <div class="flex gap-1">
          <button v-for="p in pagedRange" :key="p" @click="currentPage = p" 
            class="w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition"
            :class="currentPage === p ? 'bg-brand-primary text-white' : 'text-brand-main hover:bg-slate-100 dark:hover:bg-slate-800'">
            {{ p }}
          </button>
        </div>

        <button @click="nextPage" :disabled="currentPage === totalPages" class="px-3 py-1.5 rounded-lg border border-brand-main text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-brand-main">
          Next
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useStorage } from '../composables/useStorage';
import { useToast } from '../composables/useToast';

const { config, contacts, fetchContacts } = useStorage();
const { success, error } = useToast();

const isLoading = ref(true);
const rawSearchQuery = ref('');
const searchQuery = ref('');
const selectedDepartment = ref('All');
const searchInputRef = ref(null);

const isGridView = ref(localStorage.getItem('openphonebook-view-mode') === 'grid');
watch(isGridView, (val) => {
  localStorage.setItem('openphonebook-view-mode', val ? 'grid' : 'list');
});

const sortKey = ref('name');
const sortAsc = ref(true);

const currentPage = ref(1);
const itemsPerPage = ref(12);

async function copyToClipboard(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(String(text));
    success('Copied to clipboard!');
  } catch (err) {
    error('Failed to copy');
  }
}

function handleKeydown(e) {
  const activeTag = document.activeElement?.tagName.toLowerCase();
  const isInteractiveFocused = ['input', 'textarea', 'select', 'button'].includes(activeTag);

  if (e.key === 'Enter' && !isInteractiveFocused) {
    e.preventDefault();
    searchInputRef.value?.focus();
  } else if (e.key === 'Escape') {
    rawSearchQuery.value = '';
    searchQuery.value = '';
    selectedDepartment.value = 'All';
    searchInputRef.value?.blur();
  }
}

// REL-1 FIX: Use a ref for the timer handle so onUnmounted can reliably cancel it.
const searchTimeout = ref(null);
watch(rawSearchQuery, (val) => {
  clearTimeout(searchTimeout.value);
  searchTimeout.value = setTimeout(() => {
    searchQuery.value = val;
  }, 300);
});

onMounted(async () => {
  isLoading.value = true;
  window.addEventListener('keydown', handleKeydown);
  // GET /api/contacts is a public endpoint — no auth check needed here.
  await fetchContacts();
  setTimeout(() => {
    isLoading.value = false;
  }, 200);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  // REL-1 FIX: Cancel pending debounce timer on unmount.
  clearTimeout(searchTimeout.value);
});

const visibleFields = computed(() => {
  return (config.value?.fields || []).filter(f => f.visible);
});

const hasDepartmentField = computed(() => {
  return visibleFields.value.some(f => f.id === 'department');
});

watch([searchQuery, selectedDepartment], () => {
  currentPage.value = 1;
});

const uniqueDepartments = computed(() => {
  const depts = new Set();
  contacts.value.forEach(c => {
    if (c.department) depts.add(c.department);
  });
  return Array.from(depts).sort();
});

const filteredContacts = computed(() => {
  let result = contacts.value;

  if (hasDepartmentField.value && selectedDepartment.value !== 'All') {
    result = result.filter(c => c.department === selectedDepartment.value);
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(c => {
      return (config.value?.fields || []).some(f => c[f.id] && String(c[f.id]).toLowerCase().includes(q));
    });
  }

  if (sortKey.value) {
    result = [...result].sort((a, b) => {
      const valA = String(a[sortKey.value] || '').toLowerCase();
      const valB = String(b[sortKey.value] || '').toLowerCase();
      
      if (valA === valB) return 0;
      return sortAsc.value 
        ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
        : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  return result;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredContacts.value.length / itemsPerPage.value)));

// PERF-1 FIX: Windowed pagination — renders at most 7 page buttons regardless of dataset size.
const pagedRange = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const winSize = 7;
  if (total <= winSize) return Array.from({ length: total }, (_, i) => i + 1);
  const half = Math.floor(winSize / 2);
  let start = Math.max(1, current - half);
  let end = start + winSize - 1;
  if (end > total) { end = total; start = Math.max(1, end - winSize + 1); }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

const paginatedContacts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredContacts.value.slice(start, start + itemsPerPage.value);
});

function prevPage() { if (currentPage.value > 1) currentPage.value--; }
function nextPage() { if (currentPage.value < totalPages.value) currentPage.value++; }

function sortBy(key) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value;
  } else {
    sortKey.value = key;
    sortAsc.value = true;
  }
}
</script>
