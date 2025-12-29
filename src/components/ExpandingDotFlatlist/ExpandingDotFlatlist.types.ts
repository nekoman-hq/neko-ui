import React from 'react';
import {
  Animated,
  FlatList,
  FlatListProps,
  ListRenderItem,
  ListRenderItemInfo,
  StyleProp,
  ViewStyle
} from "react-native";

export interface ExpandingDotFlatlistProps <T = any> extends Omit<FlatListProps<T>, "data"|"renderItem">{

  onPageChange?: (pageIndex: number) => void;

}

export interface ExpandingDotContextType <T = any> {
  scrollX: Animated.Value,
  data: readonly T[],
  renderItem: (info: ListRenderItemInfo<T>) => React.ReactNode,
}

export interface ExpandingDotProviderProps<T> {
  children?:React.ReactNode,
  data: readonly T[],
  renderItem: (info: ListRenderItemInfo<T>) => React.ReactNode,
  className?:string
}

export interface ExpandingDotProps {
  dotStyle?:StyleProp<ViewStyle>,
  dotContainerStyle?: StyleProp<ViewStyle>,
  expandingDotWidth?: number,
  activeDotColor?:string,
  inActiveDotColor?:string
}