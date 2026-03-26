import React from 'react';
import { useTranslation } from '../../../locales';

interface StatsGridProps {
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    averageGrade: number;
  };
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const { t } = useTranslation();

  return (
    <div className="stats-cards" role="region" aria-label={t.teacher.stats.total}>
      <div className="stat-card">
        <div className="stat-title">
          <i className="fas fa-users" aria-hidden />
          {t.teacher.stats.total}
        </div>
        <div className="stat-value">{stats.total}</div>
      </div>
      <div className="stat-card stat-card--success">
        <div className="stat-title">
          <i className="fas fa-check-circle" aria-hidden />
          {t.teacher.stats.completed}
        </div>
        <div className="stat-value stat-value--success">{stats.completed}</div>
        <div className="stat-detail">
          {stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%
        </div>
      </div>
      <div className="stat-card stat-card--warn">
        <div className="stat-title">
          <i className="fas fa-clock" aria-hidden />
          {t.teacher.stats.inProgress}
        </div>
        <div className="stat-value stat-value--warn">{stats.inProgress}</div>
        <div className="stat-detail">
          {stats.total ? Math.round((stats.inProgress / stats.total) * 100) : 0}%
        </div>
      </div>
      <div className="stat-card stat-card--muted">
        <div className="stat-title">
          <i className="fas fa-minus-circle" aria-hidden />
          {t.teacher.stats.notStarted}
        </div>
        <div className="stat-value stat-value--muted">{stats.notStarted}</div>
      </div>
      <div className="stat-card stat-card--grade">
        <div className="stat-title">
          <i className="fas fa-star" aria-hidden />
          {t.teacher.stats.averageGrade}
        </div>
        <div className="stat-value stat-value--purple">{stats.averageGrade.toFixed(1)}</div>
      </div>
    </div>
  );
};
