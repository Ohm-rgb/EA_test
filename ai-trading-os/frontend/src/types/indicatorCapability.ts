export type ControlType = 'toggle' | 'select' | 'number' | 'color' | 'signal';

export interface BaseControl {
    id: string;
    label: string;
    description?: string;
    bind: string; // key mapping to indicator.config
}

export interface ToggleControl extends BaseControl {
    type: 'toggle';
    default: boolean;
}

export interface SelectControl extends BaseControl {
    type: 'select';
    options: { label: string; value: string }[];
    default: string;
}

export interface NumberControl extends BaseControl {
    type: 'number';
    min?: number;
    max?: number;
    step?: number;
    default: number;
}

export interface ColorControl extends BaseControl {
    type: 'color';
    default: string;
}

export interface SignalControl extends BaseControl {
    type: 'signal';
    actions: ('Buy' | 'Sell' | 'Close')[];
}

export type Control =
    | ToggleControl
    | SelectControl
    | NumberControl
    | ColorControl
    | SignalControl;

export interface Section {
    id: string;
    title: string;
    description?: string;
    controls: Control[];
}

export interface IndicatorCapability {
    id: string;
    ui_version: string;
    sections: Section[];
}
