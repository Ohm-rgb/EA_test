export interface IndicatorCapability {
    id: string;
    name: string;
    version: string;
    sections: Section[];
}

export interface Section {
    id: string;
    title: string;
    description?: string;
    controls: Control[];
}

export type Control =
    | ToggleControl
    | SelectControl
    | NumberControl
    | ColorControl
    | SignalControl;

interface BaseControl {
    id: string;
    label: string;
    description?: string;
    visibleWhen?: {
        controlId: string;
        equals: any;
    };
}

export interface ToggleControl extends BaseControl {
    type: 'toggle';
    defaultValue: boolean;
}

export interface SelectControl extends BaseControl {
    type: 'select';
    defaultValue: string;
    options: { label: string; value: string }[];
}

export interface NumberControl extends BaseControl {
    type: 'number';
    defaultValue: number;
    min?: number;
    max?: number;
    step?: number;
}

export interface ColorControl extends BaseControl {
    type: 'color';
    defaultValue: string;
}

export interface SignalControl extends BaseControl {
    type: 'signal';
    actionMap?: {
        onTrigger?: 'Buy' | 'Sell' | 'Signal';
    };
}
