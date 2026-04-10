export const ru = {
  app: {
    name: 'C# Практикум',
    version: '1.1.0',
    loading: 'Загрузка...',
    tagline:
      'Интерактивная платформа для изучения C#: редактор как в VS Code, проверка кода, обратная связь.',
    taglineShort: 'Пиши, запускай и проверяй C#-код прямо в браузере.'
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
    actions: 'Действия',
    logout: 'Выйти',
    clear: 'Очистить вывод',
    view: 'Просмотр'
  },
  auth: {
    student: {
      title: 'Вход для студента',
      subtitle: 'Введите номер студенческой зачётки для входа',
      tabLabel: 'Студент',
      studentId: 'Номер студенческого',
      studentIdPlaceholder: 'Например: S1001',
      fullName: 'ФИО',
      group: 'Группа',
      login: 'Войти',
      register: 'Зарегистрироваться',
      forgotPassword: 'Забыли пароль?',
      noAccount: 'Нет аккаунта? Зарегистрироваться',
      backToLogin: 'Вернуться к входу',
      switchToTeacher: 'Войти как преподаватель'
    },
    teacher: {
      title: 'Вход для преподавателя',
      subtitle: 'Введите код доступа и выберите группу',
      tabLabel: 'Преподаватель',
      accessCode: 'Код доступа',
      accessCodePlaceholder: '••••••••',
      group: 'Группа',
      login: 'Войти',
      backToStudent: '← Вход для студента',
      switchToStudent: 'Войти как студент'
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
    noAssignmentsHint:
      'Когда преподаватель добавит задания, они появятся в списке слева.',
    noOutput: 'Запустите код — результат появится здесь. Ctrl+Enter — быстрый запуск.',
    timeout: 'Таймаут: 30 сек',
    runShortcut: 'Ctrl+Enter — запуск без сохранения в отчёт',
    workspaceKicker: 'Рабочая область',
    expectedOutputLabel: 'Ожидается вывод (эталон для проверки):',
    draftHint:
      'Черновик сохраняется в браузере при вводе. «Сбросить» удаляет черновик и возвращает шаблон.',
    status: {
      pending: 'Ожидает',
      done: 'Выполнено',
      incorrect: 'Нужны правки'
    }
  },
  teacher: {
    dashboard: 'Панель преподавателя',
    students: 'Студенты',
    assignments: 'Задания',
    mainTabOverview: 'Успеваемость и решения',
    mainTabAssignments: 'Задания и эталоны',
    filterHint: 'Фильтр по подстроке группы (например ИСП-211)',
    filterPlaceholder: 'Фильтр по группе…',
    sidebarEmpty: 'Нет студентов по фильтру или в базе.',
    assignmentsPanelTitle: 'Управление заданиями',
    assignmentsPanelLead:
      'Создавайте задания с шаблоном кода и эталонным выводом — студенты сдают работы через «Отправить».',
    assignmentsEmpty: 'Заданий пока нет — создайте первое ниже.',
    studentWorksTitle: 'Работы студента',
    studentWorksEmpty: 'Пока нет отправленных решений.',
    assignmentsForm: {
      title: 'Название',
      titlePh: 'Например: Вывод приветствия',
      description: 'Описание',
      descriptionPh: 'Условие для студентов',
      initialCode: 'Начальный код (шаблон)',
      expectedOutput: 'Ожидаемый вывод (строка)',
      create: 'Создать задание',
      titleRequired: 'Укажите название',
      confirmDelete: 'Удалить это задание? Связанные решения тоже будут удалены.'
    },
    stats: {
      total: 'Всего студентов',
      completed: 'Сдали все',
      inProgress: 'В процессе',
      notStarted: 'Не начинали',
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