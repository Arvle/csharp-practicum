import React from 'react';
import { Modal } from '../../common/modal/Modal';
import { Assignment, Submission, StudentWithStats } from '../../../api/types';
import { useTranslation } from '../../../locales';

interface StudentWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentWithStats | null;
  assignments: Assignment[];
  onGradeSubmission: (submission: Submission) => void;
}

export const StudentWorkModal: React.FC<StudentWorkModalProps> = ({
  isOpen,
  onClose,
  student,
  assignments,
  onGradeSubmission,
}) => {
  const { t } = useTranslation();

  if (!student) return null;

  const footer = (
    <button type="button" className="btn btn-secondary" onClick={onClose}>
      {t.common.close}
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t.teacher.studentWorksTitle}: ${student.name}`}
      footer={footer}
      size="lg"
    >
      <p className="modal-lead">
        {student.group} · ID: {student.studentId}
      </p>
      {student.submissions.length === 0 ? (
        <p className="muted">{t.teacher.studentWorksEmpty}</p>
      ) : (
        <ul className="submission-timeline">
          {student.submissions.map((sub) => {
            const ass = assignments.find((a) => a.id === sub.assignmentId);
            return (
              <li key={sub.id} className="submission-timeline-item">
                <div className="submission-timeline-head">
                  <strong>{ass?.title || `#${sub.assignmentId}`}</strong>
                  <time dateTime={sub.submittedAt}>
                    {new Date(sub.submittedAt).toLocaleString()}
                  </time>
                </div>
                <div className="submission-timeline-meta">
                  <span
                    className={`pill ${sub.isCorrect ? 'pill-success' : 'pill-warn'}`}
                  >
                    {sub.isCorrect ? t.student.status.done : t.student.status.incorrect}
                  </span>
                  {sub.grade != null && (
                    <span className="pill pill-neutral">
                      {t.teacher.table.grade}: {sub.grade}
                    </span>
                  )}
                </div>
                <pre className="code-snippet">{sub.output || '—'}</pre>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onGradeSubmission(sub)}
                >
                  <i className="fas fa-star" aria-hidden />
                  {t.teacher.grading.title}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
};
