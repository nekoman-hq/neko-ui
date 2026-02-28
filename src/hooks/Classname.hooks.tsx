import { cssInterop } from "nativewind";
import React from "react";

type CssInteropComponent = Parameters<typeof cssInterop>[0];
type CssInteropConfig = Parameters<typeof cssInterop>[1];

type ClassNameMapping = {
  target: string;
  nativeStyleToProp?: Record<string, boolean | string>;
};

type InteropConfig = Record<string, ClassNameMapping | string>;

type WithNewProps<T extends CssInteropComponent, C extends InteropConfig> = {
  <P>(
    props: React.ComponentPropsWithRef<T> & { [K in keyof C]?: string } & {
      data?: P[];
    },
  ): React.ReactElement;
};

export const useComponentInterop = <
  T extends CssInteropComponent,
  C extends InteropConfig,
>(
  component: T,
  config?: C,
): WithNewProps<T, C> => {
  const resolvedConfig = (config ?? {
    className: {
      target: "style",
      nativeStyleToProp: { color: true },
    },
  }) as CssInteropConfig;

  cssInterop(component, resolvedConfig);
  return component as unknown as WithNewProps<T, C>;
};
