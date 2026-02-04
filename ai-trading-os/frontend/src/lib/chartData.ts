// frontend/src/lib/chartData.ts

/**
 * Interface สำหรับข้อมูลจุดบนกราฟ
 */
export interface ChartDataItem {
    name: string;
    price: number;
    timestamp: number;
}

// ค่าเริ่มต้นสำหรับการ simulate ราคา
let currentPrice = 100;
let timeIndex = 0;

/**
 * Generate mock real-time chart data
 * @param numPoints - จำนวน data points ที่ต้องการ (default: 20)
 * @returns Array ของ ChartDataItem
 */
export const generateRealtimeChartData = (numPoints: number = 20): ChartDataItem[] => {
    const data: ChartDataItem[] = [];
    const now = Date.now();

    for (let i = 0; i < numPoints; i++) {
        // Simulate price fluctuation with random walk
        currentPrice += (Math.random() - 0.5) * 5;

        // กำหนดขอบเขตราคาไม่ให้เกินกว่าที่กำหนด
        if (currentPrice < 80) currentPrice = 80;
        if (currentPrice > 120) currentPrice = 120;

        data.push({
            name: `T${timeIndex + i}`,
            price: parseFloat(currentPrice.toFixed(2)),
            timestamp: now + i * 2000,
        });
    }

    timeIndex += numPoints;
    return data;
};

/**
 * Generate ข้อมูลจุดเดียวสำหรับเพิ่มเข้า array ที่มีอยู่
 * @returns ChartDataItem จุดเดียว
 */
export const generateSingleDataPoint = (): ChartDataItem => {
    // Simulate price fluctuation
    currentPrice += (Math.random() - 0.5) * 5;

    // กำหนดขอบเขตราคา
    if (currentPrice < 80) currentPrice = 80;
    if (currentPrice > 120) currentPrice = 120;

    timeIndex += 1;

    return {
        name: `T${timeIndex}`,
        price: parseFloat(currentPrice.toFixed(2)),
        timestamp: Date.now(),
    };
};

/**
 * Reset state สำหรับ testing หรือ reinitialize
 */
export const resetChartState = (initialPrice: number = 100): void => {
    currentPrice = initialPrice;
    timeIndex = 0;
};
