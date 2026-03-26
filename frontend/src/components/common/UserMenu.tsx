import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../locales';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  if (!user) return null;

  return (
    <div className="user-menu">
      <div className="user-info">
        <i className="fas fa-user-circle"></i>
        <span>{user.fullName || user.username}</span>
      </div>
      <button className="btn-icon" onClick={logout} title={t.common.logout}>
        <i className="fas fa-sign-out-alt"></i>
      </button>
    </div>
  );
};