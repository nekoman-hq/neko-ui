import React, { useMemo, useState } from "react";
import { Meta } from "@storybook/react-native";
import { Alert, Pressable, Text, View } from "react-native";
import {
  PickerInputModal,
  PickerInputModalContent,
  PickerInputModalInput,
  PickerInputModalInputGroup,
} from "./PickerInputModal";
import { Button, ButtonText } from "../Button";
import Animated, { FadeInUp } from "react-native-reanimated";

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

function SingleInputStory() {
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
}

export const SingleInput = {
  render: () => <SingleInputStory />,
};

function MultipleInputsStory() {
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
}

export const MultipleInputs = {
  render: () => <MultipleInputsStory />,
};

function DisabledTextInputStory() {
  const [weight, setWeight] = useState(10);
  const [reps, setReps] = useState(12);

  return (
    <StoryFrame>
      <PickerInputModal>
        <PickerInputModalInput
          value={weight}
          onValueChange={setWeight}
          data={wholeNumberData}
          disabled={true}
          keyboardType={"numeric"}
          label={"kg"}
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
}

export const DisabledTextInput = {
  render: () => <DisabledTextInputStory />,
};

function GroupedDecimalStory() {
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
          className={"flex-2 justify-center !gap-8"}
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
            label={"fr"}
            textInput={false}
          />
        </PickerInputModalInputGroup>

        <PickerInputModalInput
          value={reps}
          onValueChange={setReps}
          data={repsData}
          keyboardType={"numeric"}
          label={"reps"}
          pickerContainerClassName={"w-[35%] items-end"}
        />
      </PickerInputModal>
    </StoryFrame>
  );
}

export const GroupedDecimal = {
  render: () => <GroupedDecimalStory />,
};

function CustomPickerContainersStory() {
  const [weight, setWeight] = useState(10);
  const [weightQuarter, setWeightQuarter] = useState(0.25);
  const [reps, setReps] = useState(12);

  return (
    <StoryFrame>
      <PickerInputModal>
        <PickerInputModalInputGroup
          className={"rounded-[20px] bg-card/40 p-3"}
          label={"kg"}
        >
          <PickerInputModalInput
            value={weight}
            onValueChange={setWeight}
            data={wholeNumberData}
            label={"kg"}
            pickerContainerClassName={"rounded-[16px] bg-card/70 px-2"}
          />

          <PickerInputModalInput
            value={weightQuarter}
            onValueChange={setWeightQuarter}
            data={quarterData}
            label={"fr"}
            pickerContainerClassName={"rounded-[16px] bg-card/70 px-2"}
            textInput={false}
          />
        </PickerInputModalInputGroup>

        <PickerInputModalInput
          value={reps}
          onValueChange={setReps}
          data={repsData}
          keyboardType={"numeric"}
          label={"reps"}
          pickerContainerClassName={"rounded-[20px] bg-card/50 p-3"}
        />
      </PickerInputModal>
    </StoryFrame>
  );
}

export const CustomPickerContainers = {
  render: () => <CustomPickerContainersStory />,
};

function WithContentStory() {
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
          label={"kg"}
        />

        <PickerInputModalInput
          value={reps}
          onValueChange={setReps}
          data={repsData}
          keyboardType={"numeric"}
          label={"reps"}
        />

        <PickerInputModalContent className={"gap-3"}>
          <View
            className={
              "rounded-[20px] border border-card bg-card p-4  py-[100px]"
            }
          >
            <Text className={"text-base font-semibold text-foreground"}>
              Quick summary
            </Text>
            <Text className={"mt-1 text-sm text-muted-foreground"}>
              {weight} kg x {reps} reps
            </Text>
          </View>

          <Button
            onPress={() => Alert.alert("Saved")}
            className={"items-center rounded-[20px] bg-foreground p-4"}
          >
            <ButtonText className={"text-base font-semibold text-background"}>
              Save Set
            </ButtonText>
          </Button>
        </PickerInputModalContent>
      </PickerInputModal>
    </StoryFrame>
  );
}

export const WithContent = {
  render: () => <WithContentStory />,
};

function WithContentInSnapFlowStory() {
  const [weight, setWeight] = useState(10);
  const [reps, setReps] = useState(12);

  return (
    <StoryFrame>
      <PickerInputModal enableContentSnapFlow={true}>
        <PickerInputModalInput
          value={weight}
          onValueChange={setWeight}
          data={wholeNumberData}
          keyboardType={"numeric"}
          label={"kg"}
        />

        <PickerInputModalInput
          value={reps}
          onValueChange={setReps}
          data={repsData}
          keyboardType={"numeric"}
          label={"reps"}
        />

        <PickerInputModalContent className={"gap-3 "}>
          <View
            className={
              "rounded-[20px] border border-card bg-card p-4 py-[100px]"
            }
          >
            <Text className={"text-base font-semibold text-foreground"}>
              Quick summary
            </Text>
            <Text className={"mt-1 text-sm text-muted-foreground"}>
              {weight} kg x {reps} reps
            </Text>
          </View>

          <Button
            onPress={() => Alert.alert("Saved")}
            className={"items-center rounded-[20px] bg-foreground p-4"}
          >
            <ButtonText className={"text-base font-semibold text-background"}>
              Save Set
            </ButtonText>
          </Button>
        </PickerInputModalContent>
      </PickerInputModal>
    </StoryFrame>
  );
}

export const WithContentInSnapFlow = {
  render: () => <WithContentInSnapFlowStory />,
};

function WithContentInSnapFlowExpandedInitiallyStory() {
  const [weight, setWeight] = useState(10);
  const [reps, setReps] = useState(12);

  return (
    <StoryFrame>
      <PickerInputModal
        enableContentSnapFlow={true}
        initialContentExpanded={true}
      >
        <PickerInputModalInput
          value={weight}
          onValueChange={setWeight}
          data={wholeNumberData}
          keyboardType={"numeric"}
          label={"kg"}
        />

        <PickerInputModalInput
          value={reps}
          onValueChange={setReps}
          data={repsData}
          keyboardType={"numeric"}
          label={"reps"}
        />

        <PickerInputModalContent className={"gap-3 "}>
          <View
            className={
              "rounded-[20px] border border-card bg-card p-4 py-[100px]"
            }
          >
            <Text className={"text-base font-semibold text-foreground"}>
              Quick summary
            </Text>
            <Text className={"mt-1 text-sm text-muted-foreground"}>
              {weight} kg x {reps} reps
            </Text>
          </View>

          <Button
            onPress={() => Alert.alert("Saved")}
            className={"items-center rounded-[20px] bg-foreground p-4"}
          >
            <ButtonText className={"text-base font-semibold text-background"}>
              Save Set
            </ButtonText>
          </Button>
        </PickerInputModalContent>
      </PickerInputModal>
    </StoryFrame>
  );
}

export const WithContentInSnapFlowExpandedInitially = {
  render: () => <WithContentInSnapFlowExpandedInitiallyStory />,
};

function WithHiddenContentWhenCollapsedStory() {
  const [weight, setWeight] = useState(10);
  const [reps, setReps] = useState(12);

  return (
    <StoryFrame>
      <PickerInputModal enableContentSnapFlow={true}>
        <PickerInputModalInput
          value={weight}
          onValueChange={setWeight}
          data={wholeNumberData}
          keyboardType={"numeric"}
          label={"kg"}
        />

        <PickerInputModalInput
          value={reps}
          onValueChange={setReps}
          data={repsData}
          keyboardType={"numeric"}
          label={"reps"}
        />

        <PickerInputModalContent className={"gap-3 "} hideWhenCollapsed={true}>
          <Pressable
            onPress={() => Alert.alert("Press")}
            className={
              "rounded-[20px] border border-card bg-card p-4 py-[100px]"
            }
          >
            <Text className={"text-base font-semibold text-foreground"}>
              Quick summary
            </Text>
            <Animated.Text
              entering={FadeInUp.duration(700)}
              className={"mt-1 text-sm text-muted-foreground"}
            >
              {weight} kg x {reps} reps
            </Animated.Text>
          </Pressable>

          <Button
            onPress={() => Alert.alert("Saved")}
            className={"items-center rounded-[20px] bg-foreground p-4"}
          >
            <ButtonText className={"text-base font-semibold text-background"}>
              Save Set
            </ButtonText>
          </Button>
        </PickerInputModalContent>
      </PickerInputModal>
    </StoryFrame>
  );
}

export const WithHiddenContentWhenCollapsed = {
  render: () => <WithHiddenContentWhenCollapsedStory />,
};
