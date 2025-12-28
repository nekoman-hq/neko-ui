import { LucideIcon } from "lucide-react-native";
import { cssInterop } from "nativewind";
import {Check} from "lucide-react-native/icons";

function iconWithClassName(icon: LucideIcon) {
    cssInterop(icon, {
        className: {
            target: "style",
            nativeStyleToProp: {
                color: true,
            },
        },
    });
}

iconWithClassName(Check);

export { Check };
