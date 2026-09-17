const REGION_LABELS: Record<string, string> = {
  HS: '新竹地區',
  TP: '台北地區',
  TY: '桃園地區',
  TC: '台中地區',
  TN: '台南地區',
  KH: '高雄地區',
};

export function getRegionLabel(region: { name: string; description?: string | null }) {
  const key = region.name.trim().toUpperCase();
  if (REGION_LABELS[key]) return REGION_LABELS[key];
  if (/[\u4e00-\u9fff]/.test(region.name)) return region.name;
  const description = region.description?.trim();
  if (description) {
    return description.endsWith('區') && !description.endsWith('地區')
      ? `${description.slice(0, -1)}地區`
      : description;
  }
  return region.name;
}
