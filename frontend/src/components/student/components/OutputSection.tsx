import React from 'react';
import { useTranslation } from '../../../locales';

interface OutputSectionProps {
  output: string[];
  loading: boolean;
  onRun: () => void;
  onSubmit?: () => void;
  onClear: () => void;
  showSubmit?: boolean;
}

export const OutputSection: React.FC<OutputSectionProps> = ({
  output,
  loading,
  onRun,
  onSubmit,
  onClear,
  showSubmit = false
}) => {
  const { t } = useTranslation();

  return (
    <div className="output-wrapper">
      <div className="output-header">
        <h3>
          <i className="fas fa-terminal"></i>
          {t.student.output}
        </h3>
        <button className="btn-icon" onClick={onClear} title={t.common.clear}>
          <i className="fas fa-eraser"></i>
        </button>
      </div>
      
      <div className="output-content">
        {output.length === 0 ? (
          <div className="output-line info">
            <i className="fas fa-info-circle"></i>
            {t.student.noOutput}
          </div>
        ) : (
          output.map((line, i) => (
            <div key={i} className={`output-line ${
              line.includes('✅') || line.includes('✓') ? 'success' :
              line.includes('❌') || line.includes('✗') ? 'error' :
              line.includes('⚠️') ? 'warning' :
              line.includes('⏳') ? 'info' : ''
            }`}>
              {line}
            </div>
          ))
        )}
      </div>
      
      <div className="output-footer">
        <div className="output-actions">
          <button 
            className="btn btn-secondary"
            onClick={onRun}
            disabled={loading}
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> {t.common.loading}</>
            ) : (
              <><i className="fas fa-play"></i> {t.editor.run}</>
            )}
          </button>
          {showSubmit && onSubmit && (
            <button 
              className="btn btn-success"
              onClick={onSubmit}
              disabled={loading}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin"></i> {t.common.loading}</>
              ) : (
                <><i className="fas fa-paper-plane"></i> {t.editor.submit}</>
              )}
            </button>
          )}
        </div>
        <div className="output-footer-info">
          <span>
            <i className="fas fa-keyboard"></i>
            {t.student.runShortcut}
          </span>
          <span>
            <i className="fas fa-clock"></i>
            {t.student.timeout}
          </span>
        </div>
      </div>
    </div>
  );
};