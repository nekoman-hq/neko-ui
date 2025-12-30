import React, {
  useRef,
  useMemo,
  createContext,
  useContext,
  useCallback,
} from "react";
import {
  View,
  Animated,
  FlatList,
  Dimensions,
  ListRenderItemInfo,
} from "react-native";
import { ExpandingDot as ImportedExpandingDot } from "react-native-animated-pagination-dots";
import {
  ExpandingDotContextType,
  ExpandingDotFlatlistProps,
  ExpandingDotProps,
  ExpandingDotProviderProps,
} from "./ExpandingDotFlatlist.types";
const { width: pageWidth } = Dimensions.get("window");

const ExpandingDotContext = createContext<ExpandingDotContextType | null>(null);

const useExpandingDotContext = () => {
  const values = useContext(ExpandingDotContext);
  if (!values) {
    throw new Error("Must be within a <ExpandingDotProvider />!");
  }
  return values;
};

export const ExpandingDotProvider = <T,>({
  children,
  data,
  className,
  renderItem,
}: ExpandingDotProviderProps<T>) => {
  const scrollX = useRef(new Animated.Value(0)).current;

  const values = useMemo<ExpandingDotContextType<T>>(() => {
    return {
      data,
      scrollX,
      renderItem,
    };
  }, [data, scrollX, renderItem]);

  return (
    <ExpandingDotContext.Provider value={values}>
      <View className={className}>{children}</View>
    </ExpandingDotContext.Provider>
  );
};

export function ExpandingDotFlatlist({
  onPageChange,
  ...props
}: ExpandingDotFlatlistProps) {
  const { scrollX, data, renderItem } = useExpandingDotContext();

  const listRef = useRef<FlatList | null>(null);

  const _renderItem = useCallback(
    (info: ListRenderItemInfo<any>) => (
      <View style={{ width: pageWidth }}>{renderItem?.(info)}</View>
    ),
    [renderItem],
  );

  return (
    <Animated.FlatList
      ref={listRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      data={data}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false },
      )}
      renderItem={_renderItem}
      getItemLayout={(_, index) => ({
        length: pageWidth,
        offset: pageWidth * index,
        index,
      })}
      {...props}
    />
  );
}

export const ExpandingDot = ({
  dotStyle = {
    width: 5,
    height: 5,
    backgroundColor: "#fff",
    borderRadius: 5,
  },
  expandingDotWidth = 10,
  activeDotColor = "#fff",
  inActiveDotColor = "#999",
  dotContainerStyle = {
    bottom: 0,
  },
}: ExpandingDotProps) => {
  const { data, scrollX } = useExpandingDotContext();

  return (
    <ImportedExpandingDot
      data={data.map((_, i) => i)}
      expandingDotWidth={expandingDotWidth}
      dotStyle={{
        width: 5,
        height: 5,
        backgroundColor: "#fff",
        borderRadius: 5,
        marginHorizontal: 2,
        ...((dotStyle as object) || {}),
      }}
      activeDotColor={activeDotColor}
      inActiveDotColor={inActiveDotColor}
      scrollX={scrollX}
      containerStyle={{
        paddingBottom: 20,
        ...(dotContainerStyle as object),
        position: "relative",
      }}
    />
  );
};
