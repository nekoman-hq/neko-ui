import { Segment, SegmentedControl } from "@/src";
import { Meta, StoryObj } from "@storybook/react-native";
import {
  withSegmentedControlState,
  withSegmentThemes,
} from "./SegmentControl.decorators";
import { Theme } from "@/src/components/ThemeProvider/ThemeProvider.types";

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
