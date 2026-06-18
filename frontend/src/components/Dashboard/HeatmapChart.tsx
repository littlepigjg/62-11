import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useDashboardStore } from '../../store/dashboard';
import { getTheme, getEChartsOption } from './theme';
import type { HeatmapData } from '../../types';

interface HeatmapChartProps {
  data?: HeatmapData;
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({ data }) => {
  const { theme } = useDashboardStore();
  const themeConfig = getTheme(theme);
  const baseOption = getEChartsOption(theme);
  const colors = themeConfig.colors;

  const option = useMemo(() => {
    if (!data || data.data.length === 0) {
      return {
        ...baseOption,
        title: { text: '暂无数据', left: 'center', top: 'center' },
      };
    }

    const maxValue = Math.max(data.max_value, 1);

    return {
      ...baseOption,
      tooltip: {
        ...baseOption.tooltip,
        position: 'top',
        formatter: (params: any) => {
          return `<div style="font-weight:600">${data.days[params.value[1]]} ${data.hours[params.value[0]]}</div>
                  <div>任务数: ${params.value[2]}</div>`;
        },
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '10%',
        bottom: '15%',
      },
      xAxis: {
        type: 'category',
        data: data.hours,
        splitArea: { show: true },
        axisLabel: {
          color: themeConfig.textSecondary,
          interval: 2,
        },
        axisLine: { lineStyle: { color: themeConfig.borderColor } },
      },
      yAxis: {
        type: 'category',
        data: data.days,
        splitArea: { show: true },
        axisLabel: { color: themeConfig.textSecondary },
        axisLine: { lineStyle: { color: themeConfig.borderColor } },
      },
      visualMap: {
        min: 0,
        max: maxValue,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: {
          color: [
            themeConfig.isDark ? '#1a1a2e' : '#ebedf0',
            colors.primary + '60',
            colors.primary + 'aa',
            colors.primary,
            colors.danger,
          ],
        },
        textStyle: { color: themeConfig.textSecondary },
      },
      series: [
        {
          name: '任务热力图',
          type: 'heatmap',
          data: data.data,
          label: {
            show: false,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };
  }, [data, baseOption, colors, themeConfig]);

  return (
    <ReactECharts
      option={option}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

export default HeatmapChart;
