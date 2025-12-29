import React from 'react';

export interface SliderProps {
    /**
     * Array of snap points (0-1 range)
     * @example [0, 0.25, 0.5, 0.75, 1]
     */
    snapPoints: number[];

    /**
     * Initial value (0-1 range)
     * @default 0
     */
    initialValue?: number;

    /**
     * Callback when value changes continuously during dragging
     * Called on every position update while the slider is being dragged
     * @param value - Current normalized value (0-1 range)
     */
    onValueChange?: (value: number) => void;

    /**
     * Callback when a snap point is reached
     * Triggered when the thumb crosses over a snap point or snaps to one on release
     * @param snapPointIndex - Index of the snap point in the snapPoints array
     * @param value - Normalized value of the snap point (0-1 range)
     */
    onSnapToPoint?: (snapPointIndex: number, value: number) => void;

    /**
     * Width of the slider
     * @default screenWidth - 40
     */
    width?: number;

    /**
     * Height of the slider track
     * @default 4
     */
    trackHeight?: number;

    /**
     * Size of the thumb (diameter in pixels)
     * @default 20
     */
    thumbSize?: number;

    /**
     * Color of the active track (filled portion)
     * @default '#007AFF'
     */
    activeTrackColor?: string;

    /**
     * Color of the inactive track (unfilled portion)
     * @default '#E5E5EA'
     */
    inactiveTrackColor?: string;

    /**
     * Color of the thumb
     * @default '#FFFFFF'
     */
    thumbColor?: string;

    /**
     * Shadow color for the thumb
     * @default '#000000'
     */
    thumbShadowColor?: string;

    /**
     * Minimum distance to snap point (0-1 range) for snapping behavior
     * When the thumb is released within this distance of a snap point, it will snap to it
     * @default 0.1
     * @example 0.05 // Snap only if within 5% of a snap point
     */
    snapThreshold?: number;

    /**
     * Spring animation configuration for thumb animations
     * Controls the physics of the snap animation when released
     * @default { damping: 15, stiffness: 150, mass: 1 }
     */
    springConfig?: {
        /** Damping coefficient - higher values reduce oscillation */
        damping?: number;
        /** Stiffness coefficient - higher values make the spring stiffer */
        stiffness?: number;
        /** Mass of the animated object - higher values make it heavier */
        mass?: number;
    };

    /**
     * Haptic trigger threshold (distance from snap point in 0-1 range)
     * Determines how close to a snap point the thumb must be to trigger haptic feedback
     * @default 0.02
     * @example 0.01 // Trigger haptic when within 1% of a snap point
     */
    hapticTriggerThreshold?: number;

    /**
     * Labels to display for each snap point
     * If provided, should match the length of snapPoints array
     * If length doesn't match, percentage labels will be auto-generated
     * @example ['Min', 'Low', 'Medium', 'High', 'Max']
     */
    labels?: string[];

    /**
     * Color of the step indicators when active (before the thumb)
     * @default activeTrackColor
     */
    activeStepIndicatorColor?: string;

    /**
     * Color of the step indicators when inactive (after the thumb)
     * @default inactiveTrackColor
     */
    inactiveStepIndicatorColor?: string;

    /**
     * Callback when the slider active state changes
     * Called when user starts or stops dragging the slider
     * @param active - True when dragging starts, false when it ends
     */
    onActiveChange?(active: boolean): void;
}