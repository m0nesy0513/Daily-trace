export function getCurrentStorageKey() {
  if (typeof window === "undefined") {
    return "diary-records-guest";
  }

  const savedUser = localStorage.getItem("user");
  const guestMode = localStorage.getItem("guest_mode");

  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);

      if (user?.id) {
        return `diary-records-user-${user.id}`;
      }
    } catch (error) {
      return "diary-records-guest";
    }
  }

  if (guestMode) {
    return "diary-records-guest";
  }

  return "diary-records-guest";
}

export function getCurrentRecords() {
  if (typeof window === "undefined") return [];

  const key = getCurrentStorageKey();
  return JSON.parse(localStorage.getItem(key) || "[]");
}

export function saveCurrentRecords(records: any[]) {
  if (typeof window === "undefined") return;

  const key = getCurrentStorageKey();
  localStorage.setItem(key, JSON.stringify(records));
}

export function clearGuestRecords() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("diary-records-guest");
}

export function isGuestMode() {
  if (typeof window === "undefined") return false;

  return !!localStorage.getItem("guest_mode");
}