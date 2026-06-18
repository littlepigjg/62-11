import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useDashboardStore } from '../../store/dashboard';
import { getTheme, getEChartsOption } from './theme';
import type { TrendData } from '../../types';

interface TrendChartProps {
  data?: TrendData;
  compareData?: TrendData | null;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, compareData }) => {
  const { theme, compareMode, showDrilldown } = useDashboardStore();
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

    const series: any[] = [
      {
        name: '任务总数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: data.tasks_count,
        lineStyle: { width: 3, color: colors.primary },
        itemStyle: { color: colors.primary },
        areaStyle: compareMode
          ? undefined
          : {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: colors.primary + '40' },
                  { offset: 1, color: colors.primary + '05' },
                ],
              },
            },
      },
      {
        name: '成功数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        data: data.success_count,
        lineStyle: { width: 2, color: colors.success },
        itemStyle: { color: colors.success },
      },
      {
        name: '失败数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        data: data.failed_count,
        lineStyle: { width: 2, color: colors.danger },
        itemStyle: { color: colors.danger },
      },
    ];

    if (compareMode && compareData) {
      series.push({
        name: '上周期任务总数',
        type: 'line',
        smooth: true,
        symbol: 'diamond',
        symbolSize: 6,
        data: compareData.tasks_count,
        lineStyle: { width: 2, type: 'dashed', color: colors.info },
        itemStyle: { color: colors.info },
      });
    }

    return {
      ...baseOption,
      tooltip: {
        ...baseOption.tooltip,
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        ...baseOption.legend,
        top: 0,
        right: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 40,
        containLabel: true,
      },
      xAxis: {
        ...baseOption.xAxis,
        type: 'category',
        boundaryGap: false,
        data: data.time_points.map(t => t.split(' ').pop() || t),
      },
      yAxis: [
        {
          ...baseOption.yAxis,
          type: 'value',
          name: '任务数',
          position: 'left',
        },
        {
          ...baseOption.yAxis,
          type: 'value',
          name: '耗时(s)',
          position: 'right',
          splitLine: { show: false },
        },
      ],
      series,
    };
  }, [data, compareData, compareMode, baseOption, colors]);

  const onChartClick = (params: any) => {
    if (params.componentType === 'series') {
      showDrilldown('server', `${params.name} - 数据明细`);
    }
  };

  const onEvents = {
    click: onChartClick,
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'canvas' }}
      onEvents={onEvents}
    />
  );
};

export default TrendChart;
