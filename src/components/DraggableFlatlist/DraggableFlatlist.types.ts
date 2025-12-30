import React from "react";
import { DraggableFlatListProps } from "react-native-draggable-flatlist";
import { PressableProps } from "react-native";

export interface DraggableFlatlistProps<T = any> extends Omit<
  DraggableFlatListProps<T>,
  "renderItem"
> {
  data: T[];
  setData: (data: T[]) => void;
  renderItem: (item: T) => React.ReactNode;
}

export interface DraggableRenderItemContext {
  drag: () => void;
  isActive: boolean;
}

export interface DraggableControlProps extends PressableProps {
  children?: React.ReactNode;
}
