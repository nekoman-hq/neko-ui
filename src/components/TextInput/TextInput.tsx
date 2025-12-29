import React, {createContext, useContext, useEffect, useMemo, useRef, useState} from "react";
import {
  TextInput as ReactNativeTextInput,
  View,
  KeyboardTypeOptions,
  InputModeOptions, Text,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {TextInputContextType, TextInputProps} from "./TextInput.types"
import {LucideIcon} from "lucide-react-native";
import {useIconWithClassname} from "@/src/hooks/Lucide.hook";
import clsx from "clsx";

const TextInputContext = createContext<TextInputContextType|null>(null)

const useTextInputContext = () => {
  const values = useContext(TextInputContext)
  if(!values){
    throw new Error("Component must be within a <TextInput />!")
  }
  return values
}

export const TextInput = ({
                                   keyboardType,
                                   value,
                                   onChange,
                                   inputRef = undefined,
                                   placeholder,
                                   fontSize = 16,
                                   multiline = false,
                                   labelTopSize = 14,
                                   rightText,
                                   inputMode,
                                   secureTextEntry = false,
                                   maxLength,
                                   autoCapitalize,
    children
                                 }: TextInputProps) => {

  const textInputRef = useRef<ReactNativeTextInput>(null);
  const [inputFocused, setInputFocused] = useState(false);

  const isDefaultEmpty = !value || value.length === 0;

  const positionY = useSharedValue(!isDefaultEmpty ? -labelTopSize / 2 : 15);

  const animatedFontSize = useSharedValue(
      isDefaultEmpty ? fontSize : labelTopSize,
  );
  const animatedFontOpacity = useSharedValue(!isDefaultEmpty ? 0.5 : 1);




  const animatedContainerStyle = useAnimatedStyle(() => {
    const gap = withTiming(isDefaultEmpty && !inputFocused ? 8 : 3);
    return {
      top: positionY.value,
      gap,
    };
  });

  const iconChild = useMemo(() => (
      React.Children.toArray(children).find(
          (child) =>
              React.isValidElement(child) &&
              child.type === TextInputIcon
      )
  ), [children]);
  const labelChild = useMemo(() => (
      React.Children.toArray(children).find(
          (child) =>
              React.isValidElement(child) &&
              child.type === TextInputLabel
      )
  ), [children]);
  const footerChild = useMemo(() => (
      React.Children.toArray(children).find(
          (child) =>
              React.isValidElement(child) &&
              child.type === TextInputFooter
      )
  ), [children]);

  useEffect(() => {
    if (isDefaultEmpty) {
      animatedFontOpacity.value = withTiming(1);
      if (!inputFocused) {
        positionY.value = withTiming(15);
        animatedFontSize.value = withTiming(fontSize);
      }
    } else {
      animatedFontOpacity.value = withTiming(0.5);
    }


  }, [value]);


  return (
      <TextInputContext.Provider value={{
        animatedFontOpacity,
        animatedFontSize,
        labelTopSize,
        fontSize,
        isDefaultEmpty,
        inputFocused
      }}>
        <View
            style={{
              width: "100%",
              gap: 15,
              overflow: "visible",
              paddingVertical: 15,
              borderRadius: 15,
              paddingHorizontal: 15,
              borderWidth: 1,
              marginTop: 8,
            }}
            className={"border border-card"}
        >
          <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: "absolute",
                  zIndex: 1,
                  flexDirection: "row",

                  alignItems: "center",
                  left: 10,

                  paddingHorizontal: 5,
                },
                animatedContainerStyle,
              ]}
              className={"bg-background"}
          >
            {iconChild !== undefined && (
                  iconChild
            )}

            {labelChild !== undefined && (
                labelChild
            )}

          </Animated.View>

          <View
              style={{
                width: "100%",
                flexDirection: "row",
                alignItems: multiline ? "flex-start" : "center",
                justifyContent: "space-between",
                gap: 10,
              }}
          >
            <ReactNativeTextInput
                autoCapitalize={autoCapitalize}
                autoCorrect={!!autoCapitalize}
                maxLength={maxLength}
                secureTextEntry={secureTextEntry}
                inputMode={inputMode}
                hitSlop={20}
                onFocus={() => {
                  setInputFocused(true);
                  positionY.value = withTiming(-labelTopSize / 2);
                  animatedFontSize.value = withTiming(labelTopSize);
                }}
                onBlur={() => {
                  setInputFocused(false);
                  if (isDefaultEmpty) {
                    positionY.value = withTiming(15);
                    animatedFontSize.value = withTiming(fontSize);
                  }
                }}
                spellCheck={false}
                multiline={multiline}
                numberOfLines={multiline ? 4 : 1}
                onChangeText={onChange}
                ref={inputRef ?? textInputRef}
                keyboardType={keyboardType}
                defaultValue={value}
                placeholder={(inputFocused || (iconChild === undefined && labelChild === undefined)) ? placeholder : undefined}
                selectTextOnFocus
                //selectionColor={colorPalette.actionColor}
                style={{
                  fontSize: fontSize,
                  fontWeight: "600",
                  textAlign: "left",
                  flex: 1,
                }}
                className={"color-foreground"}
                scrollEnabled={false}
            />
            {rightText && <Text>{rightText}</Text>}
          </View>
        </View>

        {footerChild && (
            footerChild
        )}
      </TextInputContext.Provider>
  );
};

export const TextInputIcon = ({icon : Icon, className} : {icon: LucideIcon, className?:string}) => {
  const {
    inputFocused,
      isDefaultEmpty,
      labelTopSize,
      fontSize,
      animatedFontOpacity
  } = useTextInputContext()

  useIconWithClassname(Icon)

  const animatedIconStyle = useAnimatedStyle(() => {
    const scale = withTiming(
        isDefaultEmpty && !inputFocused ? 1 : (labelTopSize - 2) / fontSize,
    );
    return {
      transform: [{scale}],
      opacity: animatedFontOpacity.value,
    };
  });

  return (

      <Animated.View style={animatedIconStyle}>
      <Icon className={clsx(
          "color-foreground", className
      )} size={18} />
      </Animated.View>
  )
}

export const TextInputLabel = ({children} : {children:string}) => {
  const {animatedFontSize, animatedFontOpacity} = useTextInputContext()

  const animatedTextStyle = useAnimatedStyle(() => ({
    fontSize: animatedFontSize.value,
    opacity: animatedFontOpacity.value,
  }));

  return (
      <Animated.Text
          style={[
            {
              fontWeight: "500",
            },
            animatedTextStyle,
          ]}
          className={"color-foreground"}
      >
        {children}
      </Animated.Text>
  )
}

export const TextInputFooter = ({children} : {children?:React.ReactNode}) => {

  return (
      <Animated.View
          style={{width: "100%"}}
          entering={FadeIn}
          exiting={FadeOut}
      >
        {children}
      </Animated.View>
  )
}