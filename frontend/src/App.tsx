import React, { useEffect } from 'react';
import { Layout, Tabs, Badge } from 'antd';
import {
  DesktopOutlined,
  CodeOutlined,
  FileTextOutlined,
  HistoryOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import MachineManagement from './components/MachineManagement';
import TerminalPanel from './components/TerminalPanel';
import ScriptLibrary from './components/ScriptLibrary';
import LogViewer from './components/LogViewer';
import Dashboard from './components/Dashboard';
import { useAppStore } from './store';
import { wsService } from './services/websocket';

const { Header, Content } = Layout;

const App: React.FC = () => {
  const { currentTab, setCurrentTab, handleStreamMessage, activeTasks } = useAppStore();

  useEffect(() => {
    const unsub = wsService.onMessage(handleStreamMessage);
    return () => unsub();
  }, [handleStreamMessage]);

  const runningCount = Array.from(activeTasks.values()).filter(
    t => t.status === 'running' || t.status === 'pending'
  ).length;

  const tabItems = [
    {
      key: 'dashboard',
      label: (
        <span>
          <DashboardOutlined />
          决策仪表盘
        </span>
      ),
      children: <Dashboard />,
    },
    {
      key: 'execute',
      label: (
        <span>
          <DesktopOutlined />
          命令执行
          {runningCount > 0 && <Badge count={runningCount} style={{ marginLeft: 8 }} />}
        </span>
      ),
      children: <TerminalPanel />,
    },
    {
      key: 'machines',
      label: (
        <span>
          <CodeOutlined />
          机器管理
        </span>
      ),
      children: <MachineManagement />,
    },
    {
      key: 'templates',
      label: (
        <span>
          <FileTextOutlined />
          脚本库
        </span>
      ),
      children: <ScriptLibrary />,
    },
    {
      key: 'logs',
      label: (
        <span>
          <HistoryOutlined />
          执行历史
        </span>
      ),
      children: <LogViewer />,
    },
  ];

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <h1>🚀 远程命令执行与脚本管理平台</h1>
      </Header>
      <Content className="app-content">
        <Tabs
          activeKey={currentTab}
          onChange={setCurrentTab}
          items={tabItems}
          size="large"
        />
      </Content>
    </Layout>
  );
};

export default App;
