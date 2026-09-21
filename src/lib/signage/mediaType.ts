export type SignageMediaKind = 'html' | 'image';

export function isImageFilename(filename: string | null | undefined): boolean {
  return /\.(png|jpe?g)$/i.test(filename ?? '');
}

export function signageMediaKind(filename: string | null | undefined): SignageMediaKind {
  return isImageFilename(filename) ? 'image' : 'html';
}

export function contentTypeForFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'text/html; charset=utf-8';
}

export function isAllowedUploadFilename(filename: string): boolean {
  return /\.(html|png|jpe?g)$/i.test(filename);
}

/** 用檔頭判斷，避免 PNG/JPG 被當成 HTML 做文字解碼。 */
export function sniffImageContentType(body: ArrayBuffer): 'image/png' | 'image/jpeg' | null {
  const u = new Uint8Array(body);
  if (u.length >= 8 && u[0] === 0x89 && u[1] === 0x50 && u[2] === 0x4e && u[3] === 0x47) {
    return 'image/png';
  }
  if (u.length >= 3 && u[0] === 0xff && u[1] === 0xd8 && u[2] === 0xff) {
    return 'image/jpeg';
  }
  return null;
}
