<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Admin Login Screen -->
    <div v-if="!isUnlocked" class="bg-brand-surface border border-brand-main rounded-2xl p-6 shadow-sm max-w-md mx-auto text-center space-y-4">
      <div class="h-12 w-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto text-xl shadow-inner">
        <i class="fa-solid fa-lock"></i>
      </div>
      <div>
        <h2 class="text-xl font-bold text-brand-main">Admin Authentication</h2>
        <p class="text-sm text-brand-muted">Enter Admin PIN to manage the directory</p>
      </div>
      <form @submit.prevent="verifyPin" class="space-y-3">
        <input 
          type="password" 
          v-model="pinInput" 
          placeholder="Enter Admin PIN" 
          class="w-full px-4 py-2 rounded-xl border border-brand-main bg-brand-bg text-brand-main text-center focus:outline-none focus:ring-2 focus:ring-slate-500"
          autofocus
        />
        <button type="submit" class="w-full btn-primary shadow-sm">
          Unlock Directory
        </button>
      </form>
    </div>

    <!-- Admin Dashboard -->
    <div v-else class="space-y-6 animate-fade-in">
      <div class="bg-brand-surface border border-brand-main rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-brand-main flex items-center gap-2">
              <i class="fa-solid fa-address-book text-brand-primary"></i> Contact Management
            </h2>
            <p class="text-xs text-brand-muted mt-1">Add, edit, or remove contacts from the directory.</p>
          </div>
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <button @click="openAddModal" class="btn-primary flex-1 sm:flex-none shadow-sm text-sm">
              <i class="fa-solid fa-user-plus"></i> Add Contact
            </button>
            <button @click="lockPanel" class="btn-secondary flex-1 sm:flex-none text-sm text-red-600 hover:bg-red-50">
              <i class="fa-solid fa-lock"></i> Lock
            </button>
          </div>
        </div>

        <div class="flex flex-col md:flex-row items-center justify-between border-t border-brand-main pt-4 gap-4">
          <div class="relative w-full md:w-96">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
              <i class="fa-solid fa-magnifying-glass"></i>
            </div>
            <input 
              type="text" 
              v-model="rawSearchQuery"
              ref="searchInputRef"
              placeholder="Search..." 
              class="w-full pl-10 pr-4 py-2 rounded-xl border border-brand-main bg-brand-bg text-brand-main placeholder-brand-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition shadow-inner"
            />
          </div>
          <div class="flex items-center gap-2 w-full md:w-auto">
            <button @click="openManageDeptsModal" class="btn-secondary text-sm shadow-sm whitespace-nowrap hidden sm:block">
              <i class="fa-solid fa-users-gear"></i> Departments
            </button>
            <button @click="openManageDeptsModal" class="btn-secondary text-sm shadow-sm sm:hidden px-2">
              <i class="fa-solid fa-users-gear"></i>
            </button>
            <button v-if="selectedIds.length > 0" @click="confirmBulkDelete" class="btn-secondary text-red-600 text-sm hover:bg-red-50 border-red-200 whitespace-nowrap shrink-0">
              <i class="fa-solid fa-trash-can"></i> Delete ({{ selectedIds.length }})
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between border-t border-brand-main pt-3 text-xs text-brand-muted">
          <div class="flex items-center gap-2" aria-live="polite">
            <span>Showing:</span>
            <span class="font-semibold text-brand-main bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              {{ filteredContacts.length }} contacts
            </span>
          </div>
        </div>
      </div>

      <div class="bg-brand-surface border border-brand-main rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div class="overflow-x-auto">
          <table class="custom-table w-full">
            <thead>
              <tr>
                <th class="w-10 text-center border-r border-brand-main/20">
                  <input type="checkbox" @change="toggleAll" :checked="allSelected && paginatedContacts.length > 0" class="rounded text-brand-primary focus:ring-brand-primary bg-brand-surface border-brand-main">
                </th>
                <!-- A11Y-3 FIX: Wrap sortable header text in a <button> so keyboard
                     users can trigger sort with Enter/Space. Add aria-sort to communicate
                     current sort direction to screen readers. Non-sortable headers remain
                     plain text. -->
                <th v-for="field in visibleFields" :key="field.id"
                    class="text-left select-none"
                    :class="{'cursor-pointer': field.sortable}">
                  <template v-if="field.sortable">
                    <button
                      class="flex items-center gap-1.5 group w-full hover:text-brand-primary transition"
                      @click="sortBy(field.id)"
                      :aria-sort="sortKey === field.id ? (sortAsc ? 'ascending' : 'descending') : 'none'"
                    >
                      {{ field.label }}
                      <span class="text-xs transition-opacity" :class="sortKey === field.id ? 'text-brand-primary opacity-100' : 'text-brand-main opacity-30 group-hover:opacity-60'">
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
                    </button>
                  </template>
                  <template v-else>
                    <div class="flex items-center gap-1.5">{{ field.label }}</div>
                  </template>
                </th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody @click="handleTableClick">
              <!-- CSS-2 FIX: Use .row-selected class (defined in style.css with proper
                   specificity) so the selection highlight wins over the hover rule,
                   which previously used !important and defeated inline Tailwind classes. -->
              <tr v-for="contact in paginatedContacts" :key="contact.id" :class="{'row-selected': selectedIds.includes(contact.id)}">
                <td class="text-center border-r border-brand-main/20">
                  <input type="checkbox" v-model="selectedIds" :value="contact.id" class="rounded text-brand-primary focus:ring-brand-primary bg-brand-surface border-brand-main">
                </td>
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
                    <button v-if="field.copyable && contact[field.id]" @click.stop="copyToClipboard(contact[field.id])" class="text-brand-muted hover:text-brand-primary opacity-0 group-hover/copy:opacity-100 transition px-1 shrink-0" title="Copy value">
                      <i class="fa-regular fa-copy"></i>
                    </button>
                  </div>
                </td>
                <td class="text-right space-x-3">
                  <!-- BUG-1 FIX: pointer-events-none on <i> icons ensures e.target inside
                       handleTableClick is always the <button>, never the icon child. -->
                  <button data-action="duplicate" :data-id="contact.id" class="text-brand-muted hover:text-emerald-600 transition" title="Duplicate"><i class="fa-solid fa-copy pointer-events-none"></i></button>
                  <button data-action="edit" :data-id="contact.id" class="text-brand-muted hover:text-brand-primary transition" title="Edit"><i class="fa-solid fa-pen-to-square pointer-events-none"></i></button>
                  <button data-action="delete" :data-id="contact.id" class="text-brand-muted hover:text-red-500 transition" title="Delete"><i class="fa-solid fa-trash-can pointer-events-none"></i></button>
                </td>
              </tr>
              <tr v-if="filteredContacts.length === 0">
                <td :colspan="visibleFields.length + 2" class="text-center py-12 text-brand-muted">
                  No contacts found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination Controls -->
        <div v-if="totalPages > 1" class="border-t border-brand-main p-4 bg-brand-surface flex items-center justify-between">
          <button @click="prevPage" :disabled="currentPage === 1" class="px-3 py-1.5 rounded-lg border border-brand-main text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-brand-main">
            Previous
          </button>
          
          <!-- PERF-1 FIX: Only render a windowed range of page buttons (max 7),
               not one button per page, which would create O(n/10) DOM nodes. -->
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
    </div>

    <!-- Add/Edit Modal -->
    <!-- A11Y-5 FIX: role="dialog" + aria-modal="true" + aria-labelledby tells AT this
         is a dialog, confines the virtual cursor within it, and announces the title.
         The inner panel also receives autofocus via the first input (see :autofocus below). -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" @click="closeModal" aria-hidden="true"></div>
        <span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
        <div class="inline-block transform overflow-hidden rounded-2xl bg-brand-surface text-left align-bottom shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-xl sm:align-middle border border-brand-main">
          
          <div class="px-6 py-4 border-b border-brand-main bg-brand-bg flex items-center justify-between">
            <!-- id="modal-title" is referenced by aria-labelledby above -->
            <h3 id="modal-title" class="text-lg font-bold text-brand-main">{{ editingId ? 'Edit Contact' : 'Add New Contact' }}</h3>
            <button @click="closeModal" class="text-brand-muted hover:text-brand-main transition" aria-label="Close dialog"><i class="fa-solid fa-xmark text-lg" aria-hidden="true"></i></button>
          </div>

          <form @submit.prevent="saveContact">
            <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 max-h-[60vh] overflow-y-auto">
              <!-- A11Y-4 FIX: Associate each label to its input via for/id using
                   field.id as the unique identifier. Screen readers will now announce
                   the field label when the input receives focus. -->
              <div v-for="(field, index) in config?.fields" :key="field.id" class="space-y-1.5" :class="{'sm:col-span-2': field.id === 'notes'}">
                <label :for="'field-' + field.id" class="block text-sm font-semibold text-brand-main">
                  {{ field.label }} <span v-if="field.required" class="text-red-500" aria-label="required">*</span>
                </label>
                <input 
                  :id="'field-' + field.id"
                  :type="field.type" 
                  v-model="formData[field.id]" 
                  :required="field.required"
                  :autofocus="index === 0"
                  :list="field.id === 'department' ? 'dept-suggestions' : null"
                  class="w-full px-3 py-2 rounded-lg border border-brand-main bg-brand-bg text-brand-main text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                />
              </div>
            </div>
            
            <div class="px-6 py-4 bg-brand-bg border-t border-brand-main flex justify-end gap-3">
              <button type="button" @click="closeModal" class="btn-secondary shadow-sm text-sm" :disabled="isSaving">Cancel</button>
              <button type="submit" :disabled="isSaving" class="btn-primary shadow-sm text-sm disabled:opacity-50">
                <i v-if="isSaving" class="fa-solid fa-spinner fa-spin mr-1" aria-hidden="true"></i>
                <span v-if="isSaving" class="sr-only">Saving…</span>
                {{ editingId ? 'Save Changes' : 'Add Contact' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <datalist id="dept-suggestions">
      <option v-for="dept in uniqueDepartments" :key="dept" :value="dept"></option>
    </datalist>

    <!-- Manage Departments Modal -->
    <div v-if="showManageDeptsModal" class="fixed inset-0 z-[60] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="dept-modal-title">
      <div class="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" @click="closeManageDeptsModal" aria-hidden="true"></div>
        <span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
        <div class="inline-block transform overflow-hidden rounded-2xl bg-brand-surface text-left align-bottom shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:align-middle border border-brand-main">
          <div class="px-6 py-4 border-b border-brand-main bg-brand-bg flex items-center justify-between">
            <h3 id="dept-modal-title" class="text-lg font-bold text-brand-main">Manage Departments</h3>
            <button @click="closeManageDeptsModal" class="text-brand-muted hover:text-brand-main transition"><i class="fa-solid fa-xmark text-lg"></i></button>
          </div>
          <div class="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-3">
            <p class="text-xs text-brand-muted mb-4">Rename a department to instantly update all contacts that belong to it.</p>
            <div class="mb-4 pb-4 border-b border-brand-main space-y-2">
              <label class="block text-xs uppercase font-bold text-brand-muted">Add New Department</label>
              <div class="flex items-center gap-2">
                <input type="text" v-model="newDepartmentName" placeholder="Department Name" class="flex-1 px-3 py-1.5 rounded-lg border border-brand-main bg-brand-surface text-brand-main text-sm focus:ring-1 focus:ring-brand-primary" />
                <button @click="createNewDepartment" :disabled="!newDepartmentName.trim()" class="btn-secondary shadow-sm px-3 py-1.5 text-xs disabled:opacity-50 border-brand-main"><i class="fa-solid fa-plus mr-1"></i> Add</button>
              </div>
            </div>

            <div v-if="uniqueDepartments.length === 0" class="text-sm text-brand-muted text-center py-4">No departments found in directory.</div>
            
            <div v-for="dept in uniqueDepartments" :key="dept" class="flex items-center gap-2">
              <input type="text" v-model="deptEditValues[dept]" class="flex-1 px-3 py-1.5 rounded-lg border border-brand-main bg-brand-surface text-brand-main text-sm focus:ring-1 focus:ring-brand-primary" />
              <button @click="renameDepartmentAction(dept)" :disabled="deptEditValues[dept] === dept || !deptEditValues[dept]" class="btn-primary px-3 py-1.5 text-xs disabled:opacity-50">Rename</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useStorage } from '../composables/useStorage';
import { useToast } from '../composables/useToast';
import { apiFetch } from '../composables/api';

const { config, contacts, fetchContacts, addContact, updateContact, deleteContact, deleteContactsBulk, authPin, setAuthPin, verifyPinAPI } = useStorage();
const { success, error, info } = useToast();

const isUnlocked = ref(false);
const pinInput = ref('');
const isLoading = ref(true);
const isSaving = ref(false);
const showModal = ref(false);
const userRole = ref(null);
const editingId = ref(null);
const formData = ref({});

const showManageDeptsModal = ref(false);
const deptEditValues = ref({});
const newDepartmentName = ref('');

const uniqueDepartments = computed(() => {
  const depts = contacts.value.map(c => c.department).filter(Boolean);
  const customDepts = config.value?.customDepartments || [];
  return [...new Set([...depts, ...customDepts])].sort();
});

const rawSearchQuery = ref('');
const searchQuery = ref('');
const searchInputRef = ref(null);
const sortKey = ref('name');
const sortAsc = ref(true);

const currentPage = ref(1);
const itemsPerPage = ref(12);
const selectedIds = ref([]);

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
    // A11Y-2 FIX: Guard Escape against firing through an open modal.
    // When a modal is open, Escape should close it (standard dialog UX per ARIA
    // Authoring Practices §3.9) — not leak into the background and clear the search bar.
    if (showModal.value) {
      closeModal();
      return;
    }
    if (showManageDeptsModal.value) {
      closeManageDeptsModal();
      return;
    }
    rawSearchQuery.value = '';
    searchQuery.value = '';
    searchInputRef.value?.blur();
  }
}

// REL-1 FIX: Use a ref so the timer handle survives across re-renders and can
// be reliably cancelled in onUnmounted to prevent stale callbacks firing after
// the component is torn down during navigation.
const searchTimeout = ref(null);
watch(rawSearchQuery, (val) => {
  clearTimeout(searchTimeout.value);
  searchTimeout.value = setTimeout(() => {
    searchQuery.value = val;
  }, 300);
});

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown);
  if (authPin.value) {
    const role = await verifyPinAPI(authPin.value);
    if (role === 'admin' || role === 'dev') {
      userRole.value = role;
      isUnlocked.value = true;
      fetchContacts();
    }
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  // REL-1 FIX: Cancel any pending debounce timer to prevent stale reactive
  // writes to searchQuery after the component is unmounted during navigation.
  clearTimeout(searchTimeout.value);
});

async function verifyPin() {
  const role = await verifyPinAPI(pinInput.value);
  if (role === 'admin' || role === 'dev') {
    setAuthPin(pinInput.value);
    userRole.value = role;
    isUnlocked.value = true;
    pinInput.value = '';
    fetchContacts();
    success('Admin Panel unlocked.');
  } else {
    error('Incorrect Admin PIN. Try again.');
  }
}

function lockPanel() {
  setAuthPin('');
  isUnlocked.value = false;
  info('Panel locked.');
}

const visibleFields = computed(() => {
  return (config.value?.fields || []).filter(f => f.visible);
});

const filteredContacts = computed(() => {
  let result = contacts.value;
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

// PERF-1 FIX: Compute a windowed slice of page numbers (max 7 visible) centered
// on currentPage rather than rendering totalPages individual buttons.
const pagedRange = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const window = 7;
  if (total <= window) return Array.from({ length: total }, (_, i) => i + 1);
  const half = Math.floor(window / 2);
  let start = Math.max(1, current - half);
  let end = start + window - 1;
  if (end > total) { end = total; start = Math.max(1, end - window + 1); }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

const paginatedContacts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredContacts.value.slice(start, start + itemsPerPage.value);
});

watch(searchQuery, () => { currentPage.value = 1; });

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

const allSelected = computed(() => {
  return paginatedContacts.value.length > 0 && paginatedContacts.value.every(c => selectedIds.value.includes(c.id));
});

function toggleAll(e) {
  // Use a Set for O(1) lookups instead of O(n) .includes() inside a .filter()/.map().
  const pageIds = new Set(paginatedContacts.value.map(c => c.id));
  if (e.target.checked) {
    const selectedSet = new Set(selectedIds.value);
    pageIds.forEach(id => selectedSet.add(id));
    selectedIds.value = Array.from(selectedSet);
  } else {
    selectedIds.value = selectedIds.value.filter(id => !pageIds.has(id));
  }
}

function openAddModal() {
  editingId.value = null;
  formData.value = {};
  showModal.value = true;
}

function openEditModal(contact) {
  editingId.value = contact.id;
  formData.value = { ...contact };
  showModal.value = true;
}

function duplicateContact(contact) {
  editingId.value = null;
  formData.value = { ...contact };
  delete formData.value.id;
  showModal.value = true;
  info("Duplicated contact data. Ready to save.");
}

function closeModal() {
  showModal.value = false;
}

async function saveContact() {
  isSaving.value = true;
  try {
    if (editingId.value) {
      await updateContact(editingId.value, formData.value);
      success('Contact updated successfully!');
    } else {
      await addContact(formData.value);
      success('Contact added successfully!');
    }
    closeModal();
  } catch (err) {
    error(err.message === 'Unauthorized' ? 'Session expired.' : err.message);
  } finally {
    isSaving.value = false;
  }
}

async function confirmDelete(id) {
  if (confirm("Are you sure you want to delete this contact?")) {
    try {
      await deleteContact(id);
      selectedIds.value = selectedIds.value.filter(sid => sid !== id);
      success('Contact deleted successfully!');
    } catch (err) {
      error(err.message);
    }
  }
}

async function confirmBulkDelete() {
  if (confirm(`Are you sure you want to delete ${selectedIds.value.length} contacts?`)) {
    try {
      await deleteContactsBulk(selectedIds.value);
      selectedIds.value = [];
      success('Bulk delete successful!');
    } catch (err) {
      error(err.message);
    }
  }
}

function handleTableClick(e) {
  const target = e.target.closest('button[data-action]');
  if (!target) return;
  const action = target.getAttribute('data-action');
  const id = Number(target.getAttribute('data-id'));
  const contact = contacts.value.find(c => c.id === id);
  
  if (action === 'duplicate' && contact) {
    duplicateContact(contact);
  } else if (action === 'edit' && contact) {
    openEditModal(contact);
  } else if (action === 'delete') {
    confirmDelete(id);
  }
}

function openManageDeptsModal() {
  deptEditValues.value = {};
  uniqueDepartments.value.forEach(d => {
    deptEditValues.value[d] = d;
  });
  showManageDeptsModal.value = true;
}

function closeManageDeptsModal() {
  showManageDeptsModal.value = false;
}

async function renameDepartmentAction(oldName) {
  const newName = deptEditValues.value[oldName];
  if (!newName || newName === oldName) return;
  
  try {
    const res = await apiFetch('/departments/rename', {
      method: 'POST',
      body: JSON.stringify({ oldName, newName })
    });
    
    // Also rename in customDepartments if it exists there
    if (config.value.customDepartments && config.value.customDepartments.includes(oldName)) {
      const newConfig = JSON.parse(JSON.stringify(config.value));
      newConfig.customDepartments = newConfig.customDepartments.map(d => d === oldName ? newName : d);
      await apiFetch('/config', { method: 'POST', body: JSON.stringify(newConfig) });
      config.value.customDepartments = newConfig.customDepartments;
    }
    
    success(`Successfully updated ${res.count} contacts.`);
    await fetchContacts();
    deptEditValues.value[newName] = newName;
    delete deptEditValues.value[oldName];
  } catch (e) {
    error(e.message || 'Failed to rename department');
  }
}

async function createNewDepartment() {
  const dept = newDepartmentName.value.trim();
  if (!dept) return;
  
  const newConfig = JSON.parse(JSON.stringify(config.value));
  if (!newConfig.customDepartments) {
    newConfig.customDepartments = [];
  }
  if (!newConfig.customDepartments.includes(dept)) {
    newConfig.customDepartments.push(dept);
    try {
      await apiFetch('/config', {
        method: 'POST',
        body: JSON.stringify(newConfig)
      });
      config.value.customDepartments = newConfig.customDepartments;
      success('Department created!');
      newDepartmentName.value = '';
      
      // Auto-populate edit values for the new department
      deptEditValues.value[dept] = dept;
    } catch(err) {
      error(err.message || 'Failed to create department');
    }
  } else {
    info('Department already exists');
  }
}
</script>
