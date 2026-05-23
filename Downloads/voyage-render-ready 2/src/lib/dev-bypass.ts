const STORAGE_KEY = '__voyage_dev';
const DEV_SECRET   = 'voyage_dev_2024';

export function isDevUnlocked(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function enableDevMode(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch { /* ignore */ }
}

export function disableDevMode(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

/**
 * Call once on app startup.
 * Activate:  ?dev=voyage_dev_2024
 * Deactivate: ?dev=off
 * Both clean the param from the URL after reading.
 */
export function initDevModeFromUrl(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const val = params.get('dev');
    if (val === DEV_SECRET) {
      enableDevMode();
    } else if (val === 'off') {
      disableDevMode();
    } else {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('dev');
    window.history.replaceState({}, '', url.toString());
  } catch { /* ignore */ }
}
