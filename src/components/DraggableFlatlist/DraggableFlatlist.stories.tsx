import React, { useState } from "react";
import { Meta } from "@storybook/react-native";
import { DraggableControl, DraggableFlatlist } from "./DraggableFlatlist";
import { Text, View } from "react-native";
import { Menu } from "lucide-react-native";

const meta: Meta = {
  title: "Components/DraggableFlatlist",
  component: DraggableFlatlist,
};

export default meta;

export const Default = {
  render: () => {
    const [data, setData] = useState([1, 2, 3, 4, 5, 6, 7]);

    return (
      <DraggableFlatlist
        data={data}
        setData={setData}
        contentContainerClassName={"gap-2 flex flex-1"}
        contentContainerStyle={{ gap: 4 }}
        keyExtractor={(i) => `${i}-Item`}
        renderItem={(item) => (
          <View className={"w-full p-4 rounded-lg bg-card my-1"}>
            <Text className={"color-foreground"}>Item {item}</Text>
          </View>
        )}
      />
    );
  },
};

export const WithControl = {
  render: () => {
    const [data, setData] = useState([1, 2, 3, 4, 5, 6, 7]);

    return (
      <View>
        <DraggableFlatlist
          data={data}
          setData={setData}
          contentContainerClassName={"gap-2 flex flex-1"}
          contentContainerStyle={{ gap: 4 }}
          keyExtractor={(i) => `${i}-Item`}
          renderItem={(item) => (
            <View
              className={
                "w-full p-4 rounded-lg bg-card my-1 justify-between flex-row"
              }
            >
              <Text className={"color-foreground"}>Item {item}</Text>

              <DraggableControl>
                <Menu color={"#fff"} size={20} />
              </DraggableControl>
            </View>
          )}
        />

        <Text className={"color-foreground text-lg"}>
          Order:
          {data.reduce((total, value) => {
            return total + `${value}, `;
          }, "  ")}
        </Text>
      </View>
    );
  },
};
