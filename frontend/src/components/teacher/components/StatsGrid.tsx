import React from 'react';
import { useTranslation } from '../../../locales';

interface StatsGridProps {
  stats: {
    joined: number;
    submitted: number;
    completed: number;
    inProgress: number;
    averageGrade: number;
  };
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const { t } = useTranslation();
  const hasData = stats.joined > 0;

  return (
    <div className="stats-cards" role="region" aria-label="Статистика урока">
      <div className="stat-card">
        <div className="stat-title"><i className="fas fa-user-plus" aria-hidden />{t.teacher.stats.joined}</div>
        <div className="stat-value">{hasData ? stats.joined : '—'}</div>
        <div className="stat-detail">перешли по ссылке</div>
      </div>
      <div className="stat-card stat-card--warn">
        <div className="stat-title"><i className="fas fa-play-circle" aria-hidden />{t.teacher.stats.submitted}</div>
        <div className="stat-value stat-value--warn">{hasData ? stats.submitted : '—'}</div>
        <div className="stat-detail">{hasData ? Math.round((stats.submitted / stats.joined) * 100) : 0}% начали</div>
      </div>
      <div className="stat-card stat-card--success">
        <div className="stat-title"><i className="fas fa-check-circle" aria-hidden />{t.teacher.stats.completed}</div>
        <div className="stat-value stat-value--success">{hasData ? stats.completed : '—'}</div>
        <div className="stat-detail">{hasData ? Math.round((stats.completed / stats.joined) * 100) : 0}% сдали</div>
      </div>
      <div className="stat-card stat-card--grade">
        <div className="stat-title"><i className="fas fa-star" aria-hidden />{t.teacher.stats.averageGrade}</div>
        <div className="stat-value stat-value--purple">{hasData ? stats.averageGrade.toFixed(1) : '—'}</div>
        <div className="stat-detail">средний балл</div>
      </div>
    </div>
  );
};