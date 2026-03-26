export const ru = {
  app: {
    name: 'C# Практикум',
    version: '1.0.0',
    loading: 'Загрузка...'
  },
  common: {
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    close: 'Закрыть',
    back: 'Назад',
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    confirm: 'Подтвердить',
    actions: 'Действия'
  },
  auth: {
    student: {
      title: 'Вход для студента',
      studentId: 'Номер студенческого',
      fullName: 'ФИО',
      group: 'Группа',
      login: 'Войти',
      register: 'Зарегистрироваться',
      forgotPassword: 'Забыли пароль?',
      noAccount: 'Нет аккаунта? Зарегистрироваться',
      backToLogin: 'Вернуться к входу'
    },
    teacher: {
      title: 'Вход для преподавателя',
      accessCode: 'Код доступа',
      group: 'Группа',
      login: 'Войти',
      backToStudent: '← Вход для студента'
    },
    register: {
      title: 'Регистрация',
      email: 'Email',
      fullName: 'ФИО',
      studentId: 'Номер студенческого',
      group: 'Группа',
      password: 'Пароль',
      confirmPassword: 'Подтверждение пароля',
      submit: 'Зарегистрироваться',
      success: 'Регистрация успешна! Теперь вы можете войти.'
    },
    forgot: {
      title: 'Восстановление пароля',
      email: 'Email',
      submit: 'Отправить инструкции',
      success: 'Инструкции по восстановлению отправлены на email'
    },
    errors: {
      invalidCredentials: 'Неверные учетные данные',
      studentIdRequired: 'Введите номер студенческого',
      fullNameRequired: 'Введите ФИО',
      groupRequired: 'Выберите группу',
      accessCodeRequired: 'Введите код доступа',
      invalidAccessCode: 'Неверный код доступа',
      emailRequired: 'Введите email',
      passwordRequired: 'Введите пароль',
      passwordsMismatch: 'Пароли не совпадают',
      loginFailed: 'Ошибка входа'
    }
  },
  student: {
    dashboard: 'Мои задания',
    assignments: 'Задания',
    projects: 'Проекты',
    resetCode: 'Сбросить код',
    run: 'Запустить',
    submit: 'Отправить',
    output: 'Результат выполнения',
    noAssignments: 'Нет доступных заданий',
    noOutput: 'Готов к запуску. Нажмите "Запустить" для выполнения кода',
    timeout: 'Таймаут: 30 сек',
    runShortcut: 'Ctrl+Enter - запуск',
    status: {
      pending: 'Ожидает',
      done: 'Выполнено',
      incorrect: 'Ошибка'
    }
  },
  teacher: {
    dashboard: 'Панель преподавателя',
    students: 'Студенты',
    assignments: 'Задания',
    stats: {
      total: 'Всего студентов',
      completed: 'Сдали',
      inProgress: 'В процессе',
      averageGrade: 'Средняя оценка'
    },
    table: {
      student: 'Студент',
      studentId: 'ID',
      status: 'Статус',
      lastAttempt: 'Последняя попытка',
      grade: 'Оценка',
      actions: 'Действия'
    },
    status: {
      completed: 'Сдано',
      inProgress: 'В процессе',
      notStarted: 'Не начато'
    },
    grading: {
      title: 'Оценивание решения',
      assignment: 'Задание',
      code: 'Код',
      executionResult: 'Результат выполнения',
      error: 'Ошибка',
      grade: 'Оценка',
      comment: 'Комментарий',
      save: 'Сохранить оценку',
      grades: {
        '5': '5 - Отлично',
        '4': '4 - Хорошо',
        '3': '3 - Удовлетворительно',
        '2': '2 - Неудовлетворительно'
      }
    },
    empty: 'Нет данных'
  },
  notifications: {
    submissionSuccess: 'Решение отправлено!',
    submissionFailed: 'Ошибка отправки решения',
    gradeSaved: 'Оценка сохранена',
    gradeFailed: 'Ошибка сохранения оценки',
    correct: '✅ Верно! Задание выполнено.',
    incorrect: '❌ Неверный результат. Попробуйте снова.'
  },
  editor: {
    line: 'Строка',
    column: 'Колонка',
    language: 'C#',
    run: 'Запустить',
    submit: 'Отправить',
    reset: 'Сбросить'
  },
  errors: {
    network: 'Ошибка сети. Проверьте подключение к серверу',
    server: 'Ошибка сервера',
    unauthorized: 'Неавторизован. Пожалуйста, войдите снова',
    forbidden: 'Доступ запрещен',
    notFound: 'Ресурс не найден',
    unknown: 'Неизвестная ошибка'
  }
};

export type Locale = typeof ru;