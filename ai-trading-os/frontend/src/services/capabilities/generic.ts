import { IndicatorCapability } from '@/types/indicatorCapability';

export const GenericCapability: IndicatorCapability = {
    id: 'generic_standard_v1',
    ui_version: '1.0.0',
    sections: [
        {
            id: 'main_settings',
            title: 'General Settings',
            description: 'Basic configuration for standard indicators',
            controls: [
                {
                    id: 'period',
                    type: 'number',
                    label: 'Period / Length',
                    bind: 'period',
                    default: 14,
                    min: 1,
                    max: 200,
                    step: 1
                },
                {
                    id: 'source',
                    type: 'select',
                    label: 'Source Data',
                    bind: 'source',
                    default: 'close',
                    options: [
                        { value: 'close', label: 'Close Price' },
                        { value: 'open', label: 'Open Price' },
                        { value: 'high', label: 'High' },
                        { value: 'low', label: 'Low' },
                        { value: 'hl2', label: 'HL2' },
                        { value: 'hlc3', label: 'HLC3' },
                        { value: 'ohlc4', label: 'OHLC4' }
                    ]
                }
            ]
        },
        {
            id: 'visuals',
            title: 'Style & Display',
            controls: [
                {
                    id: 'color',
                    type: 'color',
                    label: 'Main Logic Color',
                    bind: 'color',
                    default: '#3b82f6'
                },
                {
                    id: 'show_labels',
                    type: 'toggle',
                    label: 'Show Signal Labels',
                    bind: 'show_labels',
                    default: true
                }
            ]
        }
    ]
};
