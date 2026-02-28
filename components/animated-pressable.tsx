import React from "react";
import { Pressable, type PressableProps } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESS_CONFIG = { duration: 100, easing: Easing.out(Easing.quad) };
const RELEASE_CONFIG = { duration: 140, easing: Easing.out(Easing.quad) };

interface ScalePressableProps extends PressableProps {
    scaleDown?: number;
    children: React.ReactNode;
    style?: any;
}

export function ScalePressable({
    scaleDown = 0.98,
    children,
    style,
    onPressIn,
    onPressOut,
    ...rest
}: ScalePressableProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <AnimatedPressable
            style={[animatedStyle, style]}
            onPressIn={(e) => {
                scale.value = withTiming(scaleDown, PRESS_CONFIG);
                onPressIn?.(e);
            }}
            onPressOut={(e) => {
                scale.value = withTiming(1, RELEASE_CONFIG);
                onPressOut?.(e);
            }}
            {...rest}
        >
            {children}
        </AnimatedPressable>
    );
}
