export type StaffSession = {
  id?: number;
  username?: string;
  display_name?: string;
  email?: string;
  role?: string;
  loginAs?: 'admin' | 'field';
  siteId?: number;
};

export const LOGIN_IDENTITIES = [
  { value: 'admin', label: '管理員' },
  { value: 'field', label: '現場人員' },
] as const;

/** 現場人員只能進入帳號上指派的那一個場域排程。 */
export function fieldHomeForSite(siteId: number): string | null {
  if (!Number.isInteger(siteId) || siteId <= 0) return null;
  return `/admin/signage/site/${siteId}/schedules`;
}

export function readStaffSession(): StaffSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('userInfo');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StaffSession;
  } catch {
    return null;
  }
}

export function isFieldStaff(session: StaffSession | null): boolean {
  return session?.role === 'field' || session?.loginAs === 'field';
}

export function fieldStaffHome(session: StaffSession | null): string | null {
  if (!isFieldStaff(session)) return null;
  return fieldHomeForSite(Number(session?.siteId));
}
