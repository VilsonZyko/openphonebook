<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Dev Login Screen -->
    <div v-if="!isUnlocked" class="bg-brand-surface border border-brand-main rounded-2xl p-6 shadow-sm max-w-md mx-auto text-center space-y-4">

      <!-- First-time setup: no PIN has been configured yet -->
      <template v-if="isBootstrap">
        <div class="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-xl shadow-inner">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-brand-main">First-Time Setup</h2>
          <p class="text-sm text-brand-muted mt-1">No credentials have been configured yet. Set your Admin and Dev PINs below to secure this installation.</p>
        </div>
        <button @click="isUnlocked = true" class="w-full btn-primary bg-amber-600 hover:bg-amber-700">
          <i class="fa-solid fa-key"></i> Configure Credentials
        </button>
      </template>

      <!-- Normal PIN-gated login -->
      <template v-else>
        <div class="h-12 w-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto text-xl shadow-inner">
          <i class="fa-solid fa-code"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-brand-main">Developer Portal</h2>
          <p class="text-sm text-brand-muted">Enter Dev PIN to configure system</p>
        </div>
        <form @submit.prevent="verifyPin" class="space-y-3">
          <input 
            type="password" 
            v-model="pinInput"
            placeholder="Enter Dev PIN" 
            class="w-full px-4 py-2 rounded-xl border border-brand-main bg-brand-bg text-brand-main text-center focus:outline-none focus:ring-2 focus:ring-slate-500"
            autofocus
          />
          <button type="submit" class="w-full btn-primary">
            Unlock System
          </button>
        </form>
      </template>

    </div>

    <!-- Dev Dashboard -->
    <div v-else class="space-y-6 animate-fade-in pb-24">

          <!-- First-time setup reminder banner -->
          <div v-if="!config?.isConfigured" class="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex gap-4">
          <i class="fa-solid fa-triangle-exclamation text-amber-600 text-2xl mt-1"></i>
          <div>
            <h2 class="text-amber-800 font-bold text-lg mb-1">First-Time Setup</h2>
            <p class="text-amber-700 text-sm">Welcome to OpenPhonebook. To secure your installation, please set an <strong>Admin PIN</strong> and a <strong>Dev PIN</strong> below. Other settings are disabled until security is configured.</p>
          </div>
        </div>

          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-brand-main">Developer Portal</h2>
              <p class="text-sm text-brand-muted">Manage system configuration and architecture</p>
            </div>
            <button @click="lockPanel" class="btn-secondary text-sm text-red-600 hover:bg-red-50">
              <i class="fa-solid fa-lock"></i> Lock
            </button>
          </div>

      <div v-if="localConfig" class="bg-brand-surface border border-brand-main rounded-2xl p-5 shadow-sm space-y-8">
        
        <!-- General Configuration -->
        <section class="space-y-4" :class="{'opacity-50 pointer-events-none': !config?.isConfigured}">
          <h3 class="text-lg font-bold text-brand-main border-b border-brand-main pb-2">General Configuration</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="block text-sm font-semibold text-brand-main">Site Title</label>
              <input type="text" v-model="localConfig.siteTitle" class="w-full px-3 py-2 rounded-lg border border-brand-main bg-brand-bg text-brand-main text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div class="space-y-1.5">
              <label class="block text-sm font-semibold text-brand-main">Site Tagline</label>
              <input type="text" v-model="localConfig.siteTagline" class="w-full px-3 py-2 rounded-lg border border-brand-main bg-brand-bg text-brand-main text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div class="space-y-1.5 sm:col-span-2 border-t border-brand-main pt-3 mt-1">
              <label class="block text-sm font-semibold text-brand-main">Custom Brand Icon (Favicon & Logo)</label>
              <div class="flex items-center gap-3">
                <input type="file" accept="image/*" @change="handleFileUpload" class="w-full text-sm text-brand-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-surface file:text-brand-primary hover:file:bg-brand-bg cursor-pointer" />
                <button @click="localConfig.brandIcon = null" :disabled="!localConfig.brandIcon" class="btn-secondary text-xs text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
                  <i class="fa-solid fa-rotate-left"></i> Restore Default
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Security Configuration -->
        <section class="space-y-4">
          <div class="flex items-center justify-between border-b border-brand-main pb-2">
            <div>
              <h3 class="text-lg font-bold text-brand-main"><i class="fa-solid fa-lock text-brand-primary mr-2"></i>Security Configuration</h3>
              <p class="text-sm text-brand-muted mt-1">Manage system access credentials</p>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="space-y-1.5">
              <label class="block text-sm font-semibold text-brand-main">Admin PIN</label>
              <input type="password" v-model="localConfig.adminPin" placeholder="Enter new Admin PIN" class="w-full px-3 py-2 rounded-lg border border-brand-main bg-brand-bg text-brand-main text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary font-mono" />
            </div>
            <div class="space-y-1.5">
              <label class="block text-sm font-semibold text-brand-main">Dev PIN</label>
              <input type="password" v-model="localConfig.devPin" placeholder="Enter new Dev PIN" class="w-full px-3 py-2 rounded-lg border border-brand-main bg-brand-bg text-brand-main text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary font-mono" />
            </div>
          </div>
        </section>

        <!-- Theming Engine -->
        <section class="space-y-4 mt-8" :class="{'opacity-50 pointer-events-none': !config?.isConfigured}">
          <div class="flex items-center justify-between border-b border-brand-main pb-2">
            <div>
              <h3 class="text-lg font-bold text-brand-main"><i class="fa-solid fa-palette text-brand-primary mr-2"></i>Theming Engine</h3>
              <p class="text-sm text-brand-muted mt-1">Customize the visual appearance of the application</p>
            </div>
            <button @click="restoreDefaultTheme" class="btn-secondary text-xs text-red-600 border-red-200 hover:bg-red-50">
              <i class="fa-solid fa-rotate-left"></i> Reset Theme Colors
            </button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-brand-main">Primary</label>
              <div class="flex items-center gap-2">
                <input type="color" v-model="localConfig.theme.primaryColor" class="h-8 w-10 cursor-pointer rounded border border-brand-main" />
                <span class="text-xs uppercase text-brand-muted font-mono">{{ localConfig.theme.primaryColor }}</span>
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-brand-main">Background</label>
              <div class="flex items-center gap-2">
                <input type="color" v-model="localConfig.theme.bgColor" class="h-8 w-10 cursor-pointer rounded border border-brand-main" />
                <span class="text-xs uppercase text-brand-muted font-mono">{{ localConfig.theme.bgColor }}</span>
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-brand-main">Surface</label>
              <div class="flex items-center gap-2">
                <input type="color" v-model="localConfig.theme.surfaceColor" class="h-8 w-10 cursor-pointer rounded border border-brand-main" />
                <span class="text-xs uppercase text-brand-muted font-mono">{{ localConfig.theme.surfaceColor }}</span>
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-brand-main">Text</label>
              <div class="flex items-center gap-2">
                <input type="color" v-model="localConfig.theme.textColor" class="h-8 w-10 cursor-pointer rounded border border-brand-main" />
                <span class="text-xs uppercase text-brand-muted font-mono">{{ localConfig.theme.textColor }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Schema Editor -->
        <section class="space-y-4" :class="{'opacity-50 pointer-events-none': !config?.isConfigured}">
          <div class="flex items-center justify-between border-b border-brand-main pb-2">
            <h3 class="text-lg font-bold text-brand-main">Schema Editor</h3>
            <button @click="addField" class="btn-secondary text-xs shadow-sm">
              <i class="fa-solid fa-plus"></i> Add Field
            </button>
          </div>
          <p class="text-xs text-brand-muted -mt-2 mb-4">Define the schema-less data model. These fields drive the Directory tables and Admin forms.</p>
          
          <div class="space-y-3">
            <div v-for="(field, index) in localConfig.fields" :key="index" class="bg-brand-bg border border-brand-main rounded-xl p-4 shadow-inner space-y-3 relative group">
              <div class="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button @click="moveField(index, -1)" :disabled="index === 0" class="p-1 text-brand-primary hover:scale-110 transition-transform disabled:opacity-20 text-xl font-bold"><i class="fa-solid fa-caret-up"></i></button>
                <button @click="moveField(index, 1)" :disabled="index === localConfig.fields.length - 1" class="p-1 text-brand-primary hover:scale-110 transition-transform disabled:opacity-20 text-xl font-bold"><i class="fa-solid fa-caret-down"></i></button>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 col-span-3">
                <div class="space-y-1">
                  <label class="block text-[0.65rem] uppercase font-bold text-brand-muted">ID (Internal)</label>
                  <input type="text" v-model="field.id" class="w-full px-2 py-1.5 rounded-md border border-brand-main bg-brand-surface text-brand-main text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary font-mono" placeholder="e.g. shoe_size" :disabled="['name','department'].includes(field.id)"/>
                </div>
                <div class="space-y-1">
                  <label class="block text-[0.65rem] uppercase font-bold text-brand-muted">Display Label</label>
                  <input type="text" v-model="field.label" class="w-full px-2 py-1.5 rounded-md border border-brand-main bg-brand-surface text-brand-main text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary" placeholder="e.g. Shoe Size" />
                </div>
                <div class="space-y-1">
                  <label class="block text-[0.65rem] uppercase font-bold text-brand-muted">Data Type</label>
                  <select v-model="field.type" class="w-full px-2 py-1.5 rounded-md border border-brand-main bg-brand-surface text-brand-main text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary">
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="tel">Phone (Tel)</option>
                    <option value="url">URL / Link</option>
                  </select>
                </div>
                <div class="space-y-1.5 flex flex-col justify-center sm:pl-4">
                  <label class="flex items-center gap-2 cursor-pointer text-brand-main hover:text-brand-primary transition">
                    <input type="checkbox" v-model="field.visible" class="rounded text-brand-primary focus:ring-brand-primary bg-brand-surface border-brand-main">
                    <span class="text-xs font-semibold">Visible in Directory</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer text-brand-main hover:text-brand-primary transition">
                    <input type="checkbox" v-model="field.required" class="rounded text-brand-primary focus:ring-brand-primary bg-brand-surface border-brand-main">
                    <span class="text-xs font-semibold">Required Field</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer text-brand-main hover:text-brand-primary transition">
                    <input type="checkbox" v-model="field.unique" class="rounded text-brand-primary focus:ring-brand-primary bg-brand-surface border-brand-main">
                    <span class="text-xs font-semibold">Must be Unique</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer text-brand-main hover:text-brand-primary transition">
                    <input type="checkbox" v-model="field.sortable" class="rounded text-brand-primary focus:ring-brand-primary bg-brand-surface border-brand-main">
                    <span class="text-xs font-semibold">Sortable</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer text-brand-main hover:text-brand-primary transition">
                    <input type="checkbox" v-model="field.copyable" class="rounded text-brand-primary focus:ring-brand-primary bg-brand-surface border-brand-main">
                    <span class="text-xs font-semibold" title="Clicking the label in the directory copies the value">Click to Copy</span>
                  </label>
                </div> <div class="flex-grow"></div>
                <button @click="removeField(index)" class="text-xs text-red-500 hover:text-red-700 font-semibold" v-if="!['name','department'].includes(field.id)">
                  <i class="fa-solid fa-trash-can"></i> Remove
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Database Import -->
        <section class="space-y-4" :class="{'opacity-50 pointer-events-none': !config?.isConfigured}">
          <div class="flex items-center justify-between border-b border-brand-main pb-2">
            <div>
              <h3 class="text-lg font-bold text-brand-main"><i class="fa-solid fa-file-import text-brand-primary mr-2"></i>Database Import</h3>
              <p class="text-sm text-brand-muted mt-1">Bulk load contacts from JSON, CSV, or vCard formats</p>
            </div>
          </div>
          
          <div class="bg-brand-bg border border-brand-main rounded-xl p-5 shadow-inner space-y-4">
            <div class="flex items-center gap-4">
              <input type="file" id="importFileInput" accept=".json,.csv,.vcf" @change="handleImportFileSelect" class="w-full text-sm text-brand-muted file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-surface file:text-brand-primary hover:file:bg-brand-main hover:file:text-brand-bg cursor-pointer transition-colors" />
              <button @click="analyzeImport" :disabled="!importFile" class="btn-secondary whitespace-nowrap disabled:opacity-50">
                <i class="fa-solid fa-microscope"></i> Analyze File
              </button>
            </div>
            
            <div v-if="importError" class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              <i class="fa-solid fa-circle-exclamation mr-1"></i> {{ importError }}
            </div>
            
            <div v-if="importResults" class="p-4 bg-brand-surface rounded-lg border border-brand-main space-y-4 animate-fade-in">
              <div class="grid grid-cols-3 gap-4 text-center">
                <div class="p-3 bg-brand-bg rounded-lg border border-brand-main">
                  <div class="text-2xl font-bold text-brand-main">{{ importResults.total }}</div>
                  <div class="text-[0.65rem] uppercase font-bold text-brand-muted">Total Found</div>
                </div>
                <div class="p-3 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
                  <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ importResults.validCount }}</div>
                  <div class="text-[0.65rem] uppercase font-bold text-green-700 dark:text-green-500">Valid (Ready)</div>
                </div>
                <div class="p-3 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                  <div class="text-2xl font-bold text-red-600 dark:text-red-400">{{ importResults.invalidCount }}</div>
                  <div class="text-[0.65rem] uppercase font-bold text-red-700 dark:text-red-500">Invalid (Skipped)</div>
                </div>
              </div>
              
              <div class="flex items-center justify-between pt-2">
                <p class="text-xs text-brand-muted max-w-md">Invalid records are missing required fields. We will automatically skip them and only import the {{ importResults.validCount }} valid records to prevent transaction failure.</p>
                <button @click="executeImport" :disabled="importResults.validCount === 0 || isImporting" class="btn-primary px-6">
                  <i class="fa-solid fa-cloud-arrow-up" v-if="!isImporting"></i>
                  <i class="fa-solid fa-spinner fa-spin" v-else></i>
                  {{ isImporting ? 'Importing...' : 'Execute Import' }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Database Export -->
        <section class="space-y-4" :class="{'opacity-50 pointer-events-none': !config?.isConfigured}">
          <div class="flex items-center justify-between border-b border-brand-main pb-2">
            <div>
              <h3 class="text-lg font-bold text-brand-main"><i class="fa-solid fa-file-export text-brand-primary mr-2"></i>Database Export</h3>
              <p class="text-sm text-brand-muted mt-1">Export all contacts to JSON, CSV, or vCard formats</p>
            </div>
          </div>
          
          <div class="bg-brand-bg border border-brand-main rounded-xl p-5 shadow-inner flex flex-wrap gap-4">
            <button @click="exportData('json')" class="btn-secondary shadow-sm px-6">
              <i class="fa-solid fa-file-code mr-1"></i> JSON
            </button>
            <button @click="exportData('csv')" class="btn-secondary shadow-sm px-6">
              <i class="fa-solid fa-file-csv mr-1"></i> CSV
            </button>
            <button @click="exportData('vcf')" class="btn-secondary shadow-sm px-6">
              <i class="fa-solid fa-address-card mr-1"></i> vCard
            </button>
          </div>
        </section>
      </div>

      <!-- Floating Action Bar for Save -->
      <div class="fixed bottom-0 left-0 right-0 bg-brand-surface border-t border-brand-main p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-end z-40 transition-colors">
        <div class="max-w-4xl mx-auto w-full flex justify-end">
          <button @click="save" class="btn-primary shadow-lg px-8 py-3 text-base font-bold flex items-center justify-center gap-2">
            <i class="fa-solid fa-floppy-disk"></i> Save Configuration
            <span class="ml-2 text-[0.65rem] bg-white/20 text-white px-2 py-0.5 rounded-md opacity-90 border border-white/20 hidden sm:inline-block tracking-wider">CTRL + ENTER</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStorage } from '../composables/useStorage';
import { useToast } from '../composables/useToast';

const { config, saveConfig, authPin, setAuthPin, verifyPinAPI, contacts, fetchContacts } = useStorage();
const { success, error, info } = useToast();

const isUnlocked = ref(false);
const pinInput = ref('');
const localConfig = ref(null);

const importFile = ref(null);
const importResults = ref(null);
const importError = ref('');
const isImporting = ref(false);

function handleImportFileSelect(event) {
  importFile.value = event.target.files[0];
  importResults.value = null;
  importError.value = '';
}

// Basic CSV parser to avoid extra dependencies
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];
  const headerLine = lines[0];
  const parseLine = (line) => {
    const re = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    return line.split(re).map(x => x.replace(/^"|"$/g, '').trim());
  };
  const headers = parseLine(headerLine).map(h => h.toLowerCase());
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      if (values[idx] !== undefined) obj[h] = values[idx];
    });
    results.push(obj);
  }
  return results;
}

// Basic vCard parser
function parseVCard(text) {
  const cards = text.split(/BEGIN:VCARD/i);
  const results = [];
  for (const card of cards) {
    if (!card.trim()) continue;
    const obj = {};
    const lines = card.split(/\r?\n/);
    for (const line of lines) {
      const upper = line.toUpperCase();
      if (upper.startsWith('FN:')) obj.name = line.substring(3).trim();
      else if (upper.startsWith('ORG:')) obj.department = line.substring(4).trim();
      else if (upper.startsWith('TEL') && line.includes(':')) obj.phone = line.substring(line.indexOf(':') + 1).trim();
      else if (upper.startsWith('EMAIL') && line.includes(':')) obj.email = line.substring(line.indexOf(':') + 1).trim();
    }
    if (obj.name) results.push(obj);
  }
  return results;
}

async function analyzeImport() {
  if (!importFile.value) return;
  const file = importFile.value;
  const text = await file.text();
  let data = [];
  try {
    const name = file.name.toLowerCase();
    if (name.endsWith('.json')) data = JSON.parse(text);
    else if (name.endsWith('.csv')) data = parseCSV(text);
    else if (name.endsWith('.vcf')) data = parseVCard(text);
    else throw new Error("Unsupported file type. Please use .json, .csv, or .vcf");
    
    if (!Array.isArray(data)) throw new Error("Data must be an array of records.");
    
    const fields = localConfig.value.fields;
    const validData = [];
    let invalidCount = 0;
    
    for (const record of data) {
      let isValid = true;
      for (const field of fields) {
        if (field.required && !record[field.id]) {
          isValid = false;
          break;
        }
      }
      
      if (!isValid && !record.extension) {
        let hasReq = true;
        for (const field of fields) {
           if (field.id !== 'extension' && field.required && !record[field.id]) hasReq = false;
        }
        if (hasReq) {
           record.extension = 'EXT' + Math.floor(1000 + Math.random() * 9000);
           isValid = true;
        }
      }
      
      if (isValid) validData.push(record);
      else invalidCount++;
    }
    
    importResults.value = { validData, validCount: validData.length, invalidCount, total: data.length };
  } catch (err) {
    importError.value = "Error parsing file: " + err.message;
  }
}

async function executeImport() {
  if (!importResults.value || importResults.value.validCount === 0) return;
  isImporting.value = true;
  try {
    const res = await fetch('/api/contacts/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Auth-PIN': authPin.value },
      body: JSON.stringify({ contacts: importResults.value.validData })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Import failed');
    success(`Successfully imported ${json.count} contacts!`);
    importFile.value = null;
    importResults.value = null;
    const input = document.getElementById('importFileInput');
    if (input) input.value = '';
  } catch (err) {
    error(err.message);
  } finally {
    isImporting.value = false;
  }
}

async function exportData(format) {
  await fetchContacts();
  const data = contacts.value;
  if (!data || data.length === 0) {
    info("No contacts to export.");
    return;
  }

  let content = '';
  let mimeType = '';
  let extension = format;

  if (format === 'json') {
    // Strip internal properties to match the clean import format
    const cleanData = data.map(({ id, createdAt, updatedAt, ...rest }) => rest);
    content = JSON.stringify(cleanData, null, 2);
    mimeType = 'application/json';
  } else if (format === 'csv') {
    const fields = localConfig.value.fields || [];
    const headers = fields.map(f => f.id);
    const headerRow = headers.map(h => `"${h}"`).join(',');
    const rows = data.map(record => {
      return headers.map(h => {
        let val = record[h] || '';
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      }).join(',');
    });
    content = [headerRow, ...rows].join('\n');
    mimeType = 'text/csv';
  } else if (format === 'vcf') {
    content = data.map(record => {
      let vcard = 'BEGIN:VCARD\r\nVERSION:3.0\r\n';
      if (record.name) vcard += `FN:${record.name}\r\n`;
      if (record.department) vcard += `ORG:${record.department}\r\n`;
      if (record.phone) vcard += `TEL:${record.phone}\r\n`;
      if (record.email) vcard += `EMAIL:${record.email}\r\n`;
      vcard += 'END:VCARD';
      return vcard;
    }).join('\r\n\r\n');
    mimeType = 'text/vcard';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `openphonebook_export_${dateStr}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  success(`Exported ${data.length} contacts as ${format.toUpperCase()}`);
}

// isBootstrap is true when the server has never had a PIN configured.
// In this state the Dev Portal auto-unlocks into a first-time setup flow.
const isBootstrap = computed(() => config.value?.isConfigured === false);

watch(config, (newVal) => {
  if (newVal) {
    localConfig.value = JSON.parse(JSON.stringify(newVal));
  }
}, { immediate: true });

function handleKeydown(e) {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    if (isUnlocked.value || isBootstrap.value) {
      save();
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  // Auto-unlock for bootstrap (no PIN configured) OR stored valid PIN.
  // isBootstrap is also watched below for the case where config loads async
  // after onMounted fires.
  if (isBootstrap.value) {
    isUnlocked.value = true;
    return;
  }
  if (authPin.value) {
    verifyPinAPI(authPin.value).then(role => {
      if (role === 'dev') {
        isUnlocked.value = true;
      }
    });
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

// Reactive auto-unlock: config arrives asynchronously from fetchConfig().
// If bootstrap is detected after onMounted runs, unlock immediately.
watch(isBootstrap, (val) => {
  if (val) isUnlocked.value = true;
});

async function verifyPin() {
  const role = await verifyPinAPI(pinInput.value);
  if (role === 'dev') {
    setAuthPin(pinInput.value);
    isUnlocked.value = true;
    pinInput.value = '';
    success('Dev Panel unlocked.');
  } else {
    error('Incorrect Dev PIN. Try again.');
  }
}

function lockPanel() {
  setAuthPin('');
  isUnlocked.value = false;
  info('Dev Panel locked.');
}

function addField() {
  if (!localConfig.value.fields) localConfig.value.fields = [];
  localConfig.value.fields.push({
    id: 'new_field_' + Date.now(),
    label: 'New Field',
    type: 'text',
    visible: true,
    required: false,
    unique: false,
    sortable: true
  });
  info('New field added to the bottom of the schema.');
  setTimeout(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, 100);
}

function removeField(index) {
  if (confirm("Remove this field from the schema? This will hide it from the UI, but data in the DB will be retained.")) {
    localConfig.value.fields.splice(index, 1);
  }
}

function moveField(index, dir) {
  if (index + dir < 0 || index + dir >= localConfig.value.fields.length) return;
  const temp = localConfig.value.fields[index];
  localConfig.value.fields[index] = localConfig.value.fields[index + dir];
  localConfig.value.fields[index + dir] = temp;
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      localConfig.value.brandIcon = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function restoreDefaultTheme() {
  localConfig.value.theme = {
    primaryColor: '#0284c7',
    accentColor: '#0369a1',
    bgColor: '#cbd5e1',
    surfaceColor: '#f1f5f9',
    textColor: '#0f172a',
    darkMode: true
  };
}

async function save() {
  const wasBootstrap = config.value?.isConfigured === false;
  
  if (wasBootstrap && (!localConfig.value.adminPin || !localConfig.value.devPin)) {
    error('Both Admin PIN and Dev PIN are required for First-Time Setup.');
    return;
  }

  try {
    await saveConfig(localConfig.value);
    
    // BUG-3 FIX: saveConfig now deep-clones its input before assigning to the global
    // config ref, so mutating localConfig here no longer contaminates config.value.
    // We still clear local PIN fields so they don't linger in the form UI.
    localConfig.value.adminPin = '';
    localConfig.value.devPin = '';
    
    success('Configuration saved successfully!');

    if (wasBootstrap) {
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  } catch (err) {
    error('Failed to save! Incorrect PIN or network error.');
  }
}
</script>
