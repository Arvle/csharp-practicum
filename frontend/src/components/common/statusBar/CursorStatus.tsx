import React from 'react';
import { useTranslation } from '../../../locales';

interface CursorStatusProps {
    line: number;
    column: number;
}

export const CursorStatus: React.FC<CursorStatusProps> = ({ line, column }) => {
    const { t } = useTranslation();
    
    return (
        <div className="editor-toolbar-item">
            <i className="fas fa-map-pin"></i>
            <span>{t.editor.line} {line}, {t.editor.column} {column}</span>
        </div>
    );
};