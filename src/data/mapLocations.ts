export interface MapLocation {
  id: string;
  name: string;
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
}

export const mapLocations: MapLocation[] = [
  { id: '1', name: '台北', x: 67, y: 15 },
  { id: '2', name: '新北', x: 65, y: 18 },
  { id: '3', name: '桃園', x: 55, y: 18 },
  { id: '4', name: '新竹', x: 50, y: 25 },
  { id: '5', name: '台中', x: 45, y: 40 },
  { id: '6', name: '台南', x: 30, y: 70 },
  { id: '7', name: '高雄', x: 30, y: 80 },
];

