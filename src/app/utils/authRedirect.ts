import type { Location } from 'react-router';

import { routePaths } from '../router';

export type LoginRedirectState = {
  from: string;
};

export function buildRedirectTarget(location?: Pick<Location, 'pathname' | 'search' | 'hash'> | null) {
  if (!location?.pathname) return routePaths.root;
  return `${location.pathname}${location.search || ''}${location.hash || ''}`;
}

export function buildLoginRedirectState(location?: Pick<Location, 'pathname' | 'search' | 'hash'> | null): LoginRedirectState {
  return {
    from: buildRedirectTarget(location),
  };
}

export function resolveRedirectTarget(state?: unknown) {
  const from =
    typeof (state as LoginRedirectState | undefined)?.from === 'string'
      ? (state as LoginRedirectState).from
      : routePaths.root;

  return from || routePaths.root;
}
