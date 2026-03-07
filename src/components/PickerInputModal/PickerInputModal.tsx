import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { PickerItem } from "@quidone/react-native-wheel-picker";
import clsx from "clsx";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Keyboard,
  KeyboardEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput as ReactNativeTextInput,
  View,
} from "react-native";
import Animated, {
  KeyboardState,
  interpolate,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WheelPicker } from "@/src/components/WheelPicker";
import type {
  PickerInputModalDataItem,
  PickerInputModalInputGroupProps,
  PickerInputModalInputProps,
  PickerInputModalProps,
  PickerInputModalRef,
  PickerInputModalValue,
} from "./PickerInputModal.types";

type AnyInputProps = PickerInputModalInputProps<PickerInputModalValue>;

type ParsedInput = AnyInputProps & {
  id: string;
  pickerData: PickerItem<PickerInputModalValue>[];
};

type ParsedGroup = Omit<PickerInputModalInputGroupProps, "children"> & {
  id: string;
  inputs: ParsedInput[];
};

type PickerInputModalCompoundComponent = React.ForwardRefExoticComponent<
  PickerInputModalProps & React.RefAttributes<PickerInputModalRef>
> & {
  Input: typeof PickerInputModalInput;
  InputGroup: typeof PickerInputModalInputGroup;
};

const HANDLE_AND_PADDING = 52;
const KEYBOARD_OPEN_DELAY = 100;
const KEYBOARD_CLOSE_DELAY = 300;

function PickerInputModalInput(
  _props: PickerInputModalInputProps<number>,
): React.ReactElement | null;
function PickerInputModalInput(
  _props: PickerInputModalInputProps<string>,
): React.ReactElement | null;
function PickerInputModalInput(
  _props:
    | PickerInputModalInputProps<number>
    | PickerInputModalInputProps<string>,
) {
  return null;
}

function PickerInputModalInputGroup(_props: PickerInputModalInputGroupProps) {
  return null;
}

function normalizePickerData<T extends PickerInputModalValue>(
  data: readonly PickerInputModalDataItem<T>[],
): PickerItem<PickerInputModalValue>[] {
  return data.map((item) => {
    if (typeof item === "object" && item !== null && "value" in item) {
      return {
        value: item.value,
        label: item.label ?? String(item.value),
      };
    }

    return {
      value: item,
      label: String(item),
    };
  });
}

function formatInputValue(input: ParsedInput) {
  if (input.formatValue) {
    return input.formatValue(input.value);
  }

  return String(input.value ?? "");
}

function parseInputValue(input: ParsedInput, value: string) {
  if (input.onTextInputValueChange) {
    input.onTextInputValueChange(value);
    return;
  }

  if (input.parseTextInput) {
    const parsedValue = input.parseTextInput(value);
    if (parsedValue !== undefined) {
      input.onValueChange(parsedValue);
    }
    return;
  }

  if (typeof input.value === "number") {
    const normalizedValue = value.replace(",", ".").trim();
    const parsedValue =
      normalizedValue.length === 0 ? 0 : Number(normalizedValue);

    if (!Number.isNaN(parsedValue)) {
      input.onValueChange(parsedValue);
    }
    return;
  }

  input.onValueChange(value);
}

function createNodeId(
  prefix: string,
  path: number[],
  key: string | null | undefined,
) {
  if (key) {
    return `${prefix}-${key}`;
  }

  return `${prefix}-${path.join("-")}`;
}

function isInputElement(
  child: React.ReactNode,
): child is React.ReactElement<AnyInputProps> {
  return React.isValidElement(child) && child.type === PickerInputModalInput;
}

function isInputGroupElement(
  child: React.ReactNode,
): child is React.ReactElement<PickerInputModalInputGroupProps> {
  return (
    React.isValidElement(child) && child.type === PickerInputModalInputGroup
  );
}

function parseInputChildren(
  children: React.ReactNode,
  pathPrefix: number[],
): ParsedInput[] {
  const inputs: ParsedInput[] = [];

  React.Children.forEach(children, (child, index) => {
    if (!React.isValidElement(child)) {
      return;
    }

    const currentPath = [...pathPrefix, index];

    if (child.type === React.Fragment) {
      inputs.push(
        ...parseInputChildren(
          (child.props as { children?: React.ReactNode }).children,
          currentPath,
        ),
      );
      return;
    }

    if (!isInputElement(child)) {
      return;
    }

    inputs.push({
      ...child.props,
      id: createNodeId("input", currentPath, child.key?.toString()),
      pickerData: normalizePickerData(child.props.data),
    });
  });

  return inputs;
}

function parseGroups(
  children: React.ReactNode,
  pathPrefix: number[] = [],
): ParsedGroup[] {
  const groups: ParsedGroup[] = [];

  React.Children.forEach(children, (child, index) => {
    if (!React.isValidElement(child)) {
      return;
    }

    const currentPath = [...pathPrefix, index];

    if (child.type === React.Fragment) {
      groups.push(
        ...parseGroups(
          (child.props as { children?: React.ReactNode }).children,
          currentPath,
        ),
      );
      return;
    }

    if (isInputGroupElement(child)) {
      const inputs = parseInputChildren(child.props.children, currentPath);

      if (inputs.length > 0) {
        groups.push({
          id: createNodeId("group", currentPath, child.key?.toString()),
          label: child.props.label,
          textInputValue: child.props.textInputValue,
          onTextInputValueChange: child.props.onTextInputValueChange,
          placeholder: child.props.placeholder,
          keyboardType: child.props.keyboardType,
          inputMode: child.props.inputMode,
          maxLength: child.props.maxLength,
          inputs,
        });
      }

      return;
    }

    if (!isInputElement(child)) {
      return;
    }

    groups.push({
      id: createNodeId("group", currentPath, child.key?.toString()),
      inputs: [
        {
          ...child.props,
          id: createNodeId("input", currentPath, child.key?.toString()),
          pickerData: normalizePickerData(child.props.data),
        },
      ],
    });
  });

  return groups;
}

function hasSharedTextField(group: ParsedGroup) {
  return (
    group.textInputValue !== undefined ||
    group.onTextInputValueChange !== undefined ||
    group.placeholder !== undefined ||
    group.keyboardType !== undefined ||
    group.inputMode !== undefined ||
    group.maxLength !== undefined ||
    group.label !== undefined
  );
}

const PickerInputModalRoot = React.forwardRef<
  PickerInputModalRef,
  PickerInputModalProps
>(({ children }, ref) => {
  const { bottom } = useSafeAreaInsets();
  const { state } = useAnimatedKeyboard();

  const groups = useMemo(() => parseGroups(children), [children]);
  const [collapsedHeight, setCollapsedHeight] = useState(0);
  const [pickerHeight, setPickerHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [pickerInteractive, setPickerInteractive] = useState(true);
  const [textDrafts, setTextDrafts] = useState<Record<string, string>>({});
  const [focusedTextFieldId, setFocusedTextFieldId] = useState<string | null>(
    null,
  );

  const animatedIndex = useSharedValue(0);
  const bottomSheetRef = useRef<PickerInputModalRef | null>(null);
  const keyboardHeightRef = useRef(0);
  const keyboardHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const pickerOpenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const assignBottomSheetRef = useCallback(
    (instance: PickerInputModalRef | null) => {
      bottomSheetRef.current = instance;

      if (typeof ref === "function") {
        ref(instance);
        return;
      }

      if (ref) {
        (ref as React.MutableRefObject<PickerInputModalRef | null>).current =
          instance;
      }
    },
    [ref],
  );

  const clearKeyboardHideTimeout = useCallback(() => {
    if (keyboardHideTimeoutRef.current === null) {
      return;
    }

    clearTimeout(keyboardHideTimeoutRef.current);
    keyboardHideTimeoutRef.current = null;
  }, []);

  const clearPickerOpenTimeout = useCallback(() => {
    if (pickerOpenTimeoutRef.current === null) {
      return;
    }

    clearTimeout(pickerOpenTimeoutRef.current);
    pickerOpenTimeoutRef.current = null;
  }, []);

  const collapsedSnapPoint =
    collapsedHeight > 0 ? collapsedHeight + HANDLE_AND_PADDING : 0;
  const expandedSnapPoint =
    pickerHeight > 0 ? pickerHeight + HANDLE_AND_PADDING : collapsedSnapPoint;

  const snapPoints = useMemo(() => {
    if (collapsedSnapPoint <= 0) {
      return [];
    }

    if (
      keyboardVisible ||
      expandedSnapPoint <= 0 ||
      expandedSnapPoint === collapsedSnapPoint
    ) {
      return [collapsedSnapPoint];
    }

    return [collapsedSnapPoint, expandedSnapPoint];
  }, [collapsedSnapPoint, expandedSnapPoint, keyboardVisible]);

  const contentHeight = Math.max(collapsedHeight, pickerHeight);

  const firstViewAnimatedStyle = useAnimatedStyle(() => {
    if (
      state.value !== KeyboardState.CLOSED &&
      state.value !== KeyboardState.UNKNOWN
    ) {
      return { opacity: 1, position: "relative" as const, zIndex: 1 };
    }

    const opacity = interpolate(animatedIndex.value, [0, 1], [1, 0], "clamp");

    return {
      opacity,
      position: "relative" as const,
      zIndex: opacity === 0 ? -1 : 1,
    };
  });

  const secondViewAnimatedStyle = useAnimatedStyle(() => {
    if (
      state.value !== KeyboardState.CLOSED &&
      state.value !== KeyboardState.UNKNOWN
    ) {
      return { opacity: 0, zIndex: -1 };
    }

    const opacity = interpolate(animatedIndex.value, [0, 1], [0, 1], "clamp");
    return { opacity, zIndex: opacity === 0 ? -1 : 1 };
  });

  const setTextDraft = useCallback((id: string, value: string) => {
    setTextDrafts((currentDrafts) => {
      if (currentDrafts[id] === value) {
        return currentDrafts;
      }

      return {
        ...currentDrafts,
        [id]: value,
      };
    });
  }, []);

  const clearTextDraft = useCallback((id: string) => {
    setTextDrafts((currentDrafts) => {
      if (!(id in currentDrafts)) {
        return currentDrafts;
      }

      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[id];
      return nextDrafts;
    });
  }, []);

  const openPickerView = useCallback(() => {
    clearPickerOpenTimeout();
    Keyboard.dismiss();

    pickerOpenTimeoutRef.current = setTimeout(() => {
      setPickerInteractive(true);

      if (snapPoints.length > 1) {
        bottomSheetRef.current?.snapToIndex(1);
        return;
      }

      bottomSheetRef.current?.expand();
    }, KEYBOARD_OPEN_DELAY);
  }, [clearPickerOpenTimeout, snapPoints.length]);

  const expandForKeyboard = useCallback(() => {
    if (collapsedSnapPoint <= 0) {
      return;
    }

    setKeyboardVisible(true);
    setPickerInteractive(false);
    bottomSheetRef.current?.snapToPosition(
      keyboardHeightRef.current + collapsedSnapPoint + bottom + 28,
    );
  }, [bottom, collapsedSnapPoint]);

  useEffect(() => {
    const handleKeyboardShow = (event: KeyboardEvent) => {
      clearKeyboardHideTimeout();
      keyboardHeightRef.current = event?.endCoordinates?.height || 0;
      expandForKeyboard();
    };

    const keyboardWillShow = Keyboard.addListener(
      "keyboardWillShow",
      handleKeyboardShow,
    );

    const keyboardDidShow = Keyboard.addListener("keyboardDidShow", (event) => {
      clearKeyboardHideTimeout();
      keyboardHeightRef.current = event.endCoordinates?.height || 0;

      if (keyboardHeightRef.current > 0) {
        return;
      }

      expandForKeyboard();
    });

    const keyboardDidHide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
      clearKeyboardHideTimeout();

      keyboardHideTimeoutRef.current = setTimeout(() => {
        setPickerInteractive(true);
      }, KEYBOARD_CLOSE_DELAY);
    });

    const keyboardWillHide = Keyboard.addListener("keyboardWillHide", () => {
      bottomSheetRef.current?.snapToIndex(0);
    });

    return () => {
      clearKeyboardHideTimeout();
      clearPickerOpenTimeout();
      keyboardWillShow.remove();
      keyboardDidShow.remove();
      keyboardDidHide.remove();
      keyboardWillHide.remove();
    };
  }, [clearKeyboardHideTimeout, clearPickerOpenTimeout, expandForKeyboard]);

  if (groups.length === 0 || snapPoints.length === 0 || contentHeight === 0) {
    return (
      <View
        style={styles.measurementContainer}
        pointerEvents={"none"}
        accessibilityElementsHidden={true}
        importantForAccessibility={"no-hide-descendants"}
      >
        <View
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;
            if (nextHeight > 0 && nextHeight !== collapsedHeight) {
              setCollapsedHeight(nextHeight);
            }
          }}
          style={[styles.measurementContent, styles.groupsRow]}
        >
          {groups.map((group) => {
            const visibleInputs = group.inputs.filter(
              (input) => input.textInput !== false,
            );
            const sourceInput = visibleInputs[0];
            const renderSharedField = hasSharedTextField(group);

            return (
              <View key={group.id} style={styles.groupBlock}>
                {renderSharedField ? (
                  <View style={styles.inputRow}>
                    <ReactNativeTextInput
                      editable={false}
                      style={styles.hiddenMeasurementInput}
                      value={
                        group.textInputValue ??
                        (sourceInput ? formatInputValue(sourceInput) : "")
                      }
                    />
                  </View>
                ) : (
                  visibleInputs.map((input) => (
                    <View key={input.id} style={styles.inputRow}>
                      <ReactNativeTextInput
                        editable={false}
                        style={styles.hiddenMeasurementInput}
                        value={formatInputValue(input)}
                      />
                    </View>
                  ))
                )}
              </View>
            );
          })}
        </View>

        <View
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;
            if (nextHeight > 0 && nextHeight !== pickerHeight) {
              setPickerHeight(nextHeight);
            }
          }}
          style={[styles.measurementContent, styles.groupsRow]}
        >
          {groups.map((group) => (
            <View key={group.id} style={styles.pickerGroup}>
              {group.inputs.map((input) => (
                <View key={input.id} style={styles.pickerSlot}>
                  <WheelPicker
                    className={"flex-1 justify-center"}
                    data={input.pickerData}
                    label={input.label}
                    value={input.value}
                    onValueChanged={() => {}}
                  />
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <BottomSheet
      animationConfigs={{ duration: 200 }}
      animateOnMount={false}
      animatedIndex={animatedIndex}
      backdropComponent={() =>
        keyboardVisible ? (
          <Pressable
            onPress={Keyboard.dismiss}
            style={StyleSheet.absoluteFill}
          />
        ) : null
      }
      enableDynamicSizing={false}
      enableOverDrag={false}
      enablePanDownToClose={false}
      handleIndicatorStyle={styles.handleIndicator}
      index={0}
      keyboardBehavior={"interactive"}
      ref={assignBottomSheetRef}
      snapPoints={snapPoints}
      style={styles.bottomSheet}
    >
      <BottomSheetView style={styles.sheetContainer}>
        <View
          style={[
            styles.contentContainer,
            {
              minHeight: contentHeight,
            },
          ]}
        >
          <Animated.View
            onLayout={(event) => {
              const nextHeight = event.nativeEvent.layout.height;
              if (nextHeight > 0 && nextHeight !== collapsedHeight) {
                setCollapsedHeight(nextHeight);
              }
            }}
            style={[styles.firstView, styles.groupsRow, firstViewAnimatedStyle]}
          >
            {groups.map((group) => {
              const visibleInputs = group.inputs.filter(
                (input) => input.textInput !== false,
              );
              const renderSharedField = hasSharedTextField(group);
              const sourceInput = visibleInputs[0];
              const sharedFieldId = `${group.id}-text-input`;

              const renderTextField = (
                id: string,
                value: string,
                onChangeText: (value: string) => void,
                label?: string,
                placeholder?: string,
                maxLength?: number,
                keyboardType?: AnyInputProps["keyboardType"],
                inputMode?: AnyInputProps["inputMode"],
                fallbackValue?: PickerInputModalValue,
              ) => {
                const displayValue =
                  focusedTextFieldId === id && textDrafts[id] !== undefined
                    ? textDrafts[id]
                    : value;

                return (
                  <View key={id} style={styles.inputRow}>
                    <ReactNativeTextInput
                      className={"bg-background color-foreground border-card"}
                      inputMode={inputMode}
                      keyboardType={
                        keyboardType ??
                        (typeof fallbackValue === "number"
                          ? "numeric"
                          : "default")
                      }
                      maxLength={maxLength}
                      onBlur={() => {
                        clearTextDraft(id);
                        setFocusedTextFieldId((currentId) =>
                          currentId === id ? null : currentId,
                        );
                      }}
                      onChangeText={(nextValue) => {
                        setTextDraft(id, nextValue);
                        onChangeText(nextValue);
                      }}
                      onFocus={() => {
                        setFocusedTextFieldId(id);
                        setTextDraft(id, value);
                      }}
                      selectTextOnFocus={true}
                      style={styles.textInput}
                      value={displayValue}
                      placeholder={placeholder}
                      placeholderTextColor={"#6b7280"}
                    />

                    <Pressable
                      className={"border-card"}
                      onPress={openPickerView}
                      style={styles.labelButton}
                    >
                      <Text
                        className={clsx(
                          "text-foreground",
                          !label && "opacity-70",
                        )}
                        numberOfLines={1}
                        style={styles.labelButtonText}
                      >
                        {label ?? "Select"}
                      </Text>
                    </Pressable>
                  </View>
                );
              };

              if (renderSharedField) {
                const sharedValue =
                  group.textInputValue ??
                  (sourceInput ? formatInputValue(sourceInput) : "");

                return (
                  <View key={group.id} style={styles.groupBlock}>
                    {renderTextField(
                      sharedFieldId,
                      sharedValue,
                      (nextValue) => {
                        if (group.onTextInputValueChange) {
                          group.onTextInputValueChange(nextValue);
                          return;
                        }

                        if (sourceInput) {
                          parseInputValue(sourceInput, nextValue);
                        }
                      },
                      group.label ?? sourceInput?.label,
                      group.placeholder ?? sourceInput?.placeholder,
                      group.maxLength ?? sourceInput?.maxLength,
                      group.keyboardType ?? sourceInput?.keyboardType,
                      group.inputMode ?? sourceInput?.inputMode,
                      sourceInput?.value,
                    )}
                  </View>
                );
              }

              return (
                <View key={group.id} style={styles.groupBlock}>
                  {visibleInputs.map((input) =>
                    renderTextField(
                      input.id,
                      formatInputValue(input),
                      (nextValue) => parseInputValue(input, nextValue),
                      input.label,
                      input.placeholder,
                      input.maxLength,
                      input.keyboardType,
                      input.inputMode,
                      input.value,
                    ),
                  )}
                </View>
              );
            })}
          </Animated.View>

          {pickerInteractive && (
            <Animated.View
              onLayout={(event) => {
                const nextHeight = event.nativeEvent.layout.height;
                if (nextHeight > 0 && nextHeight !== pickerHeight) {
                  setPickerHeight(nextHeight);
                }
              }}
              pointerEvents={pickerInteractive ? "auto" : "none"}
              style={[
                styles.secondView,
                styles.groupsRow,
                secondViewAnimatedStyle,
              ]}
              className={"bg-blue-600"}
            >
              {groups.map((group) => (
                <View key={group.id} style={styles.pickerGroup}>
                  {group.inputs.map((input) => (
                    <View key={input.id} style={styles.pickerSlot}>
                      <WheelPicker
                        className={clsx(
                          "flex-1 justify-center",
                          input.pickerClassName,
                        )}
                        data={input.pickerData}
                        itemHeight={input.pickerItemHeight}
                        itemTextClassName={input.pickerItemTextClassName}
                        label={input.label}
                        labelClassName={input.pickerLabelClassName}
                        onEndReached={input.onPickerEndReached}
                        onEndReachedThreshold={
                          input.onPickerEndReachedThreshold
                        }
                        onValueChanged={(event) => {
                          input.onValueChange(
                            event.item.value as PickerInputModalValue,
                          );
                        }}
                        value={input.value}
                        visibleItemCount={input.pickerVisibleItemCount}
                      />
                    </View>
                  ))}
                </View>
              ))}
            </Animated.View>
          )}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
});

PickerInputModalRoot.displayName = "PickerInputModal";

export const PickerInputModal = Object.assign(PickerInputModalRoot, {
  Input: PickerInputModalInput,
  InputGroup: PickerInputModalInputGroup,
}) as PickerInputModalCompoundComponent;

export { PickerInputModalInput, PickerInputModalInputGroup };

export default PickerInputModal;

const styles = StyleSheet.create({
  bottomSheet: {
    zIndex: 100,
  },
  contentContainer: {
    width: "100%",
    position: "relative",
  },
  firstView: {
    width: "100%",
  },
  groupBlock: {
    flex: 1,
    gap: 12,
    minWidth: 0,
  },
  groupsRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  handleIndicator: {
    backgroundColor: "#cbd5e1",
    height: 4,
    marginVertical: 10,
    width: "30%",
  },
  hiddenMeasurementInput: {
    fontSize: 18,
    fontWeight: "600",
    opacity: 0,
    paddingVertical: 14,
  },
  inputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  labelButton: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 56,
    minWidth: 88,
    paddingHorizontal: 14,
  },
  labelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  measurementContainer: {
    left: 0,
    opacity: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  measurementContent: {
    width: "100%",
  },
  pickerGroup: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    minWidth: 0,
  },
  pickerSlot: {
    flex: 1,
    minHeight: 200,
  },
  secondView: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: "100%",
  },
  sheetContainer: {
    alignItems: "center",
    paddingBottom: 16,
    paddingHorizontal: 20,
    width: "100%",
  },
  textInput: {
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 14,
    textAlign: "center",
  },
});
