import type { MarketplaceApi } from './api';
// STUB — owned by agent B1 (data layer). Implement every MarketplaceApi method on localStorage with seed data from ./seed.
export function createLocalApi(): MarketplaceApi {
  return new Proxy({} as MarketplaceApi, {
    get: (_t, name) => () => Promise.reject(new Error(`marketplace api.${String(name)} not implemented`)),
  });
}
