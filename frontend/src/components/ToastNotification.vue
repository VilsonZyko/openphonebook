<template>
  <!-- A11Y-1 FIX: role="alert" + aria-live="assertive" cause screen readers (NVDA,
       JAWS, VoiceOver) to interrupt the current reading and immediately announce new
       toast messages. aria-atomic="true" ensures the full message is read, not just
       the changed portion. Without these attributes, all toasts are invisible to AT. -->
  <div
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
    class="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none"
  >
    <transition-group 
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform -translate-y-8 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-8 opacity-0"
    >
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-md min-w-[250px]"
        :class="[
          toast.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-600' :
          toast.type === 'error' ? 'bg-red-500/90 text-white border-red-600' :
          'bg-slate-800/90 text-white border-slate-700'
        ]"
      >
        <i class="fa-solid" :class="[
          toast.type === 'success' ? 'fa-check-circle' :
          toast.type === 'error' ? 'fa-circle-exclamation' :
          'fa-circle-info'
        ]"></i>
        <span class="text-sm font-medium">{{ toast.message }}</span>
        <button @click="removeToast(toast.id)" class="ml-auto text-white/70 hover:text-white transition" aria-label="Dismiss notification">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToast } from '../composables/useToast';
const { toasts, removeToast } = useToast();
</script>

