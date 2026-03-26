import React, { useState } from 'react';
import { Editor } from '../../common/editor/Editor';
import { CursorStatus } from '../../common/statusBar/CursorStatus';
import { useTranslation } from '../../../locales';

interface EditorSectionProps {
    code: string;
    onChange: (value: string) => void;
    onRun?: () => void;
    readOnly?: boolean;
}

export const EditorSection: React.FC<EditorSectionProps> = ({
    code,
    onChange,
    onRun,
    readOnly = false
}) => {
    const [cursorPos, setCursorPos] = useState<{ line: number; column: number }>({ line: 1, column: 1 });
    const { t } = useTranslation();

    const handleCursorChange = (line: number, column: number) => {
        setCursorPos({ line, column });
    };

    return (
        <div className="editor-wrapper">
            <div className="editor-toolbar">
                <CursorStatus line={cursorPos.line} column={cursorPos.column} />
                <div className="editor-toolbar-item">
                    <i className="fas fa-language"></i>
                    <span>{t.editor.language}</span>
                </div>
            </div>
            <div className="editor-area">
                <Editor
                    value={code}
                    onChange={onChange}
                    onCursorChange={handleCursorChange}
                    onRun={onRun}
                    readOnly={readOnly}
                />
            </div>
        </div>
    );
};