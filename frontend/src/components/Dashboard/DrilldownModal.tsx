import React from 'react';
import { Modal, Table, Tag, Typography } from 'antd';
import { useDashboardStore } from '../../store/dashboard';
import dayjs from 'dayjs';
import type { LogEntry } from '../../types';

const { Text } = Typography;

const statusColors: Record<string, string> = {
  success: 'green',
  failed: 'red',
  error: 'red',
  running: 'blue',
  pending: 'orange',
};

const statusText: Record<string, string> = {
  success: '成功',
  failed: '失败',
  error: '错误',
  running: '运行中',
  pending: '等待中',
};

const DrilldownModal: React.FC = () => {
  const { drilldownVisible, drilldownTitle, drilldownData, hideDrilldown } = useDashboardStore();

  const columns = [
    {
      title: '任务ID',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 180,
      ellipsis: true,
      render: (v: string) => <Text code copyable>{v}</Text>,
    },
    {
      title: '服务器',
      dataIndex: 'server_name',
      key: 'server_name',
      width: 140,
    },
    {
      title: '命令/脚本',
      dataIndex: 'command',
      key: 'command',
      ellipsis: true,
      render: (v: string, record: LogEntry) => record.script_name || v,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (v: string) => <Tag color={statusColors[v] || 'default'}>{statusText[v] || v}</Tag>,
    },
    {
      title: '退出码',
      dataIndex: 'exit_code',
      key: 'exit_code',
      width: 80,
      render: (v: number | null) => (v === null ? '-' : v),
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 170,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '执行时长',
      key: 'duration',
      width: 100,
      render: (_: any, record: LogEntry) => {
        if (!record.start_time || !record.end_time) return '-';
        const dur = dayjs(record.end_time).diff(dayjs(record.start_time), 'second');
        return `${dur}s`;
      },
    },
  ];

  return (
    <Modal
      title={drilldownTitle}
      open={drilldownVisible}
      onCancel={hideDrilldown}
      footer={null}
      width={1000}
      className="drilldown-modal"
    >
      <Table
        dataSource={drilldownData as any[]}
        columns={columns}
        rowKey="task_id"
        size="small"
        scroll={{ x: 800, y: 500 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />
    </Modal>
  );
};

export default DrilldownModal;
