import React from 'react';
import { Modal } from '../../common/modal/Modal';
import { Submission, Assignment } from '../../../api/types';

interface SubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    submission: Submission | null;
    assignment?: Assignment;
    grade: number;
    comment: string;
    onGradeChange: (grade: number) => void;
    onCommentChange: (comment: string) => void;
    onSave: () => void;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
    isOpen,
    onClose,
    submission,
    assignment,
    grade,
    comment,
    onGradeChange,
    onCommentChange,
    onSave
}) => {
    if (!submission) return null;

    const footer = (
        <>
            <button className="btn btn-secondary" onClick={onClose}>
                Cancel
            </button>
            <button className="btn btn-success" onClick={onSave}>
                <i className="fas fa-save"></i>
                Save Grade
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Submission: Student ${submission.studentId}`}
            footer={footer}
            size="lg"
        >
            <div style={{ marginBottom: '20px' }}>
                <strong>Assignment:</strong> {assignment?.title || 'Unknown'}
            </div>
            
            <div style={{ marginBottom: '20px' }}>
                <strong>Code:</strong>
                <div className="code-preview">
                    <pre>{submission.code}</pre>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <strong>Execution Result:</strong>
                <div className={`result-preview ${submission.isCorrect ? 'success' : 'error'}`}>
                    <pre style={{ margin: 0, background: 'transparent' }}>
                        {submission.output || 'No output'}
                    </pre>
                </div>
            </div>

            {submission.errorMessage && (
                <div style={{ marginBottom: '20px' }}>
                    <strong>Error:</strong>
                    <div className="result-preview error">
                        <pre style={{ margin: 0, background: 'transparent' }}>
                            {submission.errorMessage}
                        </pre>
                    </div>
                </div>
            )}

            <div className="grade-form">
                <div>
                    <label>Grade</label>
                    <select 
                        className="grade-select"
                        value={grade}
                        onChange={(e) => onGradeChange(Number(e.target.value))}
                    >
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Good</option>
                        <option value="3">3 - Satisfactory</option>
                        <option value="2">2 - Unsatisfactory</option>
                    </select>
                </div>
                <div>
                    <label>Comment</label>
                    <textarea 
                        className="grade-input"
                        rows={3}
                        value={comment}
                        onChange={(e) => onCommentChange(e.target.value)}
                        placeholder="Grade comment..."
                    />
                </div>
            </div>
        </Modal>
    );
};