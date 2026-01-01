import React from "react";

export interface ProgressCircleProps {
  /**
   * The size is the diameter of the circle + the extra space for the glow effect
   */
  size?: number;
  strokeWidth?: number;
  progress: number;
  color1: any;
  color2: any;
  children?: React.ReactNode;
  duration?: number;
}
