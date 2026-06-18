import React, { useState } from 'react';
import { Segmented, DatePicker, Space, Switch, Tooltip } from 'antd';
import type { TimePeriod } from '../../types';
import { useDashboardStore } from '../../store/dashboard';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface PeriodOption {
  label: string;
  value: TimePeriod;
}

const periodOptions: PeriodOption[] = [
  { label: '今日', value: 'today' },
  { label: '昨日', value: 'yesterday' },
  { label: '本周', value: 'week' },
  { label: '上周', value: 'last_week' },
  { label: '本月', value: 'month' },
  { label: '上月', value: 'last_month' },
  { label: '自定义', value: 'custom' },
];

const TimeRangeSelector: React.FC = () => {
  const { period, customStart, customEnd, setPeriod, setCustomRange, compareMode, setCompareMode, fetchData, fetchCompareData } = useDashboardStore();
  const [showCustom, setShowCustom] = useState(period === 'custom');

  const handlePeriodChange = (value: TimePeriod) => {
    setPeriod(value);
    const isCustom = value === 'custom';
    setShowCustom(isCustom);
    if (!isCustom) {
      setTimeout(() => {
        fetchData();
        if (compareMode) {
          fetchCompareData();
        }
      }, 0);
    }
  };

  const handleRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setCustomRange(dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD'));
      setTimeout(() => {
        fetchData();
        if (compareMode) {
          fetchCompareData();
        }
      }, 0);
    }
  };

  const handleCompareToggle = (checked: boolean) => {
    setCompareMode(checked);
    if (checked) {
      fetchCompareData();
    }
  };

  return (
    <Space size="middle" wrap>
      <Segmented
        value={period}
        onChange={handlePeriodChange as any}
        options={periodOptions}
      />
      {showCustom && (
        <RangePicker
          value={[dayjs(customStart), dayjs(customEnd)]}
          onChange={handleRangeChange}
          allowClear={false}
        />
      )}
      <Tooltip title="与上一周期对比展示">
        <Space>
          <span style={{ color: 'var(--text-secondary, #6b7280)' }}>对比模式</span>
          <Switch checked={compareMode} onChange={handleCompareToggle} size="small" />
        </Space>
      </Tooltip>
    </Space>
  );
};

export default TimeRangeSelector;
