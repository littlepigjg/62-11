import React from 'react';
import { Tooltip, Spin } from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  FileDoneOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DesktopOutlined,
  CloudServerOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { DashboardKPI } from '../../types';
import { useDashboardStore } from '../../store/dashboard';
import './styles.css';

interface KPICardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  colorClass?: 'primary' | 'success' | 'warning' | 'danger';
  suffix?: string;
  precision?: number;
  onClick?: () => void;
  loading?: boolean;
}

const formatValue = (value: number | string, precision = 0, suffix = ''): string => {
  if (typeof value === 'string') return value + suffix;
  if (precision > 0) {
    return value.toFixed(precision) + suffix;
  }
  if (value >= 10000) {
    return (value / 10000).toFixed(1) + '万' + suffix;
  }
  return value.toLocaleString() + suffix;
};

const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  icon,
  trend,
  trendLabel,
  colorClass = 'primary',
  suffix = '',
  precision = 0,
  onClick,
  loading = false,
}) => (
  <div className="kpi-card" onClick={onClick}>
    <Spin spinning={loading} size="small">
      <div className="kpi-card-label">{label}</div>
      <div className={`kpi-card-value ${colorClass}`}>
        {formatValue(value, precision, suffix)}
      </div>
      {trend !== undefined && (
        <div className={`kpi-card-trend ${trend >= 0 ? 'up' : 'down'}`}>
          {trend >= 0 ? <RiseOutlined /> : <FallOutlined />}
          {Math.abs(trend).toFixed(1)}%
          {trendLabel && <span style={{ marginLeft: 4 }}>{trendLabel}</span>}
        </div>
      )}
      <div className="kpi-card-icon">{icon}</div>
    </Spin>
  </div>
);

const KPISection: React.FC = () => {
  const { currentData, compareMode, compareData, loading, showDrilldown } = useDashboardStore();
  const kpi: DashboardKPI | null = currentData?.kpi || null;
  const prevKpi = compareData?.kpi || null;

  const getCompareTrend = (current: number | undefined, prev: number | undefined): number | undefined => {
    if (current === undefined || prev === undefined || prev === 0) return undefined;
    return ((current - prev) / prev) * 100;
  };

  return (
    <div className="kpi-grid" id="kpi-section">
      <Tooltip title="点击查看所有任务详情">
        <KPICard
          label="任务执行总量"
          value={kpi?.total_tasks || 0}
          icon={<FileDoneOutlined />}
          colorClass="primary"
          trend={compareMode ? (kpi?.tasks_trend ?? getCompareTrend(kpi?.total_tasks, prevKpi?.total_tasks)) : undefined}
          trendLabel={compareMode ? 'vs 上周期' : undefined}
          loading={loading}
          onClick={() => showDrilldown('server', '任务执行明细')}
        />
      </Tooltip>

      <Tooltip title="点击查看成功任务">
        <KPICard
          label="执行成功率"
          value={kpi?.success_rate || 0}
          icon={<CheckCircleOutlined />}
          colorClass={kpi && kpi.success_rate >= 90 ? 'success' : kpi && kpi.success_rate >= 70 ? 'warning' : 'danger'}
          suffix="%"
          precision={1}
          trend={compareMode ? (kpi?.success_rate_trend ?? getCompareTrend(kpi?.success_rate, prevKpi?.success_rate)) : undefined}
          trendLabel={compareMode ? 'vs 上周期' : undefined}
          loading={loading}
          onClick={() => showDrilldown('success', '成功任务列表')}
        />
      </Tooltip>

      <Tooltip title="平均执行耗时">
        <KPICard
          label="平均执行耗时"
          value={kpi?.avg_duration_seconds || 0}
          icon={<ClockCircleOutlined />}
          colorClass="warning"
          suffix="s"
          precision={2}
          loading={loading}
        />
      </Tooltip>

      <Tooltip title="活跃服务器数（有任务执行的服务器）">
        <KPICard
          label="活跃服务器"
          value={`${kpi?.active_servers || 0} / ${kpi?.total_servers || 0}`}
          icon={<DesktopOutlined />}
          colorClass="primary"
          loading={loading}
        />
      </Tooltip>

      <Tooltip title="服务器在线率">
        <KPICard
          label="服务器在线率"
          value={kpi?.server_online_rate || 0}
          icon={<CloudServerOutlined />}
          colorClass={kpi && kpi.server_online_rate >= 95 ? 'success' : kpi && kpi.server_online_rate >= 80 ? 'warning' : 'danger'}
          suffix="%"
          precision={1}
          loading={loading}
        />
      </Tooltip>

      <Tooltip title="点击查看失败任务">
        <KPICard
          label="失败任务数"
          value={kpi?.failed_tasks || 0}
          icon={<ThunderboltOutlined />}
          colorClass={kpi && kpi.failed_tasks > 0 ? 'danger' : 'success'}
          loading={loading}
          onClick={() => showDrilldown('failed', '失败任务列表')}
        />
      </Tooltip>
    </div>
  );
};

export default KPISection;
