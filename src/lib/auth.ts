import "server-only";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

/**
 * Temporäre lokale Auth-Lösung.
 *
 * Später wird diese Funktion durch Microsoft Entra / Teams Auth ersetzt.
 */
export const getCurrentUser = async (): Promise<CurrentUser> => {
  return {
    id: "local-admin",
    email: "denis.fejzic@example.com",
    displayName: "Denis Fejzic",
    isAdmin: true,
  };
};
