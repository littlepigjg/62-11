import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useDashboardStore } from '../../store/dashboard';
import { getTheme, getEChartsOption } from './theme';
import type { CommandDistribution } from '../../types';

interface CommandPieChartProps {
  data?: CommandDistribution[];
}

const CommandPieChart: React.FC<CommandPieChartProps> = ({ data }) => {
  const { theme } = useDashboardStore();
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

    const topData = data.slice(0, 8);
    const otherTotal = data.slice(8).reduce((sum, d) => sum + d.total, 0);
    const pieData = topData.map(d => ({
      name: d.command.length > 20 ? d.command.substring(0, 20) + '...' : d.command,
      value: d.total,
      fullName: d.command,
    }));
    if (otherTotal > 0) {
      pieData.push({ name: '其他', value: otherTotal, fullName: '其他命令' });
    }

    return {
      ...baseOption,
      tooltip: {
        ...baseOption.tooltip,
        trigger: 'item',
        formatter: (params: any) => {
          return `<div style="font-weight:600">${params.data.fullName || params.name}</div>
                  <div>数量: ${params.value}</div>
                  <div>占比: ${params.percent}%</div>`;
        },
      },
      legend: {
        ...baseOption.legend,
        type: 'scroll',
        orient: 'vertical',
        right: 10,
        top: 20,
        bottom: 20,
      },
      series: [
        {
          name: '命令分布',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: themeConfig.panelBg,
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              color: themeConfig.textColor,
            },
          },
          labelLine: {
            show: false,
          },
          data: pieData,
          color: colors.series,
        },
      ],
    };
  }, [data, baseOption, colors.series, themeConfig]);

  return (
    <ReactECharts
      option={option}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
};

export default CommandPieChart;
