import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useDashboardStore } from '../../store/dashboard';
import { getTheme, getEChartsOption } from './theme';
import type { ServerDistribution } from '../../types';

interface ServerChartProps {
  data?: ServerDistribution[];
}

const ServerDistributionChart: React.FC<ServerChartProps> = ({ data }) => {
  const { theme, showDrilldown } = useDashboardStore();
  const themeConfig = getTheme(theme);
  const baseOption = getEChartsOption(theme);
  const colors = themeConfig.colors;

  const option = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        ...baseOption,
        title: { text: '暂无数据', left: 'center', top: 'center' },
      };
    }

    const sortedData = [...data].sort((a, b) => b.total - a.total).slice(0, 10);

    return {
      ...baseOption,
      tooltip: {
        ...baseOption.tooltip,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
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
        data: sortedData.map(d => d.server_name),
        axisLabel: {
          rotate: 30,
          interval: 0,
          color: themeConfig.textSecondary,
        },
      },
      yAxis: {
        ...baseOption.yAxis,
        type: 'value',
      },
      series: [
        {
          name: '成功',
          type: 'bar',
          stack: 'total',
          data: sortedData.map(d => d.success),
          itemStyle: { color: colors.success },
          barWidth: '50%',
        },
        {
          name: '失败',
          type: 'bar',
          stack: 'total',
          data: sortedData.map(d => d.failed),
          itemStyle: { color: colors.danger },
          barWidth: '50%',
        },
      ],
    };
  }, [data, baseOption, colors, themeConfig.textSecondary]);

  const onChartClick = (params: any) => {
    if (params.componentType === 'series' && data) {
      const item = data.find(d => d.server_name === params.name);
      if (item) {
        showDrilldown('server', `${item.server_name} - 任务明细`, { server_id: item.server_id });
      }
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

export default ServerDistributionChart;
