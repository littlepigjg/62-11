export interface ServerConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  private_key: string;
  tags: string[];
}

export interface ExecutionResult {
  task_id: string;
  server_id: string;
  server_name: string;
  command: string;
  exit_code: number | null;
  stdout: string;
  stderr: string;
  start_time: string;
  end_time: string | null;
  status: 'pending' | 'running' | 'success' | 'failed' | 'error';
}

export interface StreamMessage {
  type: 'output' | 'status';
  task_id: string;
  server_id: string;
  server_name: string;
  stream: 'stdout' | 'stderr' | '';
  content: string;
  exit_code: number | null;
  status: string;
  timestamp: string;
}

export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  script_content: string;
  interpreter: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface LogEntry {
  task_id: string;
  server_name: string;
  server_id: string;
  command: string;
  script_name: string | null;
  start_time: string;
  end_time: string;
  status: string;
  exit_code: number | null;
  output: string;
  log_file: string;
}

export interface CommandExecuteRequest {
  server_ids: string[];
  command: string;
  timeout?: number;
  env?: Record<string, string>;
}

export interface ScriptExecuteRequest {
  server_ids: string[];
  script_content: string;
  script_name?: string;
  interpreter?: string;
  args?: string[];
  timeout?: number;
}

export type TimePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'last_week' | 'last_month' | 'custom';

export interface DashboardKPI {
  total_tasks: number;
  success_tasks: number;
  failed_tasks: number;
  success_rate: number;
  avg_duration_seconds: number;
  active_servers: number;
  total_servers: number;
  server_online_rate: number;
  prev_total_tasks: number;
  prev_success_rate: number;
  tasks_trend: number;
  success_rate_trend: number;
}

export interface TrendData {
  time_points: string[];
  tasks_count: number[];
  success_count: number[];
  failed_count: number[];
  avg_durations: number[];
}

export interface ServerDistribution {
  server_id: string;
  server_name: string;
  total: number;
  success: number;
  failed: number;
  avg_duration: number;
  success_rate: number;
}

export interface CommandDistribution {
  command: string;
  total: number;
  success: number;
  failed: number;
  success_rate: number;
}

export interface HeatmapData {
  days: string[];
  hours: string[];
  data: number[][];
  max_value: number;
}

export interface RadarIndicator {
  name: string;
  max: number;
}

export interface RadarData {
  indicators: RadarIndicator[];
  values: number[];
}

export interface ResourceUsage {
  cpu_usage: number;
  memory_usage: number;
  memory_used_gb: number;
  memory_total_gb: number;
  disk_usage: number;
  disk_used_gb: number;
  disk_total_gb: number;
  timestamp: string;
}

export interface DashboardSummary {
  period: TimePeriod;
  start_time: string;
  end_time: string;
  kpi: DashboardKPI;
  trend: TrendData;
  server_distribution: ServerDistribution[];
  command_distribution: CommandDistribution[];
  heatmap: HeatmapData;
  radar: RadarData;
  resource_usage: ResourceUsage;
  generated_at: string;
  cached: boolean;
}

export interface DrilldownParams {
  type: 'server' | 'status' | 'failed' | 'success';
  period?: TimePeriod;
  start_date?: string;
  end_date?: string;
  server_id?: string;
  status?: string;
  limit?: number;
}

export type ThemeMode = 'light' | 'dark' | 'screen';

