import type { ThemeMode } from '../../types';

export interface ChartColors {
  primary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  series: string[];
}

export interface ThemeConfig {
  mode: ThemeMode;
  isDark: boolean;
  backgroundColor: string;
  panelBg: string;
  textColor: string;
  textSecondary: string;
  borderColor: string;
  colors: ChartColors;
  fontSize: {
    small: string;
    normal: string;
    large: string;
    xlarge: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: string;
  shadow: string;
}

const commonSeries = [
  '#5470c6',
  '#91cc75',
  '#fac858',
  '#ee6666',
  '#73c0de',
  '#3ba272',
  '#fc8452',
  '#9a60b4',
  '#ea7ccc',
];

const lightTheme: ThemeConfig = {
  mode: 'light',
  isDark: false,
  backgroundColor: '#f0f2f5',
  panelBg: '#ffffff',
  textColor: '#1f2937',
  textSecondary: '#6b7280',
  borderColor: '#e5e7eb',
  colors: {
    primary: '#1677ff',
    success: '#52c41a',
    warning: '#faad14',
    danger: '#ff4d4f',
    info: '#1890ff',
    series: commonSeries,
  },
  fontSize: {
    small: '12px',
    normal: '14px',
    large: '16px',
    xlarge: '20px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: '8px',
  shadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
};

const darkTheme: ThemeConfig = {
  mode: 'dark',
  isDark: true,
  backgroundColor: '#0a0a0a',
  panelBg: '#1a1a2e',
  textColor: '#e5e7eb',
  textSecondary: '#9ca3af',
  borderColor: '#374151',
  colors: {
    primary: '#4096ff',
    success: '#73d13d',
    warning: '#ffc53d',
    danger: '#ff7875',
    info: '#40a9ff',
    series: [
      '#4096ff',
      '#73d13d',
      '#ffc53d',
      '#ff7875',
      '#36cfc9',
      '#52c41a',
      '#ffa940',
      '#b37feb',
      '#ff85c0',
    ],
  },
  fontSize: {
    small: '12px',
    normal: '14px',
    large: '16px',
    xlarge: '20px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: '8px',
  shadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
};

const screenTheme: ThemeConfig = {
  mode: 'screen',
  isDark: true,
  backgroundColor: '#050510',
  panelBg: 'rgba(10, 20, 50, 0.7)',
  textColor: '#00f0ff',
  textSecondary: '#00a8cc',
  borderColor: '#00f0ff33',
  colors: {
    primary: '#00f0ff',
    success: '#00ff88',
    warning: '#ffcc00',
    danger: '#ff4757',
    info: '#4096ff',
    series: [
      '#00f0ff',
      '#00ff88',
      '#ffcc00',
      '#ff4757',
      '#9b59b6',
      '#1abc9c',
      '#e74c3c',
      '#3498db',
      '#f39c12',
    ],
  },
  fontSize: {
    small: '14px',
    normal: '16px',
    large: '20px',
    xlarge: '28px',
  },
  spacing: {
    xs: '6px',
    sm: '12px',
    md: '20px',
    lg: '32px',
    xl: '48px',
  },
  borderRadius: '4px',
  shadow: '0 0 20px rgba(0, 240, 255, 0.2)',
};

export const getTheme = (mode: ThemeMode): ThemeConfig => {
  switch (mode) {
    case 'dark':
      return darkTheme;
    case 'screen':
      return screenTheme;
    default:
      return lightTheme;
  }
};

export const getEChartsOption = (theme: ThemeMode) => {
  const t = getTheme(theme);
  return {
    backgroundColor: 'transparent',
    textStyle: {
      color: t.textColor,
      fontSize: parseInt(t.fontSize.normal),
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    title: {
      textStyle: {
        color: t.textColor,
        fontSize: parseInt(t.fontSize.large),
        fontWeight: 600,
      },
      subtextStyle: {
        color: t.textSecondary,
      },
    },
    legend: {
      textStyle: {
        color: t.textColor,
      },
    },
    tooltip: {
      backgroundColor: t.panelBg,
      borderColor: t.borderColor,
      textStyle: {
        color: t.textColor,
      },
    },
    xAxis: {
      axisLine: {
        lineStyle: {
          color: t.borderColor,
        },
      },
      axisLabel: {
        color: t.textSecondary,
      },
      splitLine: {
        lineStyle: {
          color: t.borderColor,
          type: 'dashed',
        },
      },
    },
    yAxis: {
      axisLine: {
        lineStyle: {
          color: t.borderColor,
        },
      },
      axisLabel: {
        color: t.textSecondary,
      },
      splitLine: {
        lineStyle: {
          color: t.borderColor,
          type: 'dashed',
        },
      },
    },
    color: t.colors.series,
  };
};
