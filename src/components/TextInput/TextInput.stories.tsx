import React, {useState} from 'react';
import {TextInput, TextInputFooter, TextInputIcon, TextInputLabel} from './TextInput';
import {Meta} from "@storybook/react-native";
import {Hamburger} from "lucide-react-native/icons";
import {Text} from "react-native";
import clsx from "clsx";

const meta :Meta = {
  title: 'Components/TextInput',
  component: TextInput,
};

export default meta

export const Default = {
  render: () => {
    const [value, setValue] = useState("")

    return (
        <TextInput value={value} onChange={setValue} placeholder={"Enter something..."}/>
    )
  }
}

export const WithIcon = {
  render: () => {
    const [value, setValue] = useState("")

    return (
        <TextInput placeholder={"klmasdk"} value={value} onChange={setValue} >

          <TextInputLabel>
            Das ist ein Test
          </TextInputLabel>

          <TextInputIcon icon={Hamburger} />
        </TextInput>
    )
  }
}

export const WithFooter = {
  render: () => {
    const [value, setValue] = useState("")

    return (
        <TextInput placeholder={"klmasdk"} value={value} onChange={setValue} >

          <TextInputLabel>
            Das ist ein Test
          </TextInputLabel>

          <TextInputIcon icon={Hamburger} />

          <TextInputFooter>
            <Text className={clsx(
                value.length >= 8 ? "color-success" : "color-muted-foreground"
            )}>
              Min. 8 chars
            </Text>
          </TextInputFooter>
        </TextInput>
    )
  }
}
