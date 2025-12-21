import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Segment, SegmentedControl, SegmentThemeProvider } from "@/src";
import { Decorator, StoryObj } from "@storybook/react-native";
import { Theme } from "@/src/components/ThemeProvider/ThemeProvider.types";
import clsx from "clsx";

export const withSegmentedControlState: Decorator = (Story, context) => {
  const [selected, setSelected] = useState("All");
  const items = ["All", "Active", "Completed"];

  return (
    <View style={{ padding: 20 }}>
      <Story
        args={{
          ...context.args,
          value: selected,
          onChange: setSelected,
          children: items.map((label) => <Segment key={label} label={label} />),
        }}
      />
    </View>
  );
};

export const withSegmentThemes: Decorator = (Story, context) => {
  const [theme, setTheme] = useState<number>(0);

  const themes = context.args.themes;

  if (!Array.isArray(themes)) {
    return <Story args={{ ...context.args }} />;
  }

  return (
    <View className={"gap-10 py-10"}>
      <SegmentThemeProvider theme={themes[theme]}>
        <Story args={{ ...context.args }} />
      </SegmentThemeProvider>

      <View className={"gap-4"}>
        {themes.map((t: Partial<Theme>, i) => (
          <Pressable
            onPress={() => setTheme(i)}
            key={i}
            className={clsx(
              "flex flex-row gap-10 flex-wrap p-2 rounded-lg",
              i === theme
                ? "bg-card/20"
                : "border-card border-dashed border-[1px]",
            )}
          >
            {Object.keys(t).map((key) => (
              <View key={key} className={"flex flex-row items-center"}>
                <Text>{key}: </Text>
                <View
                  className={"w-[30px] h-[30px] "}
                  style={{
                    backgroundColor:
                      t[
                        key as keyof Pick<
                          Theme,
                          | "segmentActiveFont"
                          | "segmentBackground"
                          | "segmentInactiveFont"
                        >
                      ] || undefined,
                  }}
                ></View>
              </View>
            ))}
          </Pressable>
        ))}
      </View>
    </View>
  );
};
