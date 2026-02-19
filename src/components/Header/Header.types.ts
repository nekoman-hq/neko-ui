import React from "react";

export interface HeaderContextProps {
  initHeader: (component: React.ReactNode) => void;
  removeHeader: () => void;
  intensity: number;
}

export interface HeaderProps {
  children: React.ReactNode;
  blur?: boolean;
  className?: string;
}

export interface HeaderProviderProps {
  children?: React.ReactNode;
  intensity?: number;
}
