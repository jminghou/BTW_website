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
