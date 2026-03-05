import React from 'react';

interface CursorStatusProps {
    line: number;
    column: number;
}

export const CursorStatus: React.FC<CursorStatusProps> = ({ line, column }) => {
    return (
        <div className="editor-toolbar-item">
            <i className="fas fa-map-pin"></i>
            <span>Строка {line}, Колонка {column}</span>
        </div>
    );
};