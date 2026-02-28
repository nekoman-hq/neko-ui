import { LucideIcon } from "lucide-react-native";
import { cssInterop } from "nativewind";
import { useComponentInterop } from "@/src/hooks/Classname.hooks";

export const useIconWithClassname = (icon: LucideIcon) =>
  useComponentInterop(icon, {
    className: { target: "style", nativeStyleToProp: { color: true } },
  });
