import React, {createContext, useContext, useState} from "react";
import {Text, View, StyleSheet, TouchableOpacity, Pressable} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator, ShadowDecorator,
} from "react-native-draggable-flatlist";
import {DraggableControlProps, DraggableFlatlistProps, DraggableRenderItemContext} from "@/src";


const RenderItemContext = createContext<DraggableRenderItemContext|null>(null)

const useRenderItemContext = () => {
  const values = useContext(RenderItemContext)
  if(!values){
    throw new Error("Component must be inside of the renderItem!")
  }
  return values
}

export function DraggableFlatlist<T>(
    {data, setData, renderItem : _renderItem, keyExtractor}: DraggableFlatlistProps<T>
) {

  const renderItem = ({ item, drag, isActive }: RenderItemParams<T>) => {
    return (
        <RenderItemContext.Provider value={{
          drag,
          isActive
        }}>
          <ScaleDecorator activeScale={1.025}>
            <ShadowDecorator opacity={0.5}>
              <Pressable
                  onLongPress={drag}
                  disabled={isActive}
                  className={"flex items-center justify-center"}
              >
                <View className={"max-w-[95%] flex w-full"}>
                  {_renderItem(item)}
                </View>
              </Pressable>
            </ShadowDecorator>
          </ScaleDecorator>
        </RenderItemContext.Provider>
    );
  };

  return (
      <DraggableFlatList
          data={data}
          onDragEnd={({ data }) => setData(data)}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
      />
  );
}

export const DraggableControl = (
    {children, onPressIn, ...props} : DraggableControlProps
) => {
  const {drag, isActive} = useRenderItemContext()

  return (
      <Pressable
          disabled={isActive}
          onPressIn={(e) => {
        drag()
        onPressIn && onPressIn(e)
      }}
          {...props}
      >
        {children}
      </Pressable>
  )
}
