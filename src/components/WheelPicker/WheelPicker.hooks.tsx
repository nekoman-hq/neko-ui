import { useCallback, useEffect, useRef, useState } from "react";
import { useAnimatedReaction, type SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

type SetStateAction<T> = T | ((prev: T) => T);

export function usePickerState<T>(
  sharedValue: SharedValue<T>,
  initialState: T,
): [T, (value: SetStateAction<T>) => void] {
  const [state, setStateInternal] = useState<T>(initialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const syncStateFromSharedValue = useCallback((next: T) => {
    setStateInternal((prev) => (Object.is(prev, next) ? prev : next));
  }, []);

  const setState = useCallback(
    (next: SetStateAction<T>) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: T) => T)(stateRef.current)
          : next;

      if (!Object.is(sharedValue.value, resolved)) {
        sharedValue.value = resolved;
      }

      setStateInternal((prev) => (Object.is(prev, resolved) ? prev : resolved));
    },
    [sharedValue],
  );

  useAnimatedReaction(
    () => sharedValue.value,
    (current, previous) => {
      if (!Object.is(current, previous)) {
        scheduleOnRN(syncStateFromSharedValue, current);
      }
    },
  );

  useEffect(() => {
    const next = sharedValue.value;
    stateRef.current = next;
    setStateInternal(next);
  }, [sharedValue]);

  return [state, setState];
}
