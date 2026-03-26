import React from 'react';
import { Modal } from '../../common/modal/Modal';
import { Submission, Assignment } from '../../../api/types';
import { useTranslation } from '../../../locales';

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
  const { t } = useTranslation();

  if (!submission) return null;

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onClose}>
        {t.common.cancel}
      </button>
      <button className="btn btn-success" onClick={onSave}>
        <i className="fas fa-save"></i>
        {t.teacher.grading.save}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t.teacher.grading.title}: ${t.teacher.table.student} ${submission.studentId}`}
      footer={footer}
      size="lg"
    >
      <div className="modal-section">
        <strong>{t.teacher.grading.assignment}:</strong>
        <div className="modal-value">{assignment?.title || t.teacher.empty}</div>
      </div>
      
      <div className="modal-section">
        <strong>{t.teacher.grading.code}:</strong>
        <div className="code-preview">
          <pre>{submission.code}</pre>
        </div>
      </div>

      <div className="modal-section">
        <strong>{t.teacher.grading.executionResult}:</strong>
        <div className={`result-preview ${submission.isCorrect ? 'success' : 'error'}`}>
          <pre style={{ margin: 0, background: 'transparent' }}>
            {submission.output || t.teacher.empty}
          </pre>
        </div>
      </div>

      {submission.errorMessage && (
        <div className="modal-section">
          <strong>{t.teacher.grading.error}:</strong>
          <div className="result-preview error">
            <pre style={{ margin: 0, background: 'transparent' }}>
              {submission.errorMessage}
            </pre>
          </div>
        </div>
      )}

      <div className="grade-form">
        <div className="form-group">
          <label>{t.teacher.grading.grade}</label>
          <select 
            className="grade-select"
            value={grade}
            onChange={(e) => onGradeChange(Number(e.target.value))}
          >
            <option value="5">{t.teacher.grading.grades['5']}</option>
            <option value="4">{t.teacher.grading.grades['4']}</option>
            <option value="3">{t.teacher.grading.grades['3']}</option>
            <option value="2">{t.teacher.grading.grades['2']}</option>
          </select>
        </div>
        <div className="form-group">
          <label>{t.teacher.grading.comment}</label>
          <textarea 
            className="grade-input"
            rows={3}
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder={t.teacher.grading.comment}
          />
        </div>
      </div>
    </Modal>
  );
};