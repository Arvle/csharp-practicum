import React from 'react';
import { useTranslation } from '../../../locales';

interface StatsGridProps {
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    averageGrade: number;
  };
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const { t } = useTranslation();

  return (
    <div className="stats-cards">
      <div className="stat-card">
        <div className="stat-title">
          <i className="fas fa-users"></i>
          {t.teacher.stats.total}
        </div>
        <div className="stat-value">{stats.total}</div>
      </div>
      <div className="stat-card">
        <div className="stat-title">
          <i className="fas fa-check-circle" style={{ color: 'var(--accent-green)' }}></i>
          {t.teacher.stats.completed}
        </div>
        <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{stats.completed}</div>
        <div className="stat-detail">
          {stats.total ? Math.round(stats.completed / stats.total * 100) : 0}%
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-title">
          <i className="fas fa-clock" style={{ color: 'var(--accent-yellow)' }}></i>
          {t.teacher.stats.inProgress}
        </div>
        <div className="stat-value" style={{ color: 'var(--accent-yellow)' }}>{stats.inProgress}</div>
        <div className="stat-detail">
          {stats.total ? Math.round(stats.inProgress / stats.total * 100) : 0}%
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-title">
          <i className="fas fa-star" style={{ color: 'var(--accent-yellow)' }}></i>
          {t.teacher.stats.averageGrade}
        </div>
        <div className="stat-value">{stats.averageGrade.toFixed(1)}</div>
      </div>
    </div>
  );
};