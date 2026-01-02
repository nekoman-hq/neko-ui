import React, { useState } from "react";
import { Meta } from "@storybook/react-native";
import { Bar, BarChart } from "./BarChart";

const meta: Meta = {
  title: "Components/BarChart",
  component: BarChart,
};

export default meta;

export const Default = {
  render: () => {
    return (
      <BarChart
        colorTheme={{
          primaryColor: "#ff0",
          secondaryColor: "#ff8",
        }}
        maxHeight={150}
        duration={700}
      >
        <Bar value={10} key={"1"} />

        <Bar value={20} key={"2"} />

        <Bar value={15} key={"3"} />
      </BarChart>
    );
  },
};

export const WithLabel = {
  render: () => {
    return (
      <BarChart
        colorTheme={{
          primaryColor: "#ff0",
          secondaryColor: "#ff8",
        }}
        maxHeight={150}
        duration={700}
      >
        <Bar value={10} key={"1"} label={"Bar 1"} />

        <Bar value={20} key={"2"} label={"Bar 2"} />

        <Bar value={15} key={"3"} label={"Bar 3"} />
      </BarChart>
    );
  },
};

export const ActiveOrInactive = {
  render: () => {
    const [index, setActiveIndex] = useState(0);

    return (
      <BarChart
        colorTheme={{
          primaryColor: "#ff0",
          secondaryColor: "#ff8",
        }}
        initialIndex={index}
        maxHeight={150}
        duration={700}
      >
        <Bar
          value={10}
          active={index === 0}
          key={"1"}
          label={"Bar 1"}
          onPress={() => setActiveIndex(0)}
        />

        <Bar
          value={20}
          key={"2"}
          label={"Bar 2"}
          active={index === 1}
          onPress={() => setActiveIndex(1)}
        />

        <Bar
          value={15}
          key={"3"}
          label={"Bar 3"}
          active={index === 2}
          onPress={() => setActiveIndex(2)}
        />
      </BarChart>
    );
  },
};
