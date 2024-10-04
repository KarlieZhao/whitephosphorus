// src/react-heatmap-grid.d.ts

declare module 'react-heatmap-grid' {
    import * as React from 'react';
    interface HeatMapProps {
        xLabels: string[];
        yLabels: string[];
        data: number[][];
        xLabelsLocation?: string;
        xLabelsVisibility?: boolean[];
        xLabelWidth?: number;
        yLabelWidth?: number;
        squares?: boolean;
        height?: number;
        onClick?: (x: number, y: number) => void;
        cellStyle?: (background: string, value: number, min: number, max: number, data: number[], x: number, y: number) => React.CSSProperties;
        cellRender?: (value: number) => React.ReactNode;
        title?: (value: number, unit: string) => string;
    }

    // Declare the HeatMap component
    const HeatMap: React.FC<HeatMapProps>;

    export default HeatMap;
}
