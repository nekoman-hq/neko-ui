import React from "react";

export interface SwipeableProps {
  onSubmit(): void;
  children?: React.ReactNode;
  icon: React.ReactElement;
}
