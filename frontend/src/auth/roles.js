export const ROLE_LABELS = {
  system_administrator: 'System Administrator',
  bank_security_officer: 'Bank Security Officer',
  atm_operations_manager: 'ATM Operations Manager',
}

export const ROLE_PATHS = {
  system_administrator: [
    '/dashboard',
    '/transactions',
    '/anomalies',
    '/analytics',
    '/atm-network',
    '/ml-model',
    '/reports',
    '/settings',
  ],
  bank_security_officer: [
    '/dashboard',
    '/transactions',
    '/anomalies',
    '/analytics',
    '/reports',
    '/settings',
  ],
  atm_operations_manager: ['/dashboard', '/transactions', '/atm-network', '/settings'],
}

export function canAccessPath(role, pathname) {
  const allowedPaths = ROLE_PATHS[role] ?? []
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'

  return allowedPaths.some(
    (path) =>
      normalizedPath === path ||
      normalizedPath.startsWith(`${path}/`),
  )
}
