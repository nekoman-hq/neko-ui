import React from "react";
import { View } from "react-native";
import type { HrProps } from "./Hr.types";

export const Hr = ({ className }: HrProps) => {
  return <View className={"w-full h-[2px] rounded-md bg-card"} />;
};
