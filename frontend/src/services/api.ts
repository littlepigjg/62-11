import axios from 'axios';
import type {
  ServerConfig,
  ExecutionResult,
  ScriptTemplate,
  LogEntry,
  CommandExecuteRequest,
  ScriptExecuteRequest,
  TimePeriod,
  DashboardSummary,
  DashboardKPI,
  TrendData,
  ServerDistribution,
  CommandDistribution,
  HeatmapData,
  RadarData,
  ResourceUsage,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export const serversApi = {
  list: (tag?: string): Promise<ServerConfig[]> =>
    api.get('/servers', { params: { tag } }).then(r => r.data),
  get: (id: string): Promise<ServerConfig> =>
    api.get(`/servers/${id}`).then(r => r.data),
  tags: (): Promise<string[]> =>
    api.get('/servers/tags').then(r => r.data),
  create: (data: Partial<ServerConfig>): Promise<ServerConfig> =>
    api.post('/servers', data).then(r => r.data),
  update: (id: string, data: Partial<ServerConfig>): Promise<ServerConfig> =>
    api.put(`/servers/${id}`, data).then(r => r.data),
  delete: (id: string): Promise<void> =>
    api.delete(`/servers/${id}`).then(r => r.data),
  test: (id: string): Promise<{ success: boolean; message: string }> =>
    api.post(`/servers/${id}/test`).then(r => r.data),
};

export const executeApi = {
  command: (data: CommandExecuteRequest): Promise<ExecutionResult[]> =>
    api.post('/execute/command', data).then(r => r.data),
  script: (data: ScriptExecuteRequest): Promise<ExecutionResult[]> =>
    api.post('/execute/script', data).then(r => r.data),
  listTasks: (serverId?: string, limit = 100): Promise<ExecutionResult[]> =>
    api.get('/execute/tasks', { params: { server_id: serverId, limit } }).then(r => r.data),
  getTask: (taskId: string): Promise<ExecutionResult> =>
    api.get(`/execute/tasks/${taskId}`).then(r => r.data),
};

export const templatesApi = {
  list: (tag?: string, keyword?: string): Promise<ScriptTemplate[]> =>
    api.get('/templates', { params: { tag, keyword } }).then(r => r.data),
  tags: (): Promise<string[]> =>
    api.get('/templates/tags').then(r => r.data),
  get: (id: string): Promise<ScriptTemplate> =>
    api.get(`/templates/${id}`).then(r => r.data),
  create: (data: Partial<ScriptTemplate> & { name: string; script_content: string }): Promise<ScriptTemplate> =>
    api.post('/templates', data).then(r => r.data),
  update: (id: string, data: Partial<ScriptTemplate>): Promise<ScriptTemplate> =>
    api.put(`/templates/${id}`, data).then(r => r.data),
  delete: (id: string): Promise<void> =>
    api.delete(`/templates/${id}`).then(r => r.data),
};

export const logsApi = {
  list: (params: { date?: string; server_id?: string; limit?: number } = {}): Promise<LogEntry[]> =>
    api.get('/logs', { params }).then(r => r.data),
  dates: (): Promise<string[]> =>
    api.get('/logs/dates').then(r => r.data),
  getByTask: (taskId: string): Promise<LogEntry> =>
    api.get(`/logs/${taskId}`).then(r => r.data),
};

export const dashboardApi = {
  getSummary: (params: {
    period: TimePeriod;
    start_date?: string;
    end_date?: string;
    use_cache?: boolean;
  }): Promise<DashboardSummary> =>
    api.get('/dashboard/summary', { params }).then(r => r.data),

  getKPI: (params: {
    period: TimePeriod;
    start_date?: string;
    end_date?: string;
  }): Promise<DashboardKPI> =>
    api.get('/dashboard/kpi', { params }).then(r => r.data),

  getTrend: (params: {
    period: TimePeriod;
    start_date?: string;
    end_date?: string;
    granularity?: 'auto' | 'hour' | 'day';
  }): Promise<TrendData> =>
    api.get('/dashboard/trend', { params }).then(r => r.data),

  getServerDistribution: (params: {
    period: TimePeriod;
    start_date?: string;
    end_date?: string;
  }): Promise<ServerDistribution[]> =>
    api.get('/dashboard/server-distribution', { params }).then(r => r.data),

  getCommandDistribution: (params: {
    period: TimePeriod;
    start_date?: string;
    end_date?: string;
    top_n?: number;
  }): Promise<CommandDistribution[]> =>
    api.get('/dashboard/command-distribution', { params }).then(r => r.data),

  getHeatmap: (params: {
    period: TimePeriod;
    start_date?: string;
    end_date?: string;
  }): Promise<HeatmapData> =>
    api.get('/dashboard/heatmap', { params }).then(r => r.data),

  getRadar: (params: {
    period: TimePeriod;
    start_date?: string;
    end_date?: string;
  }): Promise<RadarData> =>
    api.get('/dashboard/radar', { params }).then(r => r.data),

  getResource: (): Promise<ResourceUsage> =>
    api.get('/dashboard/resource').then(r => r.data),

  getDrilldown: (type: string, params: {
    period?: TimePeriod;
    start_date?: string;
    end_date?: string;
    server_id?: string;
    status?: string;
    limit?: number;
  }): Promise<LogEntry[]> =>
    api.get(`/dashboard/drilldown/${type}`, { params }).then(r => r.data),

  refreshCache: (): Promise<{ message: string }> =>
    api.post('/dashboard/cache/refresh').then(r => r.data),

  getCacheStatus: (): Promise<{ cached_keys: string[]; ttl_seconds: number; timestamps: Record<string, number> }> =>
    api.get('/dashboard/cache/status').then(r => r.data),
};

export default api;
