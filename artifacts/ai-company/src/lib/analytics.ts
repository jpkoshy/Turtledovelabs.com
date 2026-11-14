type AnalyticsData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track(name: string, data?: AnalyticsData): void;
    };
  }
}

const SITE_DOMAIN = 'www.turtledovelabs.com';
const DEFAULT_SCRIPT_URL = 'https://cloud.umami.is/script.js';

/**
 * Loads the Umami tracker when a website ID is configured at build time
 * (VITE_UMAMI_WEBSITE_ID). Without one, analytics stays off and trackEvent
 * is a no-op.
 */
export function initAnalytics(): void {
  const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim();
  if (typeof document === 'undefined' || !websiteId) return;

  const script = document.createElement('script');
  script.defer = true;
  script.src = import.meta.env.VITE_UMAMI_SCRIPT_URL?.trim() || DEFAULT_SCRIPT_URL;
  script.dataset.websiteId = websiteId;
  // Only count the production domain, not local or preview builds.
  script.dataset.domains = SITE_DOMAIN;
  document.head.appendChild(script);
}

export function trackEvent(name: string, data?: AnalyticsData): void {
  if (typeof window === 'undefined') return;

  try {
    window.umami?.track(name, data);
  } catch {
    // Analytics must never interrupt the user experience.
  }
}