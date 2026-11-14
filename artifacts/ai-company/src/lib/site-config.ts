/**
 * Facts about the company shown on the site. Leave a value empty and the
 * element that uses it is not rendered, so nothing placeholder-looking ships.
 */
export const SITE_CONFIG = {
  /** Shown as the hero's coordinate readout, e.g. { city: 'Toronto, ON', lat: '43.6532° N', lng: '79.3832° W' }. */
  location: { city: 'Toronto, ON', lat: '43.6532° N', lng: '79.3832° W' } as { city: string; lat: string; lng: string } | null,
  /** Company LinkedIn page, e.g. 'https://www.linkedin.com/company/turtledove-labs'. */
  linkedinUrl: '',
};
