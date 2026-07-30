import { ref } from 'vue';
import { apiFetch } from './api';

const contacts = ref([]);

export function useContacts() {
  async function fetchContacts() {
    try {
      contacts.value = await apiFetch('/contacts');
    } catch (e) {
      console.error("Failed to get contacts:", e);
    }
    return contacts.value;
  }

  async function addContact(contactData) {
    // SEC-1 FIX: Do NOT inject createdAt/updatedAt from the client. The Phase 1
    // backend sets these server-side and explicitly discards client-supplied values.
    // Also spread contactData to avoid mutating the caller's reactive formData object,
    // which would cause unnecessary re-renders of the open modal.
    const { createdAt, updatedAt, ...cleanData } = contactData;
    const newContact = await apiFetch('/contacts', {
      method: 'POST',
      body: JSON.stringify(cleanData)
    });
    await fetchContacts();
    return newContact;
  }

  async function updateContact(id, updatedFields) {
    // SEC-1 FIX: Same rationale — strip any stale client timestamps before sending.
    const { createdAt, updatedAt, ...cleanData } = updatedFields;
    await apiFetch(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cleanData)
    });
    await fetchContacts();
  }

  async function deleteContact(id) {
    await apiFetch(`/contacts/${id}`, { method: 'DELETE' });
    await fetchContacts();
  }

  async function deleteContactsBulk(ids) {
    await apiFetch('/contacts/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids })
    });
    await fetchContacts();
  }

  return { contacts, fetchContacts, addContact, updateContact, deleteContact, deleteContactsBulk };
}

