import React, { memo } from 'react';
import { StrategyPipeline } from '@/components/pipeline/StrategyPipeline';

export const FlowEditor = memo(({ isDark }: { isDark: boolean }) => {
    return (
        <div className="w-full h-full">
            <StrategyPipeline />
        </div>
    );
});

FlowEditor.displayName = 'FlowEditor';
