import type { ChartType } from '../../domain/types';

export const toChartType = (v: string): ChartType => (v === 'bar' || v === 'line' || v === 'pie' ? v : 'bar');
