import React, { useState } from 'react';
import { Modal } from '../../common/Modal/Modal';

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
    const [name, setName] = useState('Новый проект');
    const [description, setDescription] = useState('');

    const handleSave = () => {
        if (!name.trim()) {
            alert('Введите название проекта');
            return;
        }
        onSave(name, description, initialCode);
        setName('Новый проект');
        setDescription('');
        onClose();
    };

    const footer = (
        <>
            <button className="btn btn-secondary" onClick={onClose}>
                Отмена
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
                <i className="fas fa-save"></i>
                Создать
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Новый проект"
            footer={footer}
        >
            <div className="form-group">
                <label>Название проекта</label>
                <input
                    type="text"
                    className="login-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Мой проект"
                    autoFocus
                />
            </div>
            <div className="form-group">
                <label>Описание (необязательно)</label>
                <textarea
                    className="login-input"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Краткое описание проекта..."
                />
            </div>
        </Modal>
    );
};