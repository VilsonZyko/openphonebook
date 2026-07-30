import { ref } from 'vue';

const toasts = ref([]);
let idCounter = 0;

export function useToast() {
  const addToast = (message, type = 'info', duration = 3000) => {
    const id = idCounter++;
    toasts.value.push({ id, message, type });

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  };

  const success = (msg, dur) => addToast(msg, 'success', dur);
  const error = (msg, dur) => addToast(msg, 'error', dur);
  const info = (msg, dur) => addToast(msg, 'info', dur);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info
  };
}
