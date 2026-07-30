import { useAuth } from './useAuth';
import { useConfig } from './useConfig';
import { useContacts } from './useContacts';

export function useStorage() {
  return {
    ...useAuth(),
    ...useConfig(),
    ...useContacts()
  };
}
