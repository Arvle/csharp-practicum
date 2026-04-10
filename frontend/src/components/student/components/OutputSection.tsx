import React from 'react';
import { useTranslation } from '../../../locales';

interface OutputSectionProps {
  output: string[];
  input: string;
  onInputChange: (value: string) => void;
  loading: boolean;
  onRun: () => void;
  onSubmit?: () => void;
  onClear: () => void;
  showSubmit?: boolean;
}

export const OutputSection: React.FC<OutputSectionProps> = ({
  output,
  input,
  onInputChange,
  loading,
  onRun,
  onSubmit,
  onClear,
  showSubmit = false
}) => {
  const { t } = useTranslation();

  return (
    <div className="output-wrapper">
      <div className="terminal-bar">
        <div className="terminal-dots">
          <span className="terminal-dot red" />
          <span className="terminal-dot yellow" />
          <span className="terminal-dot green" />
        </div>
        <span className="terminal-title">
          <i className="fas fa-terminal" aria-hidden />
          {t.student.output}
        </span>
        <button className="terminal-clear" onClick={onClear} title={t.common.clear}>
          <i className="fas fa-eraser" aria-hidden />
        </button>
      </div>

      <div className="terminal-body">
        {input !== '' && (
          <div className="terminal-input-group">
            <label className="terminal-input-label">
              <i className="fas fa-keyboard" aria-hidden />
              stdin
            </label>
            <textarea
              className="terminal-input"
              rows={2}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Ввод для Console.ReadLine()"
              disabled={loading}
            />
          </div>
        )}

        {output.length === 0 ? (
          <div className="terminal-empty">
            <i className="fas fa-play" aria-hidden />
            <span>{t.student.noOutput}</span>
          </div>
        ) : (
          <div className="terminal-lines">
            {output.map((line, i) => (
              <div key={i} className={`terminal-line ${
                line.includes('✅') || line.includes('✓') ? 'success' :
                line.includes('❌') || line.includes('✗') ? 'error' :
                line.includes('⚠️') ? 'warning' :
                line.includes('⏳') ? 'info' : ''
              }`}>
                {line}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="terminal-footer">
        <div className="terminal-actions">
          <button
            className="btn-terminal btn-run"
            onClick={onRun}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-sm" />
                {t.common.loading}
              </>
            ) : (
              <>
                <i className="fas fa-play" aria-hidden />
                {t.editor.run}
              </>
            )}
          </button>
          {showSubmit && onSubmit && (
            <button
              className="btn-terminal btn-submit"
              onClick={onSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-sm" />
                  {t.common.loading}
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane" aria-hidden />
                  {t.editor.submit}
                </>
              )}
            </button>
          )}
        </div>
        <span className="terminal-shortcut">
          <kbd>Ctrl</kbd>+<kbd>Enter</kbd>
        </span>
      </div>
    </div>
  );
};
