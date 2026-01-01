export interface LineChartProps {
  items: { value: number; label?: string; className?: string }[];
  labelClassName?: string;
  color1: string;
  color2: string;
  height?: number;
  radius?: number;
  padding?: number;
  duration?: number;
}
