export function isDemoMode(): boolean {
  const disabled = import.meta.env.VITE_DISABLE_DEMO_MODE === 'true';
  if (disabled) return false;
  return sessionStorage.getItem('demoMode') === 'true';
}
