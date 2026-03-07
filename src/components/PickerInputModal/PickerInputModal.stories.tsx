import React, { useMemo, useState } from "react";
import { Meta } from "@storybook/react-native";
import { View } from "react-native";
import {
  PickerInputModal,
  PickerInputModalInput,
  PickerInputModalInputGroup,
} from "./PickerInputModal";

const wholeNumberData = Array.from({ length: 201 }, (_, index) => index);
const repsData = Array.from({ length: 51 }, (_, index) => index);
const quarterData = [
  { label: "-", value: 0 },
  { label: "1/4", value: 0.25 },
  { label: "1/2", value: 0.5 },
  { label: "3/4", value: 0.75 },
];

const meta: Meta<typeof PickerInputModal> = {
  title: "Components/PickerInputModal",
  component: PickerInputModal,
};

export default meta;

const StoryFrame = ({ children }: { children: React.ReactNode }) => {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 720,
      }}
    >
      {children}
    </View>
  );
};

export const SingleInput = {
  render: () => {
    const [weight, setWeight] = useState(10);

    return (
      <PickerInputModal>
        <PickerInputModalInput
          value={weight}
          onValueChange={setWeight}
          data={wholeNumberData}
          keyboardType={"numeric"}
          label={"kg"}
        />
      </PickerInputModal>
    );
  },
};

export const MultipleInputs = {
  render: () => {
    const [weight, setWeight] = useState(10);
    const [reps, setReps] = useState(12);

    return (
      <StoryFrame>
        <PickerInputModal>
          <PickerInputModalInput
            value={weight}
            onValueChange={setWeight}
            data={wholeNumberData}
            keyboardType={"numeric"}
          />

          <PickerInputModalInput
            value={reps}
            onValueChange={setReps}
            data={repsData}
            keyboardType={"numeric"}
            label={"reps"}
          />
        </PickerInputModal>
      </StoryFrame>
    );
  },
};

export const GroupedDecimal = {
  render: () => {
    const [weight, setWeight] = useState(10);
    const [weightQuarter, setWeightQuarter] = useState(0.25);
    const [reps, setReps] = useState(12);

    const weightTextValue = useMemo(() => {
      const fractionalPart = quarterData.find(
        (item) => item.value === weightQuarter,
      )?.value;

      if (!fractionalPart) {
        return String(weight);
      }

      return `${weight + fractionalPart}`;
    }, [weight, weightQuarter]);

    return (
      <StoryFrame>
        <PickerInputModal>
          <PickerInputModalInputGroup
            inputMode={"decimal"}
            keyboardType={"decimal-pad"}
            label={"kg"}
            onTextInputValueChange={(nextValue) => {
              const normalizedValue = nextValue.replace(",", ".");
              const parsedValue = Number(normalizedValue);

              if (Number.isNaN(parsedValue)) {
                return;
              }

              const roundedInteger = Math.trunc(parsedValue);
              const decimals = parsedValue - roundedInteger;
              const nearestQuarter =
                quarterData.reduce((closestValue, item) => {
                  const currentDiff = Math.abs(item.value - decimals);
                  const closestDiff = Math.abs(closestValue - decimals);

                  if (currentDiff < closestDiff) {
                    return item.value;
                  }

                  return closestValue;
                }, 0) ?? 0;

              setWeight(roundedInteger);
              setWeightQuarter(nearestQuarter);
            }}
            textInputValue={weightTextValue}
          >
            <PickerInputModalInput
              value={weight}
              onValueChange={setWeight}
              data={wholeNumberData}
              label={"kg"}
            />

            <PickerInputModalInput
              value={weightQuarter}
              onValueChange={setWeightQuarter}
              data={quarterData}
              label={"fraction"}
              textInput={false}
            />
          </PickerInputModalInputGroup>

          <PickerInputModalInput
            value={reps}
            onValueChange={setReps}
            data={repsData}
            keyboardType={"numeric"}
            label={"reps"}
          />
        </PickerInputModal>
      </StoryFrame>
    );
  },
};
