import React from 'react';
import clsx from "clsx";
import {Button} from "../Button";
import {CheckboxProps, CheckboxProviderProps} from "./Checkbox.types"
import {View} from "react-native";
import {Check} from "./Checkbox.icons";
import {ThemeProvider} from "../ThemeProvider";

export const Checkbox = (
    {checked, onPress, className, ...props} : CheckboxProps
) => {

  return (
          <Button
              disabled={!onPress}
              onPress={onPress ? onPress : null}
              hitSlop={20}
              className={clsx(
                  "!p-0 !px-0 !w-6 aspect-square border !rounded-[5px] items-center justify-center",
                  checked ? "!bg-checkbox-active" : "!bg-transparent",
                  checked ? "!border-checkbox-active" : "!border-checkbox-inactive",
                  className
              )}
              {...props}
          >

              {
                  checked && (
                      <Check strokeWidth={4} size={16} className={"color-checkbox-icon"} />
                  )
              }
          </Button>
  );
};


export const CheckboxProvider = ({
    children,theme
} : CheckboxProviderProps) => (

    <ThemeProvider theme={theme}>
        {children}
    </ThemeProvider>
)