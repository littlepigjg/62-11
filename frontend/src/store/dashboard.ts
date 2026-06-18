import { create } from 'zustand';
import type { DashboardSummary, TimePeriod, ThemeMode, LogEntry } from '../types';
import { dashboardApi } from '../services/api';
import dayjs from 'dayjs';

interface DashboardCacheEntry {
  data: DashboardSummary;
  timestamp: number;
}

interface DashboardState {
  theme: ThemeMode;
  period: TimePeriod;
  customStart: string;
  customEnd: string;
  compareMode: boolean;
  compareData: DashboardSummary | null;
  currentData: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  cache: Map<string, DashboardCacheEntry>;
  drilldownData: LogEntry[];
  drilldownVisible: boolean;
  drilldownTitle: string;
  lastUpdateTime: number;
  autoRefresh: boolean;
  refreshInterval: number;

  setTheme: (theme: ThemeMode) => void;
  setPeriod: (period: TimePeriod) => void;
  setCustomRange: (start: string, end: string) => void;
  setCompareMode: (enabled: boolean) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;

  fetchData: (forceRefresh?: boolean) => Promise<void>;
  fetchCompareData: () => Promise<void>;
  showDrilldown: (type: string, title: string, params?: Record<string, any>) => Promise<void>;
  hideDrilldown: () => void;
  clearCache: () => void;
  getCacheKey: () => string;
}

const CACHE_TTL = 60 * 1000;

const getPreviousPeriod = (period: TimePeriod): TimePeriod => {
  const map: Record<TimePeriod, TimePeriod> = {
    today: 'yesterday',
    yesterday: 'today',
    week: 'last_week',
    last_week: 'week',
    month: 'last_month',
    last_month: 'month',
    custom: 'custom',
  };
  return map[period];
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  theme: 'light',
  period: 'today',
  customStart: dayjs().format('YYYY-MM-DD'),
  customEnd: dayjs().format('YYYY-MM-DD'),
  compareMode: false,
  compareData: null,
  currentData: null,
  loading: false,
  error: null,
  cache: new Map(),
  drilldownData: [],
  drilldownVisible: false,
  drilldownTitle: '',
  lastUpdateTime: 0,
  autoRefresh: false,
  refreshInterval: 60,

  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem('dashboard_theme', theme);
    if (theme === 'dark' || theme === 'screen') {
      document.body.classList.add('theme-dark');
      if (theme === 'screen') {
        document.body.classList.add('theme-screen');
      } else {
        document.body.classList.remove('theme-screen');
      }
    } else {
      document.body.classList.remove('theme-dark', 'theme-screen');
    }
  },

  setPeriod: (period) => set({ period }),

  setCustomRange: (start, end) => set({ customStart: start, customEnd: end }),

  setCompareMode: (enabled) => set({ compareMode: enabled }),

  setAutoRefresh: (enabled) => set({ autoRefresh: enabled }),

  setRefreshInterval: (interval) => set({ refreshInterval: interval }),

  getCacheKey: () => {
    const { period, customStart, customEnd } = get();
    if (period === 'custom') {
      return `custom_${customStart}_${customEnd}`;
    }
    return period;
  },

  clearCache: () => {
    set({ cache: new Map() });
    dashboardApi.refreshCache();
  },

  fetchData: async (forceRefresh = false) => {
    const { period, customStart, customEnd, cache } = get();
    const cacheKey = period === 'custom' ? `custom_${customStart}_${customEnd}` : period;

    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        set({ currentData: cached.data, lastUpdateTime: Date.now() });
        return;
      }
    }

    set({ loading: true, error: null });
    try {
      const params: any = { period, use_cache: !forceRefresh };
      if (period === 'custom') {
        params.start_date = customStart;
        params.end_date = customEnd;
      }
      const data = await dashboardApi.getSummary(params);

      const newCache = new Map(cache);
      newCache.set(cacheKey, { data, timestamp: Date.now() });
      set({
        currentData: data,
        cache: newCache,
        loading: false,
        lastUpdateTime: Date.now(),
      });
    } catch (err: any) {
      set({ error: err.message || '加载仪表盘数据失败', loading: false });
    }
  },

  fetchCompareData: async () => {
    const { period, customStart, customEnd } = get();
    set({ loading: true, error: null });
    try {
      const prevPeriod = getPreviousPeriod(period);
      const params: any = { period: prevPeriod, use_cache: true };
      if (period === 'custom') {
        const start = dayjs(customStart);
        const end = dayjs(customEnd);
        const duration = end.diff(start, 'day');
        params.period = 'custom';
        params.start_date = start.subtract(duration + 1, 'day').format('YYYY-MM-DD');
        params.end_date = start.subtract(1, 'day').format('YYYY-MM-DD');
      }
      const data = await dashboardApi.getSummary(params);
      set({ compareData: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || '加载对比数据失败', loading: false });
    }
  },

  showDrilldown: async (type, title, params = {}) => {
    const { period, customStart, customEnd } = get();
    set({ drilldownVisible: true, drilldownTitle: title });
    try {
      const apiParams: any = { ...params };
      if (!apiParams.period) {
        apiParams.period = period;
        if (period === 'custom') {
          apiParams.start_date = customStart;
          apiParams.end_date = customEnd;
        }
      }
      const data = await dashboardApi.getDrilldown(type, apiParams);
      set({ drilldownData: data });
    } catch (err: any) {
      set({ drilldownData: [], error: err.message });
    }
  },

  hideDrilldown: () => set({ drilldownVisible: false, drilldownData: [] }),
}));
