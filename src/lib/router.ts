import { useEffect, useState } from 'react';

export type Route =
  | { name: 'dashboard' }
  | { name: 'create' }
  | { name: 'agreement'; id: string }
  | { name: 'jury' };

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);

  if (parts.length === 0) return { name: 'dashboard' };
  if (parts[0] === 'create') return { name: 'create' };
  if (parts[0] === 'jury') return { name: 'jury' };
  if (parts[0] === 'agreement' && parts[1]) return { name: 'agreement', id: parts[1] };

  return { name: 'dashboard' };
}

export function navigate(route: Route) {
  let hash = '#/';
  switch (route.name) {
    case 'dashboard':
      hash = '#/';
      break;
    case 'create':
      hash = '#/create';
      break;
    case 'jury':
      hash = '#/jury';
      break;
    case 'agreement':
      hash = `#/agreement/${route.id}`;
      break;
  }
  window.location.hash = hash;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parseHash);

  useEffect(() => {
    const handler = () => setRoute(parseHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return route;
}
