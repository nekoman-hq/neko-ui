import React, { useRef, useState } from "react";
import {
  RichTextEditor,
  RichEditorInput,
  RichTextTitle,
  RichEditorToolbar,
} from "./RichTextEditor";
import { Text, View } from "react-native";
import { RichEditor } from "react-native-pell-rich-editor";
import { Meta } from "@storybook/react-native";

const meta: Meta = {
  title: "Components/RichTextEditor",
  component: RichTextEditor,
  tags: ["autodocs"],
};

export default meta;

export const Default = {
  render: () => {
    const ref = useRef<RichEditor | null>(null);
    const [value, setValue] = useState("");
    return (
      <View>
        <RichTextEditor
          theme={{
            richEditorTitle: "green",
          }}
          richTextRef={ref}
          className={"p-4"}
        >
          <RichTextTitle>Neko Rich Text Editor</RichTextTitle>
          <RichEditorInput
            onChange={setValue}
            color={"#000"}
            placeholder={"Das ist ein Placeholder"}
          />
          <RichEditorToolbar alwaysVisible={false} />

          <Text>{value}</Text>
        </RichTextEditor>
      </View>
    );
  },
};
