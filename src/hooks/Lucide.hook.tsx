import {LucideIcon} from "lucide-react-native";
import {cssInterop} from "nativewind";

export const useIconWithClassname = (icon: LucideIcon) => {
    cssInterop(icon, {
        className: {
            target: "style",
            nativeStyleToProp: {
                color: true,
            },
        },
    });
}
