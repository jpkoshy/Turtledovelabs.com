import { useEffect } from 'react';

const SITE_URL = 'https://www.turtledovelabs.com';

/** Sets the tab title and canonical URL for a client-side route, restoring both on leave. */
export function usePageMeta(title: string, path: string): void {
  useEffect(() => {
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const previousTitle = document.title;
    const previousHref = canonical?.href;

    document.title = title;
    if (canonical) canonical.href = `${SITE_URL}${path}`;

    return () => {
      document.title = previousTitle;
      if (canonical && previousHref) canonical.href = previousHref;
    };
  }, [title, path]);
}
