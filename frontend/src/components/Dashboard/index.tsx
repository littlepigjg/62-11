import React, { useEffect, useState } from 'react';
import { Button, Space, Tooltip, Dropdown, Spin, Alert, Segmented, Switch } from 'antd';
import {
  BarChartOutlined,
  ReloadOutlined,
  DownloadOutlined,
  BulbOutlined,
  BulbFilled,
  DesktopOutlined,
  MonitorOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { useDashboardStore } from '../../store/dashboard';
import TimeRangeSelector from './TimeRangeSelector';
import KPISection from './KPISection';
import TrendChart from './TrendChart';
import ServerDistributionChart from './ServerDistributionChart';
import CommandPieChart from './CommandPieChart';
import HeatmapChart from './HeatmapChart';
import RadarChart from './RadarChart';
import ResourceChart from './ResourceChart';
import DrilldownModal from './DrilldownModal';
import { usePDFExport } from './usePDFExport';
import type { ThemeMode } from '../../types';
import dayjs from 'dayjs';
import './styles.css';

const Dashboard: React.FC = () => {
  const {
    theme,
    setTheme,
    currentData,
    compareData,
    compareMode,
    loading,
    error,
    lastUpdateTime,
    fetchData,
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    clearCache,
  } = useDashboardStore();

  const { dashboardRef, exportToPDF } = usePDFExport();
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard_theme') as ThemeMode;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [setTheme]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchData();
    }, refreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval, fetchData]);

  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  const themeMenuItems = [
    {
      key: 'light',
      label: (
        <span>
          <BulbOutlined /> 浅色模式
        </span>
      ),
    },
    {
      key: 'dark',
      label: (
        <span>
          <BulbFilled /> 暗黑模式
        </span>
      ),
    },
    {
      key: 'screen',
      label: (
        <span>
          <MonitorOutlined /> 大屏展示
        </span>
      ),
    },
  ];

  const refreshMenuItems = [
    { key: '30', label: '30秒' },
    { key: '60', label: '1分钟' },
    { key: '300', label: '5分钟' },
    { key: '600', label: '10分钟' },
  ];

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleClearCache = async () => {
    clearCache();
    fetchData(true);
  };

  return (
    <div className="dashboard-container" ref={dashboardRef} id="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <h2 className="dashboard-title">
            <BarChartOutlined /> 决策支持仪表盘
          </h2>
          <TimeRangeSelector />
        </div>
        <div className="dashboard-header-right">
          <Space size="small">
            {theme === 'screen' && (
              <span className="screen-clock">
                <ClockCircleOutlined /> {now.format('YYYY-MM-DD HH:mm:ss')}
              </span>
            )}
            <div className="refresh-indicator">
              <span className="refresh-dot" />
              <span>
                {lastUpdateTime
                  ? `更新于 ${dayjs(lastUpdateTime).format('HH:mm:ss')}`
                  : '加载中...'}
              </span>
            </div>

            <Space.Compact>
              <Tooltip title="自动刷新">
                <Switch
                  checked={autoRefresh}
                  onChange={setAutoRefresh}
                  size="small"
                  checkedChildren={<DatabaseOutlined />}
                  unCheckedChildren={<DatabaseOutlined />}
                />
              </Tooltip>
              {autoRefresh && (
                <Dropdown
                  menu={{
                    items: refreshMenuItems,
                    onClick: ({ key }) => setRefreshInterval(parseInt(key)),
                    selectedKeys: [String(refreshInterval)],
                  }}
                >
                  <Button size="small">{refreshInterval >= 60 ? `${refreshInterval / 60}分` : `${refreshInterval}秒`}</Button>
                </Dropdown>
              )}
            </Space.Compact>

            <Dropdown
              menu={{
                items: themeMenuItems,
                onClick: ({ key }) => setTheme(key as ThemeMode),
                selectedKeys: [theme],
              }}
            >
              <Button icon={theme === 'light' ? <BulbOutlined /> : <BulbFilled />}>
                主题
              </Button>
            </Dropdown>

            <Tooltip title="强制刷新数据">
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
                刷新
              </Button>
            </Tooltip>

            <Tooltip title="清除缓存并重新加载">
              <Button icon={<DatabaseOutlined />} onClick={handleClearCache}>
                清缓存
              </Button>
            </Tooltip>

            <Tooltip title="导出当前仪表盘为 PDF 报告">
              <Button type="primary" icon={<DownloadOutlined />} onClick={() => exportToPDF('决策支持仪表盘报告')}>
                导出PDF
              </Button>
            </Tooltip>
          </Space>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={loading} tip="正在加载仪表盘数据...">
        <KPISection />

        <div className="charts-grid">
          <div className="dashboard-panel span-2">
            <div className="dashboard-panel-title">
              任务执行趋势
              {compareMode && <span className="compare-badge">对比模式</span>}
            </div>
            <div className="chart-container">
              <TrendChart data={currentData?.trend} compareData={compareMode ? compareData?.trend : null} />
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="dashboard-panel-title">服务器任务分布 (Top 10)</div>
            <div className="chart-container">
              <ServerDistributionChart data={currentData?.server_distribution} />
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="dashboard-panel-title">命令/脚本分布</div>
            <div className="chart-container">
              <CommandPieChart data={currentData?.command_distribution} />
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="dashboard-panel-title">
              任务热力图
            </div>
            <div className="chart-container">
              <HeatmapChart data={currentData?.heatmap} />
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="dashboard-panel-title">
              综合效能评估
              {compareMode && <span className="compare-badge">对比模式</span>}
            </div>
            <div className="chart-container">
              <RadarChart data={currentData?.radar} compareData={compareMode ? compareData?.radar : null} />
            </div>
          </div>

          <div className="dashboard-panel span-2">
            <div className="dashboard-panel-title">系统资源使用情况</div>
            <div style={{ padding: '8px 0' }}>
              <ResourceChart data={currentData?.resource_usage} />
            </div>
          </div>
        </div>
      </Spin>

      <DrilldownModal />
    </div>
  );
};

export default Dashboard;
