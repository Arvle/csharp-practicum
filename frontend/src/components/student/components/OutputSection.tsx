import React, { useRef, useEffect } from 'react';
import { useTranslation } from '../../../locales';

interface OutputSectionProps {
  output: string[];
  input: string;
  onInputChange: (value: string) => void;
  isRunning: boolean;
  onRun: () => void;
  onSubmit?: () => void;
  onClear: () => void;
  showSubmit?: boolean;
  state: 'idle' | 'compiling' | 'interactive' | 'finished' | 'error' | 'submitting';
  onInputSubmit?: (text: string) => void;
}

export const OutputSection: React.FC<OutputSectionProps> = ({
  output,
  input,
  onInputChange,
  isRunning,
  onRun,
  onSubmit,
  onClear,
  showSubmit = false,
  state,
  onInputSubmit,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const isInteractive = state === 'interactive';

  useEffect(() => {
    if (isInteractive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInteractive]);

  const handleInputSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isInteractive || !onInputSubmit) return;
    onInputSubmit(input);
  };

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
          {isInteractive ? 'Консоль: программа запущена' : t.student.output}
        </span>
        <button className="terminal-clear" onClick={onClear} title={t.common.clear}>
          <i className="fas fa-eraser" aria-hidden />
        </button>
      </div>

      <div className="terminal-body">
        {output.length === 0 ? (
          <div className="terminal-empty">
            <i className="fas fa-play" aria-hidden />
            <span>{t.student.noOutput}</span>
          </div>
        ) : (
          <div className="terminal-lines">
            {output.map((line, i) => (
              <div key={`${i}-${line.slice(0, 12)}`} className={`terminal-line ${
                line.includes('✅') || line.includes('✓') ? 'success' :
                line.includes('❌') || line.includes('✗') ? 'error' :
                line.includes('⚠️') ? 'warning' :
                line.includes('⏳') || line.includes('🔨') ? 'info' : ''
              }`}>
                {line}
              </div>
            ))}
          </div>
        )}

        {isInteractive && (
          <form className="terminal-input-line" onSubmit={handleInputSubmit}>
            <span className="terminal-prompt">stdin&gt;</span>
            <input
              ref={inputRef}
              className="terminal-command-input"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Введите строку и нажмите Enter"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className="terminal-send" title="Отправить ввод в программу">
              <i className="fas fa-paper-plane" aria-hidden />
            </button>
          </form>
        )}
      </div>

      <div className="terminal-footer">
        <div className="terminal-actions">
          <button
            className="btn-terminal btn-run"
            onClick={onRun}
            disabled={isRunning && state !== 'interactive'}
          >
            {state === 'compiling' ? (
              <><span className="spinner-sm" /> Компиляция...</>
            ) : state === 'interactive' ? (
              <><i className="fas fa-redo" /> Перезапуск</>
            ) : (
              <><i className="fas fa-play" /> {t.editor.run}</>
            )}
          </button>
          
          {showSubmit && onSubmit && (
            <button
              className="btn-terminal btn-submit"
              onClick={onSubmit}
              disabled={state === 'compiling' || state === 'submitting'}
            >
              {state === 'submitting' ? (
                <><span className="spinner-sm" /> Отправка...</>
              ) : (
                <><i className="fas fa-paper-plane" /> {t.editor.submit}</>
              )}
            </button>
          )}
        </div>
        <span className="terminal-shortcut">
          Ввод активен только после запуска
        </span>
      </div>
    </div>
  );
};