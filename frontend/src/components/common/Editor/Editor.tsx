import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

interface EditorProps {
    value: string;
    onChange: (value: string) => void;
    onCursorChange?: (line: number, column: number) => void;
    readOnly?: boolean;
    height?: string;
    language?: string;
}

export const Editor: React.FC<EditorProps> = ({ 
    value, 
    onChange, 
    onCursorChange, 
    readOnly = false,
    height = '100%',
    language = 'csharp'
}) => {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        monaco.editor.defineTheme('csharp-light', {
            base: 'vs',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6a9955' },
                { token: 'keyword', foreground: '0000ff' },
                { token: 'string', foreground: 'a31515' },
                { token: 'number', foreground: '098658' },
            ],
            colors: {
                'editor.background': '#ffffff',
                'editor.foreground': '#000000',
                'editor.lineHighlightBackground': '#f0f7ff',
                'editorCursor.foreground': '#3498db',
                'editor.lineNumber.foreground': '#7f8c8d',
                'editor.selectionBackground': '#add6ff',
                'editor.inactiveSelectionBackground': '#e5ebf1'
            }
        });

        editorRef.current = monaco.editor.create(containerRef.current, {
            value,
            language,
            theme: 'csharp-light',
            fontSize: 14,
            fontFamily: 'Consolas, "Courier New", monospace',
            minimap: { enabled: false },
            automaticLayout: true,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            readOnly,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true },
            scrollbar: {
                vertical: 'visible',
                horizontal: 'visible'
            }
        });

        editorRef.current.onDidChangeModelContent(() => {
            onChange(editorRef.current?.getValue() || '');
        });

        editorRef.current.onDidChangeCursorPosition((e) => {
            onCursorChange?.(e.position.lineNumber, e.position.column);
        });

        return () => editorRef.current?.dispose();
    }, []);

    useEffect(() => {
        if (editorRef.current) {
            const model = editorRef.current.getModel();
            if (model) {
                monaco.editor.setModelLanguage(model, language);
            }
        }
    }, [language]);

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.getValue()) {
            editorRef.current.setValue(value);
        }
    }, [value]);

    return <div ref={containerRef} style={{ height, width: '100%' }} />;
};