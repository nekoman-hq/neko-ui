
import React, {createContext, isValidElement, useContext, useState} from "react";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle, useScrollOffset,
} from "react-native-reanimated";
import {ParallaxItemProps, ParallaxScrollViewContextType, ParallaxScrollViewProps} from "@/src";
import clsx from "clsx";


const ParallaxScrollViewContext = createContext<ParallaxScrollViewContextType|null>(null)

const useParallaxScrollView = () => {
  const values = useContext(ParallaxScrollViewContext)
  if(!values){
    throw new Error("Must be within a <ParallaxScrollView />!")
  }

  return values
}

export const ParallaxScrollView = ({
                                     children, ...props
                                   }: ParallaxScrollViewProps) => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);

  const index = React.Children.toArray(children).findIndex(child => isValidElement(child) && child.type === ParallaxItem)

  if(index > 0) throw new Error("<ParallaxItem /> needs to be the first component of the ScrollView!")

  return (
      <ParallaxScrollViewContext.Provider value={{
        scrollOffset
      }}>
          <Animated.ScrollView
              className={"flex flex-1"}
              ref={scrollRef}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              {...props}
          >
            {children}
          </Animated.ScrollView>
      </ParallaxScrollViewContext.Provider>
  );
};

export const ParallaxItem = ({children, className} : ParallaxItemProps) => {

  const [height, setHeight] = useState(0);

  const {scrollOffset} = useParallaxScrollView()

  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
              scrollOffset.value,
              [-height, 0, height],
              [-height / 2, 0, height * 0.75],
          ),
        },
        {
          scale: interpolate(
              scrollOffset.value,
              [-height, 0, height],
              [1.6, 1, 0.5],
          ),
        },
      ],
      opacity: interpolate(
          scrollOffset.value,
          [-height, 0, height],
          [1, 1, 0],
      ),
    };
  });

  return (
      <Animated.View
          style={[imageAnimatedStyle]}
          className={clsx(
              `items-center justify-center`,
              className
          )}
          onLayout={(e) => {
            if (e.nativeEvent.layout.height !== height) {
              setHeight(e.nativeEvent.layout.height);
            }
          }}
      >
        {children}
      </Animated.View>
  )
}


