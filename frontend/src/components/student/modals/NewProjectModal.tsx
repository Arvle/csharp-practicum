import React, { useState } from 'react';
import { Modal } from '../../common/modal/Modal';

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, description: string, code: string) => void;
    initialCode?: string;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialCode = ''
}) => {
    const [name, setName] = useState('New Project');
    const [description, setDescription] = useState('');

    const handleSave = () => {
        if (!name.trim()) {
            alert('Enter project name');
            return;
        }
        onSave(name, description, initialCode);
        setName('New Project');
        setDescription('');
        onClose();
    };

    const footer = (
        <>
            <button className="btn btn-secondary" onClick={onClose}>
                Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
                <i className="fas fa-save"></i>
                Create
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="New Project"
            footer={footer}
        >
            <div className="form-group">
                <label>Project Name</label>
                <input
                    type="text"
                    className="login-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Project"
                    autoFocus
                />
            </div>
            <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                    className="login-input"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief project description..."
                />
            </div>
        </Modal>
    );
};