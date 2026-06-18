import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useDashboardStore } from '../../store/dashboard';
import { getTheme, getEChartsOption } from './theme';
import type { ResourceUsage } from '../../types';

interface ResourceChartProps {
  data?: ResourceUsage;
}

const GaugeChart: React.FC<{ value: number; title: string; unit: string; color: string }> = ({
  value,
  title,
  unit,
  color,
}) => {
  const { theme } = useDashboardStore();
  const themeConfig = getTheme(theme);

  const option = useMemo(
    () => ({
      series: [
        {
          type: 'gauge',
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: 100,
          splitNumber: 10,
          radius: '90%',
          itemStyle: {
            color: value >= 90 ? '#ff4d4f' : value >= 70 ? '#faad14' : color,
          },
          progress: {
            show: true,
            width: 12,
            roundCap: true,
          },
          pointer: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              width: 12,
              color: [[1, themeConfig.borderColor]],
            },
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            show: false,
          },
          axisLabel: {
            show: false,
          },
          title: {
            offsetCenter: [0, '40%'],
            fontSize: 13,
            color: themeConfig.textSecondary,
          },
          detail: {
            valueAnimation: true,
            offsetCenter: [0, '5%'],
            fontSize: 28,
            fontWeight: 'bold',
            color: value >= 90 ? '#ff4d4f' : value >= 70 ? '#faad14' : color,
            formatter: `{value}${unit}`,
          },
          data: [{ value: value.toFixed(1), name: title }],
        },
      ],
    }),
    [value, title, unit, color, themeConfig]
  );

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />;
};

const ResourceChart: React.FC<ResourceChartProps> = ({ data }) => {
  const { theme } = useDashboardStore();
  const colors = getTheme(theme).colors;

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary, #6b7280)' }}>
        暂无数据
      </div>
    );
  }

  return (
    <div className="resource-gauge-container">
      <div style={{ height: '160px' }}>
        <GaugeChart value={data.cpu_usage} title="CPU 使用率" unit="%" color={colors.primary} />
      </div>
      <div style={{ height: '160px' }}>
        <GaugeChart value={data.memory_usage} title="内存使用率" unit="%" color={colors.success} />
      </div>
      <div style={{ height: '160px' }}>
        <GaugeChart value={data.disk_usage} title="磁盘使用率" unit="%" color={colors.warning} />
      </div>
    </div>
  );
};

export default ResourceChart;
