import React, { useState } from 'react';
import { Editor } from '../../common/Editor/Editor';
import { CursorStatus } from '../../common/StatusBar/CursorStatus';

interface EditorSectionProps {
    code: string;
    onChange: (value: string) => void;
    title: string;
    description?: string;
    readOnly?: boolean;
}

export const EditorSection: React.FC<EditorSectionProps> = ({
    code,
    onChange,
    title,
    description,
    readOnly = false
}) => {
    const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });

    return (
        <div className="editor-wrapper">
            <div className="editor-toolbar">
                <CursorStatus line={cursorPos.line} column={cursorPos.column} />
                <div className="editor-toolbar-item">
                    <i className="fas fa-language"></i>
                    <span>C#</span>
                </div>
            </div>
            <div className="editor-area">
                <Editor 
                    value={code} 
                    onChange={onChange}
                    onCursorChange={(line, col) => setCursorPos({ line, column: col })}
                    readOnly={readOnly}
                />
            </div>
        </div>
    );
};