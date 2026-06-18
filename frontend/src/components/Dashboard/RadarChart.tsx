import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useDashboardStore } from '../../store/dashboard';
import { getTheme, getEChartsOption } from './theme';
import type { RadarData } from '../../types';

interface RadarChartProps {
  data?: RadarData;
  compareData?: RadarData | null;
}

const RadarChart: React.FC<RadarChartProps> = ({ data, compareData }) => {
  const { theme, compareMode } = useDashboardStore();
  const themeConfig = getTheme(theme);
  const baseOption = getEChartsOption(theme);
  const colors = themeConfig.colors;

  const option = useMemo(() => {
    if (!data) {
      return {
        ...baseOption,
        title: { text: '暂无数据', left: 'center', top: 'center' },
      };
    }

    const seriesData: any[] = [
      {
        value: data.values,
        name: '当前周期',
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2, color: colors.primary },
        itemStyle: { color: colors.primary },
        areaStyle: {
          color: {
            type: 'radial',
            x: 0.5,
            y: 0.5,
            r: 0.5,
            colorStops: [
              { offset: 0, color: colors.primary + '60' },
              { offset: 1, color: colors.primary + '10' },
            ],
          },
        },
      },
    ];

    if (compareMode && compareData) {
      seriesData.push({
        value: compareData.values,
        name: '上一周期',
        symbol: 'diamond',
        symbolSize: 6,
        lineStyle: { width: 2, type: 'dashed', color: colors.info },
        itemStyle: { color: colors.info },
        areaStyle: {
          color: {
            type: 'radial',
            x: 0.5,
            y: 0.5,
            r: 0.5,
            colorStops: [
              { offset: 0, color: colors.info + '40' },
              { offset: 1, color: colors.info + '05' },
            ],
          },
        },
      });
    }

    return {
      ...baseOption,
      tooltip: {
        ...baseOption.tooltip,
        trigger: 'item',
      },
      legend: {
        ...baseOption.legend,
        top: 0,
        right: 0,
      },
      radar: {
        indicator: data.indicators,
        shape: 'polygon',
        splitNumber: 4,
        axisName: {
          color: themeConfig.textSecondary,
          fontSize: 12,
        },
        splitLine: {
          lineStyle: {
            color: themeConfig.borderColor,
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: themeConfig.isDark
              ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)']
              : ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.04)'],
          },
        },
        axisLine: {
          lineStyle: {
            color: themeConfig.borderColor,
          },
        },
      },
      series: [
        {
          type: 'radar',
          data: seriesData,
        },
      ],
    };
  }, [data, compareData, compareMode, baseOption, colors, themeConfig]);

  return (
    <ReactECharts
      option={option}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

export default RadarChart;
