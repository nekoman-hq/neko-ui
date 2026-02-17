import { Segment, SegmentedControl } from "@/src";
import { Meta, StoryObj } from "@storybook/react-native";
import {
  withSegmentedControlState,
  withSegmentThemes,
} from "./SegmentControl.decorators";
import { Theme } from "@/src/components/ThemeProvider/ThemeProvider.types";
import { useState } from "react";

const meta: Meta = {
  title: "Components/SegmentedControl",
  component: SegmentedControl,
  decorators: [withSegmentThemes, withSegmentedControlState],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {};

const themes: Partial<Theme>[] = [
  {
    segmentBackground: "#000",
  },
  {
    segmentBackground: "#b0f8f4",
    segmentActiveFont: "#000",
  },
  {
    segmentBackground: "#761793",
    segmentActiveFont: "#fff",
    segmentInactiveFont: "red",
  },
];

export const WithTheme: Story = {
  args: {
    themes,
  },
};

export const WithCustomLabel: Story = {
  render: () => {
    const [value, setValue] = useState("1");

    return (
      <SegmentedControl
        value={value}
        onChange={(label) => {
          setValue(label);
        }}
        renderLabel={(label) => {
          return `Number: ${label}`;
        }}
      >
        {["1", "2", "3", "4", "5"].map((n) => (
          <Segment key={n} label={n} />
        ))}
      </SegmentedControl>
    );
  },
};
