import { Colors, Fonts, type AppColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export interface AppTheme {
    colors: AppColorScheme;
    fonts: typeof Fonts;
}

export function useAppTheme(): AppTheme {
    const scheme = useColorScheme();
    const colors = scheme === "dark" ? Colors.dark : Colors.light;
    return { colors, fonts: Fonts };
}
