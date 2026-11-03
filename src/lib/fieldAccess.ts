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

export const LOGIN_FACTORIES = [
  { id: 1, label: '世界1廠' },
  { id: 2, label: '世界2廠' },
  { id: 3, label: '世界3廠' },
] as const;

/** 已開放現場人員登入的廠區。其他廠先不設定。 */
export const FIELD_SITE_HOME: Record<number, string> = {
  3: '/admin/signage/site/3/schedules',
};

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
  return FIELD_SITE_HOME[Number(session?.siteId)] ?? null;
}
