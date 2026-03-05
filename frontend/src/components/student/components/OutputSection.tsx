import React from 'react';

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
    return (
        <div className="output-wrapper">
            <div className="output-header">
                <h3>
                    <i className="fas fa-terminal"></i>
                    Program Output
                </h3>
                <button className="btn-icon" onClick={onClear} title="Clear">
                    <i className="fas fa-eraser"></i>
                </button>
            </div>
            
            <div className="output-content">
                {output.length === 0 ? (
                    <div className="output-line info">
                        <i className="fas fa-info-circle"></i>
                        Ready to run. Click "Run" to execute the code.
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
                            <><i className="fas fa-spinner fa-spin"></i> Running...</>
                        ) : (
                            <><i className="fas fa-play"></i> Run</>
                        )}
                    </button>
                    {showSubmit && onSubmit && (
                        <button 
                            className="btn btn-success"
                            onClick={onSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <><i className="fas fa-spinner fa-spin"></i> Submitting...</>
                            ) : (
                                <><i className="fas fa-paper-plane"></i> Submit</>
                            )}
                        </button>
                    )}
                </div>
                <div className="output-footer-info">
                    <span>
                        <i className="fas fa-keyboard"></i>
                        Ctrl+Enter - run
                    </span>
                    <span>
                        <i className="fas fa-clock"></i>
                        Timeout: 30 sec
                    </span>
                </div>
            </div>
        </div>
    );
};