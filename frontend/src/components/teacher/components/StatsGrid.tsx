import React from 'react';

interface StatsGridProps {
    stats: {
        total: number;
        completed: number;
        inProgress: number;
        averageGrade: number;
    };
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
    return (
        <div className="stats-grid">
            <div className="stat-card">
                <div className="stat-label">
                    <i className="fas fa-users"></i>
                    Всего студентов
                </div>
                <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-card">
                <div className="stat-label">
                    <i className="fas fa-check-circle" style={{ color: '#28a745' }}></i>
                    Сдали
                </div>
                <div className="stat-value" style={{ color: '#28a745' }}>{stats.completed}</div>
                <div className="stat-percentage">
                    {stats.total ? Math.round(stats.completed / stats.total * 100) : 0}%
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-label">
                    <i className="fas fa-clock" style={{ color: '#ffc107' }}></i>
                    В процессе
                </div>
                <div className="stat-value" style={{ color: '#ffc107' }}>{stats.inProgress}</div>
                <div className="stat-percentage">
                    {stats.total ? Math.round(stats.inProgress / stats.total * 100) : 0}%
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-label">
                    <i className="fas fa-star" style={{ color: '#ffc107' }}></i>
                    Средняя оценка
                </div>
                <div className="stat-value">{stats.averageGrade.toFixed(1)}</div>
            </div>
        </div>
    );
};