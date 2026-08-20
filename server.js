import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import {faker} from '@faker-js/faker/locale/ru';

const app = express();

app.use(cors());
app.use(express.json());

const SERVER_PORT = Number.parseInt(process.env.PORT || '', 10) || 5001;
const SERVER_BASE_URL = `http://localhost:${SERVER_PORT}`;
const DATA_FILE = './data.json';
const PUBLIC_DIR = './public';
const AVATAR_DIR = `${PUBLIC_DIR}/avatars`;
const UPLOAD_DIR = `${PUBLIC_DIR}/uploads`;
const ASSET_PUBLIC_BASE = '/assets';
const AVATAR_PUBLIC_BASE = `${ASSET_PUBLIC_BASE}/avatars`;
const UPLOAD_PUBLIC_BASE = `${ASSET_PUBLIC_BASE}/uploads`;
const DEFAULT_TABLE_ID = 'tasks';
const MOCK_USERS_COUNT = 50;
const MOCK_PROJECTS_COUNT = 50;
const MOCK_TASKS_COUNT = 150;

const fieldTypeRegistry = [
    {
        id: 'text',
        label: 'Text',
        icon: 'text_fields',
        group: 'All',
        dataType: 'string',
        editorComponent: 'input',
        settings: [
            {key: 'label', label: 'Field name', type: 'text', required: true},
            {key: 'placeholder', label: 'Placeholder', type: 'text'},
            {key: 'defaultValue', label: 'Default value', type: 'text'},
            {key: 'required', label: 'Required', type: 'checkbox'},
        ],
    },
    {
        id: 'html',
        label: 'HTML',
        icon: 'wysiwyg',
        group: 'All',
        dataType: 'html',
        editorComponent: 'editor',
        settings: [
            {key: 'label', label: 'Field name', type: 'text', required: true},
            {key: 'placeholder', label: 'Placeholder', type: 'text'},
            {key: 'defaultValue', label: 'Default value', type: 'text'},
            {key: 'required', label: 'Required', type: 'checkbox'},
        ],
    },
    {
        id: 'textarea',
        label: 'Text area',
        icon: 'notes',
        group: 'All',
        dataType: 'string',
        editorComponent: 'textarea',
        settings: [
            {key: 'label', label: 'Field name', type: 'text', required: true},
            {key: 'placeholder', label: 'Placeholder', type: 'text'},
            {key: 'rows', label: 'Rows', type: 'number', defaultValue: 3},
            {key: 'defaultValue', label: 'Default value', type: 'text'},
            {key: 'required', label: 'Required', type: 'checkbox'},
        ],
    },
    {
        id: 'dropdown',
        label: 'Dropdown',
        icon: 'arrow_drop_down_circle',
        group: 'All',
        dataType: 'enum',
        editorComponent: 'dropdown',
        settings: [
            {key: 'label', label: 'Field name', type: 'text', required: true},
            {key: 'multiple', label: 'Multiple values', type: 'checkbox'},
            {key: 'options', label: 'Options', type: 'options', required: true},
        ],
    },
    {
        id: 'steps',
        label: 'Steps',
        icon: 'linear_scale',
        group: 'All',
        dataType: 'steps',
        editorComponent: 'steps-editor',
        settings: [
            {key: 'label', label: 'Field name', type: 'text', required: true},
            {key: 'steps', label: 'Steps', type: 'steps', required: true},
            {key: 'required', label: 'Required', type: 'checkbox'},
        ],
    },
    {
        id: 'date',
        label: 'Date',
        icon: 'calendar_today',
        group: 'All',
        dataType: 'date',
        editorComponent: 'datepicker',
        settings: [
            {key: 'label', label: 'Field name', type: 'text', required: true},
            {key: 'format', label: 'Format', type: 'text', defaultValue: 'DD.MM.YYYY'},
            {key: 'defaultValue', label: 'Default value', type: 'text'},
            {key: 'required', label: 'Required', type: 'checkbox'},
        ],
    },
    {
        id: 'number',
        label: 'Number',
        icon: 'tag',
        group: 'All',
        dataType: 'number',
        editorComponent: 'input',
        settings: [
            {key: 'label', label: 'Field name', type: 'text', required: true},
            {key: 'min', label: 'Min', type: 'number'},
            {key: 'max', label: 'Max', type: 'number'},
            {key: 'defaultValue', label: 'Default value', type: 'number'},
        ],
    },
    {
        id: 'money',
        label: 'Money',
        icon: 'payments',
        group: 'All',
        dataType: 'money',
        editorComponent: 'input',
        settings: [
            {key: 'label', label: 'Field name', type: 'text', required: true},
            {key: 'currency', label: 'Currency', type: 'text', defaultValue: 'RUB'},
            {key: 'locale', label: 'Locale', type: 'text', defaultValue: 'ru-RU'},
            {key: 'precision', label: 'Precision', type: 'number', defaultValue: 2},
            {key: 'min', label: 'Min', type: 'number'},
            {key: 'max', label: 'Max', type: 'number'},
            {key: 'defaultValue', label: 'Default value', type: 'number'},
            {key: 'required', label: 'Required', type: 'checkbox'},
        ],
    },
    {
        id: 'rating',
        label: 'Rating',
        icon: 'star',
        group: 'All',
        dataType: 'rating',
        editorComponent: 'rating',
        settings: [
            {key: 'label', label: 'Field name', type: 'text', required: true},
            {key: 'max', label: 'Max value', type: 'number', defaultValue: 5},
            {key: 'starsCount', label: 'Stars count', type: 'number', defaultValue: 5},
            {key: 'showValue', label: 'Show value', type: 'checkbox'},
            {key: 'defaultValue', label: 'Default value', type: 'number'},
            {key: 'required', label: 'Required', type: 'checkbox'},
        ],
    },
    {
        id: 'checkbox',
        label: 'Checkbox',
        icon: 'check_box',
        group: 'All',
        dataType: 'boolean',
        editorComponent: 'checkbox',
        settings: [
            {key: 'label', label: 'Field name', type: 'text', required: true},
        ],
    },
    {
        id: 'user',
        label: 'User',
        icon: 'person',
        group: 'All',
        dataType: 'entity',
        editorComponent: 'dropdown',
        settings: [
            {key: 'label', label: 'Field name', type: 'text', required: true},
            {key: 'multiple', label: 'Multiple users', type: 'checkbox'},
        ],
    },
    {
        id: 'file',
        label: 'File',
        icon: 'attach_file',
        group: 'All',
        dataType: 'file',
        editorComponent: 'file-upload',
        settings: [
            {key: 'label', label: 'Field name', type: 'text', required: true},
            {key: 'multiple', label: 'Multiple files', type: 'checkbox'},
            {key: 'accept', label: 'Accepted formats', type: 'text'},
        ],
    },
    {
        id: 'avatar',
        label: 'Avatar',
        icon: 'account_circle',
        group: 'All',
        dataType: 'image',
        editorComponent: 'file-upload',
        settings: [
            {key: 'label', label: 'Field name', type: 'text', required: true},
            {key: 'accept', label: 'Accepted formats', type: 'text', defaultValue: '.png,.jpg,.jpeg,.gif,.webp,image/*'},
        ],
    },
    {
        id: 'phone',
        label: 'Phone',
        icon: 'phone',
        group: 'All',
        dataType: 'phone',
        editorComponent: 'country-code',
        settings: [
            {key: 'label', label: 'Field name', type: 'text', required: true},
            {key: 'required', label: 'Required', type: 'checkbox'},
        ],
    },
    {
        id: 'email',
        label: 'Email',
        icon: 'mail',
        group: 'All',
        dataType: 'email',
        editorComponent: 'input',
        settings: [
            {key: 'label', label: 'Field name', type: 'text', required: true},
            {key: 'placeholder', label: 'Placeholder', type: 'text', defaultValue: 'name@example.com'},
            {key: 'defaultValue', label: 'Default value', type: 'text'},
        ],
    },
    {
        id: 'password',
        label: 'Password',
        icon: 'password',
        group: 'All',
        dataType: 'password',
        editorComponent: 'input',
        settings: [
            {key: 'label', label: 'Field name', type: 'text', required: true},
            {key: 'placeholder', label: 'Placeholder', type: 'text', defaultValue: 'Enter password'},
            {key: 'required', label: 'Required', type: 'checkbox'},
        ],
        security: {
            restricted: true,
            requiresAccessRequest: true,
        },
    },
    {
        id: 'link',
        label: 'Link',
        icon: 'language',
        group: 'All',
        dataType: 'url',
        editorComponent: 'input',
        settings: [
            {key: 'label', label: 'Field name', type: 'text', required: true},
            {key: 'placeholder', label: 'Placeholder', type: 'text', defaultValue: 'https://example.com'},
            {key: 'defaultValue', label: 'Default value', type: 'text'},
            {key: 'required', label: 'Required', type: 'checkbox'},
        ],
    },
];

app.use('/assets', express.static(PUBLIC_DIR));

const taskStatuses = [
    {id: 1, code: 'new', name: 'Новая', type: 'primary'},
    {id: 2, code: 'in_progress', name: 'В работе', type: 'warning'},
    {id: 3, code: 'review', name: 'На проверке', type: 'warning'},
    {id: 4, code: 'done', name: 'Готово', type: 'success'},
    {id: 5, code: 'failed', name: 'Проблема', type: 'error'},
];

const taskPriorities = [
    {id: 1, code: 'low', name: 'Низкий', type: 'default'},
    {id: 2, code: 'normal', name: 'Обычный', type: 'primary'},
    {id: 3, code: 'high', name: 'Высокий', type: 'warning'},
    {id: 4, code: 'critical', name: 'Критичный', type: 'error'},
];

function normalizeEnumOption(option, index = 0) {
    const id = option?.id ?? option?.value ?? index + 1;
    const code = option?.code ?? option?.xmlId ?? option?.value ?? String(id);
    const label = option?.label || option?.title || option?.name || option?.value || String(id);

    return {
        ...option,
        id,
        value: id,
        code,
        title: option?.title || label,
        label,
        name: option?.name || label,
        type: option?.type || 'default',
    };
}

function normalizeEnumOptions(options = []) {
    return options.map((option, index) => normalizeEnumOption(option, index));
}

function getFieldTypeConfig(type) {
    return fieldTypeRegistry.find((item) => item.id === type) || fieldTypeRegistry[0];
}

function resolveFieldType(field = {}) {
    if (field.fieldType) {
        return field.fieldType;
    }

    if (field.type === 'avatar' || field.dataType === 'image') {
        return 'avatar';
    }

    if (field.type === 'phone' || field.dataType === 'phone') {
        return 'phone';
    }

    if (field.type === 'email' || field.dataType === 'email') {
        return 'email';
    }

    if (field.type === 'link' || field.dataType === 'url') {
        return 'link';
    }

    if (field.type === 'money' || field.dataType === 'money') {
        return 'money';
    }

    if (field.type === 'rating' || field.dataType === 'rating' || field.editor?.component?.type === 'rating') {
        return 'rating';
    }

    if (field.type === 'steps' || field.dataType === 'steps' || field.editor?.component?.type === 'steps-editor') {
        return 'steps';
    }

    if (field.type === 'users' || field.type === 'user') {
        return 'user';
    }

    if (field.type === 'progress' || field.column?.renderer === 'progress-scale') {
        return 'number';
    }

    if (field.dataType === 'enum' || field.type === 'enum') {
        return 'dropdown';
    }

    if (field.editor?.component?.type === 'dropdown' || field.dataType === 'entity' || field.type === 'entity') {
        return 'dropdown';
    }

    if (field.dataType === 'date' || field.type === 'date') {
        return 'date';
    }

    if (field.editor?.component?.type === 'file-upload') {
        return 'file';
    }

    if (field.editor?.component?.type === 'editor' || field.editor?.control === 'textarea') {
        return 'textarea';
    }

    if (field.dataType === 'number' || field.dataType === 'integer') {
        return 'number';
    }

    return 'text';
}

function normalizeFieldDefinition(field = {}, entity = 'task', index = 0) {
    const fieldType = resolveFieldType(field);
    const typeConfig = getFieldTypeConfig(fieldType);
    const multiple = Boolean(field.multiple || field.editor?.component?.props?.multiple);
    const system = field.system !== false && field.custom !== true;

    return {
        ...field,
        id: field.id || field.key,
        entity,
        fieldType,
        fieldKind: system ? 'system' : 'custom',
        system,
        custom: !system,
        icon: field.icon || typeConfig.icon,
        group: field.group || typeConfig.group,
        order: field.order || (index + 1) * 10,
        schema: {
            key: field.key,
            label: field.label,
            fieldType,
            dataType: field.dataType || typeConfig.dataType,
            multiple,
            required: Boolean(field.required),
            defaultValue: field.defaultValue ?? null,
            options: field.filter?.options || field.editor?.options || [],
            settings: field.settings || {},
        },
        permissions: {
            create: field.permissions?.create ?? true,
            update: field.permissions?.update ?? true,
            delete: field.permissions?.delete ?? !system,
            configure: field.permissions?.configure ?? true,
        },
        typeConfig: {
            id: typeConfig.id,
            label: typeConfig.label,
            icon: typeConfig.icon,
            group: typeConfig.group,
            settings: typeConfig.settings,
        },
    };
}

function normalizeFieldDefinitions(fields = [], entity = 'task') {
    return fields.map((field, index) => normalizeFieldDefinition(field, entity, index));
}

let users = Array.from({length: MOCK_USERS_COUNT}, (_, index) => {
    const now = new Date();
    const prev = new Date();
    prev.setFullYear(now.getFullYear() - 2);

    const createdAt = faker.date.between({from: prev, to: now});
    const updatedAt = faker.date.between({from: createdAt, to: now});

    const firstName = faker.person.firstName();
    const middleName = faker.person.middleName();
    const lastName = faker.person.lastName();

    return {
        id: index + 1,
        firstName,
        lastName,
        middleName: middleName,
        fullName: `${firstName} ${middleName} ${lastName}`,
        email: faker.internet.email({firstName, lastName}),
        phone: faker.phone.number({ style: 'international' }),
        avatar: '',
        createdAt: formatIsoDate(createdAt),
        updatedAt: formatIsoDate(updatedAt),
    };
});

let projects = Array.from({length: MOCK_PROJECTS_COUNT}, (_, index) => {
    const name = `${faker.word.noun()}.${faker.word.noun()}`;

    return {
        id: index + 1,
        value: index + 1,
        title: name,
        label: name,
        name,
    };
});

const taskColumns = [
    {key: 'id', label: 'ID', sortable: true, visible: true},
    {key: 'title', label: 'Название задачи', sortable: true, visible: true},
    {key: 'project', label: 'Проект', sortable: true, visible: true},
    {key: 'status', label: 'Статус', sortable: true, visible: true},
    {key: 'priority', label: 'Приоритет', sortable: true, visible: true},
    {key: 'progress', label: 'Прогресс', sortable: true, visible: true},
    {key: 'creator', label: 'Постановщик', visible: true},
    {key: 'responsible', label: 'Ответственный', visible: true},
    {key: 'observers', label: 'Наблюдатели', visible: true},
    {key: 'deadline', label: 'Крайний срок', sortable: true, visible: true},
    {key: 'createdAt', label: 'Создана', sortable: true, visible: true},
    {key: 'updatedAt', label: 'Обновлена', sortable: true, visible: true},
];

const taskFilterFields = normalizeFieldDefinitions([
    createNumberField({key: 'id', label: 'ID', editorEnabled: false}),
    createTextField({key: 'title', label: 'Название задачи'}),
    createDropDown({
        key: 'project',
        label: 'Проект',
        multiple: false,
        source: 'id',
        valueField: 'id',
        displayField: 'title',
    }),
    createEnumField({
        key: 'status',
        label: 'Статус',
        options: taskStatuses,
        renderer: 'tag',
    }),
    createEnumField({
        key: 'priority',
        label: 'Приоритет',
        options: taskPriorities,
        renderer: 'tag',
    }),
    createNumberField({
        key: 'progress',
        label: 'Прогресс',
        control: 'range',
        renderer: 'progress-scale',
    }),
    createUserEntityField({
        key: 'creator',
        label: 'Постановщик',
        multiple: false,
    }),
    createUserEntityField({
        key: 'responsible',
        label: 'Ответственный',
        multiple: false,
    }),
    createUserEntityField({
        key: 'observers',
        label: 'Наблюдатели',
        multiple: true,
    }),
    createDateField({key: 'deadline', label: 'Крайний срок'}),
    createDateField({key: 'createdAt', label: 'Создана'}),
    createDateField({key: 'updatedAt', label: 'Обновлена'}),
    createHtmlField({key: 'comment', label: 'Комментарий'}),
], 'task');

const taskDetailFields = normalizeFieldDefinitions(taskFilterFields.map((field) => ({
    ...field,
    detail: {
        enabled: true,
        renderer: field.column?.renderer || field.type || field.dataType || 'text',
        ...(field.detail || {}),
    },
})), 'task');

const userDetailFields = normalizeFieldDefinitions([
    createNumberField({key: 'id', label: 'ID', editorEnabled: false}),
    createTextField({key: 'firstName', label: 'Имя'}),
    createTextField({key: 'middleName', label: 'Отчество'}),
    createTextField({key: 'lastName', label: 'Фамилия'}),
    createTextField({key: 'fullName', label: 'ФИО'}),
    createEmailField({key: 'email', label: 'Email'}),
    createPhoneField({key: 'phone', label: 'Телефон'}),
    createAvatarField({key: 'avatar', label: 'Аватар'}),
    createDateField({key: 'createdAt', label: 'Создан'}),
    createDateField({key: 'updatedAt', label: 'Обновлен'}),
].map((field) => ({
    ...field,
    detail: {
        enabled: true,
        renderer: field.detail?.renderer || field.column?.renderer || field.type || field.dataType || 'text',
        ...(field.detail || {}),
    },
})), 'user');

function normalizeFieldKey(value = '') {
    const normalized = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/_{2,}/g, '_');

    return normalized || `custom_field_${Date.now()}`;
}

function normalizeCustomFieldSettings(payload = {}) {
    const settings = payload.settings && typeof payload.settings === 'object'
        ? payload.settings
        : payload;
    const fieldType = settings.fieldType || payload.fieldType || payload.type || 'text';
    const label = String(settings.label || settings.name || payload.label || payload.name || 'Новое поле').trim();
    const key = normalizeFieldKey(settings.key || settings.code || payload.key || payload.code || label);

    return {
        ...settings,
        fieldType,
        key,
        label,
        multiple: Boolean(settings.multiple || payload.multiple),
        required: Boolean(settings.required || payload.required),
        defaultValue: settings.defaultValue ?? payload.defaultValue ?? null,
        options: Array.isArray(settings.options)
            ? settings.options
            : Array.isArray(payload.options)
                ? payload.options
                : [],
        steps: Array.isArray(settings.steps)
            ? settings.steps
            : Array.isArray(payload.steps)
                ? payload.steps
                : [],
    };
}

function createCustomDropdownField(settings = {}) {
    const options = normalizeEnumOptions(
        settings.options.length
            ? settings.options
            : [
                {id: 1, value: 1, label: 'Option 1', title: 'Option 1', name: 'Option 1'},
                {id: 2, value: 2, label: 'Option 2', title: 'Option 2', name: 'Option 2'},
            ],
    );
    const field = createEnumField({
        key: settings.key,
        label: settings.label,
        options,
        renderer: settings.renderer || 'tag',
    });

    return {
        ...field,
        multiple: settings.multiple,
        filter: {
            ...(field.filter || {}),
            control: settings.multiple ? 'multi-select' : 'single-select',
            options,
        },
        editor: {
            ...(field.editor || {}),
            options,
            component: {
                ...(field.editor?.component || {}),
                props: {
                    ...(field.editor?.component?.props || {}),
                    items: options,
                    multiple: settings.multiple,
                    placeholder: settings.placeholder || settings.label,
                },
            },
        },
    };
}

function applyCustomEditorSettings(field = {}, settings = {}) {
    const editorComponent = field.editor?.component;

    if (!editorComponent) {
        return field;
    }

    const props = {};

    ['placeholder', 'accept', 'format', 'min', 'max', 'step', 'rows', 'starsCount'].forEach((key) => {
        if (settings[key] === '' || settings[key] === null || typeof settings[key] === 'undefined') {
            return;
        }

        props[key] = settings[key];
    });

    if (typeof settings.multiple !== 'undefined') {
        props.multiple = Boolean(settings.multiple);
    }

    if (typeof settings.showValue !== 'undefined') {
        props.showValue = Boolean(settings.showValue);
    }

    if (settings.accept && editorComponent.type === 'file-upload') {
        props.formats = settings.accept;
        props.supportingText = settings.accept;
    }

    return {
        ...field,
        editor: {
            ...(field.editor || {}),
            component: {
                ...editorComponent,
                props: {
                    ...(editorComponent.props || {}),
                    ...props,
                },
            },
        },
    };
}

function createCustomFieldDefinition(entity = 'task', payload = {}) {
    const settings = normalizeCustomFieldSettings(payload);
    const baseProps = {
        key: settings.key,
        label: settings.label,
    };
    const fieldFactories = {
        avatar: () => createAvatarField(baseProps),
        checkbox: () => createCheckboxField(baseProps),
        date: () => createDateField(baseProps),
        dropdown: () => createCustomDropdownField(settings),
        email: () => createEmailField(baseProps),
        file: () => createFileField(baseProps),
        money: () => createMoneyField({
            ...baseProps,
            currency: settings.currency || 'RUB',
            locale: settings.locale || 'ru-RU',
            precision: settings.precision ?? 2,
        }),
        number: () => createNumberField(baseProps),
        password: () => createPasswordField(baseProps),
        phone: () => createPhoneField(baseProps),
        rating: () => createRatingField({
            ...baseProps,
            max: settings.max || 5,
            starsCount: settings.starsCount || settings.max || 5,
            showValue: settings.showValue,
        }),
        steps: () => createStepsField({
            ...baseProps,
            steps: settings.steps,
        }),
        html: () => createHtmlField(baseProps),
        textarea: () => createTextareaField({
            ...baseProps,
            rows: settings.rows || 3,
        }),
        text: () => createTextField(baseProps),
        user: () => createUserEntityField({
            ...baseProps,
            multiple: settings.multiple,
        }),
        link: () => createLinkField(baseProps),
    };
    const factory = fieldFactories[settings.fieldType] || fieldFactories.text;
    const field = applyCustomEditorSettings(factory(), settings);
    const defaultValue = settings.defaultValue ?? field.defaultValue;

    return normalizeFieldDefinition({
        ...field,
        id: settings.id || settings.key,
        key: settings.key,
        label: settings.label,
        fieldType: settings.fieldType,
        system: false,
        custom: true,
        required: settings.required,
        defaultValue,
        settings,
        permissions: {
            create: true,
            update: true,
            delete: true,
            configure: true,
            ...(settings.permissions || {}),
        },
        schema: {
            ...(field.schema || {}),
            key: settings.key,
            label: settings.label,
            fieldType: settings.fieldType,
            multiple: settings.multiple,
            required: settings.required,
            defaultValue,
            options: settings.options,
            settings,
        },
    }, entity);
}

function getStoredCustomFields(entity = 'task') {
    const fields = storeData.mockData?.fields?.[entity];

    if (!Array.isArray(fields)) {
        return [];
    }

    const indexByKey = new Map();
    const result = [];

    fields.forEach((field) => {
        const key = String(field?.key || '').trim();

        if (!field || typeof field !== 'object' || !key) {
            return;
        }

        if (!indexByKey.has(key)) {
            indexByKey.set(key, result.length);
            result.push(field);
            return;
        }

        result[indexByKey.get(key)] = field;
    });

    return result;
}

function getSystemFieldKeys(entity = 'task') {
    const fields = entity === 'user' ? userDetailFields : taskFilterFields;

    return new Set(fields.map((field) => field?.key).filter(Boolean));
}

function getStoredFieldOverrides(entity = 'task') {
    const overrides = storeData.mockData?.fieldOverrides?.[entity];

    return overrides && typeof overrides === 'object' ? overrides : {};
}

function applyFieldSettingsToDefinition(field = {}, settings = {}, entity = 'task') {
    if (!field?.key || !settings || typeof settings !== 'object') {
        return field;
    }

    const nextOptions = Array.isArray(settings.options)
        ? normalizeEnumOptions(settings.options)
        : null;
    const nextField = applyCustomEditorSettings({
        ...field,
        label: settings.label || field.label,
        required: Boolean(settings.required),
        multiple: typeof settings.multiple !== 'undefined'
            ? Boolean(settings.multiple)
            : Boolean(field.multiple),
        defaultValue: settings.defaultValue ?? field.defaultValue ?? null,
        settings: {
            ...(field.settings || {}),
            ...settings,
            key: field.key,
            fieldType: settings.fieldType || field.fieldType || field.schema?.fieldType,
        },
        schema: {
            ...(field.schema || {}),
            key: field.key,
            label: settings.label || field.schema?.label || field.label,
            required: Boolean(settings.required),
            multiple: typeof settings.multiple !== 'undefined'
                ? Boolean(settings.multiple)
                : Boolean(field.schema?.multiple || field.multiple),
            defaultValue: settings.defaultValue ?? field.schema?.defaultValue ?? field.defaultValue ?? null,
            ...(nextOptions ? {options: nextOptions} : {}),
            settings: {
                ...(field.schema?.settings || {}),
                ...settings,
                key: field.key,
                fieldType: settings.fieldType || field.schema?.fieldType || field.fieldType,
            },
        },
        filter: {
            ...(field.filter || {}),
            ...(nextOptions ? {options: nextOptions} : {}),
        },
        editor: {
            ...(field.editor || {}),
            ...(nextOptions ? {options: nextOptions} : {}),
            component: field.editor?.component
                ? {
                    ...(field.editor.component || {}),
                    props: {
                        ...(field.editor.component?.props || {}),
                        ...(nextOptions ? {items: nextOptions} : {}),
                    },
                }
                : field.editor?.component,
        },
    }, settings);

    return normalizeFieldDefinition(nextField, entity);
}

function applyFieldOverrides(entity = 'task', fields = []) {
    const overrides = getStoredFieldOverrides(entity);

    return fields.map((field) => {
        const settings = overrides[field?.key];

        return settings ? applyFieldSettingsToDefinition(field, settings, entity) : field;
    });
}

function getCustomFieldDefinitions(entity = 'task') {
    const systemKeys = getSystemFieldKeys(entity);

    return getStoredCustomFields(entity).map((field, index) =>
        normalizeFieldDefinition(field, entity, taskFilterFields.length + index),
    ).filter((field) => !systemKeys.has(field.key));
}

function cloneFieldDefaultValue(value) {
    if (value === null || typeof value === 'undefined') {
        return undefined;
    }

    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
}

function applyDefaultValueToItems(items = [], field = {}) {
    const defaultValue = cloneFieldDefaultValue(field.defaultValue);

    if (typeof defaultValue === 'undefined') {
        return items;
    }

    return items.map((item) => {
        if (Object.prototype.hasOwnProperty.call(item, field.key)) {
            return item;
        }

        return {
            ...item,
            [field.key]: cloneFieldDefaultValue(field.defaultValue),
        };
    });
}

function getTaskFilterFields() {
    return applyFieldOverrides('task', [
        ...taskFilterFields,
        ...getCustomFieldDefinitions('task'),
    ]);
}

function getTaskDetailFields() {
    return applyFieldOverrides('task', [
        ...taskDetailFields,
        ...getCustomFieldDefinitions('task'),
    ]);
}

function getTaskColumns() {
    const customColumns = getCustomFieldDefinitions('task')
        .filter((field) => field.column?.enabled !== false)
        .map((field) => ({
            key: field.key,
            label: field.label,
            type: field.type || field.dataType || field.fieldType || 'text',
            fieldType: field.fieldType || field.type || field.dataType || 'text',
            renderer: field.column?.renderer || field.type || field.dataType || 'text',
            component: field.column?.component || null,
            column: field.column || null,
            sortable: field.capabilities?.sortable !== false,
            visible: field.column?.visible !== false,
            displayField: field.column?.displayField || field.displayField,
            displayOptions: field.displayOptions || null,
        }));

    return [
        ...taskColumns,
        ...customColumns,
    ];
}

function getUserDetailFields() {
    return applyFieldOverrides('user', [
        ...userDetailFields,
        ...getCustomFieldDefinitions('user'),
    ]);
}

function normalizeEntityName(value = 'task') {
    const entity = String(value || '').trim().toLowerCase();

    if (entity === 'tasks' || entity === 'task') {
        return 'task';
    }

    if (entity === 'users' || entity === 'user') {
        return 'user';
    }

    return null;
}

function getEntityFields(entity = 'task') {
    return entity === 'user' ? getUserDetailFields() : getTaskFilterFields();
}

function applyDefaultValueToEntityItems(entity = 'task', field = {}) {
    if (entity === 'task') {
        taskRows = applyDefaultValueToItems(taskRows, field);
        storeData.mockData.tasks = taskRows;
    }

    if (entity === 'user') {
        users = applyDefaultValueToItems(users, field);
        storeData.mockData.users = users;
    }
}

function addCustomFieldDefinition(entity = 'task', payload = {}) {
    const normalizedEntity = normalizeEntityName(entity);

    if (!normalizedEntity) {
        throw new Error('Unknown entity');
    }

    const currentFields = getStoredCustomFields(normalizedEntity);
    const existingKeys = new Set([
        ...getEntityFields(normalizedEntity).map((field) => field.key),
    ]);
    const field = createCustomFieldDefinition(normalizedEntity, payload);

    if (existingKeys.has(field.key)) {
        throw new Error(`Field "${field.key}" already exists`);
    }

    storeData.mockData = {
        ...(storeData.mockData || {}),
        fields: {
            ...(storeData.mockData?.fields || {}),
            [normalizedEntity]: [
                ...currentFields,
                field,
            ],
        },
    };

    applyDefaultValueToEntityItems(normalizedEntity, field);

    return field;
}

function updateFieldDefinition(entity = 'task', fieldKey = '', payload = {}) {
    const normalizedEntity = normalizeEntityName(entity);
    const normalizedFieldKey = String(fieldKey || '').trim();

    if (!normalizedEntity) {
        throw new Error('Unknown entity');
    }

    if (!normalizedFieldKey) {
        throw new Error('Field key is required');
    }

    const currentFields = getStoredCustomFields(normalizedEntity);
    const customIndex = currentFields.findIndex((item) => item?.key === normalizedFieldKey);
    const currentField = customIndex >= 0
        ? currentFields[customIndex]
        : getEntityFields(normalizedEntity).find((item) => item?.key === normalizedFieldKey);

    if (!currentField) {
        throw new Error(`Field "${normalizedFieldKey}" not found`);
    }

    if (currentField.permissions?.update === false || currentField.permissions?.configure === false) {
        throw new Error(`Field "${normalizedFieldKey}" cannot be updated`);
    }

    const settings = normalizeCustomFieldSettings({
        ...(payload || {}),
        settings: {
            ...(currentField.settings || currentField.schema?.settings || {}),
            ...(payload.settings || payload || {}),
            key: normalizedFieldKey,
            fieldType: payload.fieldType || payload.settings?.fieldType || currentField.fieldType || currentField.schema?.fieldType,
        },
    });
    const updatedField = customIndex >= 0
        ? createCustomFieldDefinition(normalizedEntity, {
            settings: {
                ...settings,
                id: currentField.id || normalizedFieldKey,
                key: normalizedFieldKey,
            },
        })
        : applyFieldSettingsToDefinition(currentField, settings, normalizedEntity);

    if (customIndex >= 0) {
        storeData.mockData = {
            ...(storeData.mockData || {}),
            fields: {
                ...(storeData.mockData?.fields || {}),
                [normalizedEntity]: currentFields.map((item, index) =>
                    index === customIndex ? updatedField : item,
                ),
            },
        };
    } else {
        storeData.mockData = {
            ...(storeData.mockData || {}),
            fieldOverrides: {
                ...(storeData.mockData?.fieldOverrides || {}),
                [normalizedEntity]: {
                    ...getStoredFieldOverrides(normalizedEntity),
                    [normalizedFieldKey]: {
                        ...(getStoredFieldOverrides(normalizedEntity)[normalizedFieldKey] || {}),
                        ...settings,
                        key: normalizedFieldKey,
                    },
                },
            },
        };
    }

    applyDefaultValueToEntityItems(normalizedEntity, updatedField);

    return updatedField;
}

function omitItemField(item = {}, fieldKey) {
    if (!item || !fieldKey) {
        return item;
    }

    const nextItem = {...item};
    delete nextItem[fieldKey];

    return nextItem;
}

function removeFieldFromViewSettings(fieldKey = '') {
    Object.keys(viewSettingsData || {}).forEach((settingsKey) => {
        const settings = viewSettingsData[settingsKey];

        if (!settings || typeof settings !== 'object') {
            return;
        }

        ['filter', 'detail', 'editor'].forEach((sectionKey) => {
            const fields = settings[sectionKey]?.fields;

            if (fields && typeof fields === 'object') {
                delete fields[fieldKey];
            }
        });

        if (settings.table?.columns && typeof settings.table.columns === 'object') {
            delete settings.table.columns[fieldKey];
        }

        settings.updatedAt = new Date().toISOString();
    });
}

function removeCustomFieldDefinition(entity = 'task', fieldKey = '') {
    const normalizedEntity = normalizeEntityName(entity);
    const normalizedFieldKey = String(fieldKey || '').trim();

    if (!normalizedEntity) {
        throw new Error('Unknown entity');
    }

    if (!normalizedFieldKey) {
        throw new Error('Field key is required');
    }

    const currentFields = getStoredCustomFields(normalizedEntity);
    const field = currentFields.find((item) => item?.key === normalizedFieldKey);

    if (!field) {
        throw new Error(`Field "${normalizedFieldKey}" not found`);
    }

    if (field.permissions?.delete === false) {
        throw new Error(`Field "${normalizedFieldKey}" cannot be deleted`);
    }

    storeData.mockData = {
        ...(storeData.mockData || {}),
        fields: {
            ...(storeData.mockData?.fields || {}),
            [normalizedEntity]: currentFields.filter((item) => item?.key !== normalizedFieldKey),
        },
    };

    if (normalizedEntity === 'task') {
        taskRows = taskRows.map((row) => omitItemField(row, normalizedFieldKey));
        storeData.mockData.tasks = taskRows;
    }

    if (normalizedEntity === 'user') {
        users = users.map((user) => omitItemField(user, normalizedFieldKey));
        storeData.mockData.users = users;
    }

    removeFieldFromViewSettings(normalizedFieldKey);

    return field;
}

const hasTemplates = await fileExists(DATA_FILE);
let storeData = {
    templates: {},
    tableSettings: {},
    viewSettings: {},
    mockData: {},
};
let templateData = {};
let tableSettingsData = {};
let viewSettingsData = {};

if (hasTemplates) {
    const rawData = await fs.readFile(DATA_FILE, 'utf8');
    const parsedData = JSON.parse(rawData);
    const hasStoreShape =
        parsedData &&
        typeof parsedData === 'object' &&
        !Array.isArray(parsedData) &&
        (
            Object.prototype.hasOwnProperty.call(parsedData, 'templates') ||
            Object.prototype.hasOwnProperty.call(parsedData, 'tableSettings') ||
            Object.prototype.hasOwnProperty.call(parsedData, 'viewSettings') ||
            Object.prototype.hasOwnProperty.call(parsedData, 'mockData')
        );

    storeData = hasStoreShape
        ? {
            templates: parsedData.templates || {},
            tableSettings: parsedData.tableSettings || {},
            viewSettings: parsedData.viewSettings || {},
            mockData: parsedData.mockData || {},
        }
        : {
            templates: parsedData || {},
            tableSettings: {},
            viewSettings: {},
            mockData: {},
        };
    templateData = storeData.templates;
    tableSettingsData = storeData.tableSettings;
    viewSettingsData = migrateViewSettings(
        storeData.viewSettings,
        storeData.tableSettings,
    );
}

let taskRows = Array.from(
    {length: MOCK_TASKS_COUNT},
    (_, index) => createTaskRow(index),
);

function createTextField({key, label}) {
    return {
        key,
        label,
        dataType: 'string',
        type: 'string',
        column: {
            enabled: true,
            visible: true,
            renderer: 'text',
        },
        filter: {
            enabled: true,
            control: 'text',
            operators: ['contains', 'eq', 'startsWith'],
            defaultOperator: 'contains',
        },
        detail: {
            enabled: true,
            renderer: 'text',
            component: null,
        },
        editor: {
            enabled: true,
            control: 'text',
            component: {
                type: 'input',
                props: {
                    type: 'bordered',
                    size: 1,
                },
            },
        },
        capabilities: createDefaultCapabilities(),
        displayOptions: {
            columnRenderers: ['text', 'link'],
            filterControls: ['text'],
            editorControls: ['text'],
        },
    };
}

function createEmailField({key, label}) {
    const field = createTextField({key, label});

    return {
        ...field,
        dataType: 'email',
        type: 'email',
        editor: {
            ...field.editor,
            control: 'email',
            component: {
                ...field.editor.component,
                props: {
                    ...field.editor.component.props,
                    leftIcon: 'mail',
                    inputType: 'email',
                    mask: true,
                    placeholder: 'name@example.com',
                    maskOptions: JSON.stringify({
                        maskRegex: '^[^\\s@]*@?[^\\s@]*$',
                    }),
                },
            },
        },
        displayOptions: {
            ...field.displayOptions,
            editorControls: ['email', 'text'],
        },
    };
}

function createPasswordField({key, label}) {
    const field = createTextField({key, label});

    return {
        ...field,
        dataType: 'password',
        type: 'password',
        column: {
            ...field.column,
            renderer: 'masked',
        },
        filter: {
            enabled: false,
            control: 'none',
            operators: [],
        },
        detail: {
            ...field.detail,
            renderer: 'masked',
        },
        editor: {
            ...field.editor,
            control: 'password',
            component: {
                ...field.editor.component,
                props: {
                    ...field.editor.component.props,
                    inputType: 'password',
                    autocomplete: 'new-password',
                    placeholder: 'Enter password',
                },
            },
        },
        security: {
            restricted: true,
            requiresAccessRequest: true,
        },
        displayOptions: {
            ...field.displayOptions,
            columnRenderers: ['masked'],
            filterControls: [],
            editorControls: ['password'],
        },
    };
}

function createLinkField({key, label}) {
    const field = createTextField({key, label});

    return {
        ...field,
        dataType: 'url',
        type: 'link',
        column: {
            ...field.column,
            renderer: 'link',
            component: {
                type: 'link',
                props: {
                    noWrap: true,
                },
            },
        },
        detail: {
            ...field.detail,
            renderer: 'link',
            component: {
                type: 'link',
                props: {},
            },
        },
        editor: {
            ...field.editor,
            control: 'link',
            component: {
                ...field.editor.component,
                props: {
                    ...field.editor.component.props,
                    leftIcon: 'language',
                    inputType: 'url',
                    placeholder: 'https://example.com',
                },
            },
        },
        displayOptions: {
            ...field.displayOptions,
            columnRenderers: ['text', 'link'],
            editorControls: ['link', 'text'],
        },
    };
}

function createAvatarField({key, label}) {
    const field = createTextField({key, label});

    return {
        ...field,
        dataType: 'image',
        type: 'avatar',
        detail: {
            enabled: true,
            renderer: 'avatar-label',
            component: {
                type:  'avatar',
                props: {
                    template: 'default',
                    size: 3,
                    inactive: true,
                }
            },
        },
        editor: {
            ...field.editor,
            control: 'file-upload',
            component: {
                type: 'file-upload',
                props: {
                    size: 1,
                    previewType: 'avatar',
                    previewOpen: true,
                    icon: 'image',
                    linkText: 'Загрузить аватар',
                    text: 'или перетащите файл',
                    formats: 'PNG, JPG, JPEG, GIF, WEBP',
                    supportingText: 'PNG, JPG, JPEG, GIF, WEBP',
                    accept: '.png,.jpg,.jpeg,.gif,.webp,image/*',
                    multiple: false,
                },
            },
        },
        displayOptions: {
            ...field.displayOptions,
            editorControls: ['file-upload', 'text'],
        },
    };
}

function createFileField({key, label}) {
    const field = createTextField({key, label});

    return {
        ...field,
        dataType: 'file',
        type: 'file',
        column: {
            enabled: true,
            visible: true,
            renderer: 'text',
        },
        detail: {
            enabled: true,
            renderer: 'file-preview',
            component: {
                type: 'file-preview',
                props: {
                    open: true,
                },
            },
        },
        editor: {
            ...field.editor,
            control: 'file-upload',
            component: {
                type: 'file-upload',
                props: {
                    size: 1,
                    previewOpen: true,
                    icon: 'attach_file',
                    linkText: 'Загрузить файл',
                    text: 'или перетащите файл',
                    multiple: false,
                },
            },
        },
        displayOptions: {
            ...field.displayOptions,
            editorControls: ['file-upload', 'text'],
        },
    };
}

function createPhoneField({key, label}) {
    const field = createTextField({key, label});

    return {
        ...field,
        dataType: 'phone',
        type: 'phone',
        editor: {
            ...field.editor,
            control: 'phone',
            component: {
                type: 'country-code',
                props: {
                    type: 'bordered',
                    size: 1,
                    locale: 'ru',
                    fallbackIso2: 'RU',
                    useMask: true,
                    useCountryMasks: true,
                    maskStyle: 'native',
                    showMaskPlaceholder: true,
                    lazyFlags: true,
                    showCode: true,
                    multiCountry: true,
                    placeholder: '+7 (___) ___-__-__',
                },
            },
        },
        displayOptions: {
            ...field.displayOptions,
            editorControls: ['phone', 'text'],
        },
    };
}

function createCheckboxField({key, label}) {
    return {
        key,
        label,
        dataType: 'boolean',
        type: 'boolean',
        column: {
            enabled: true,
            visible: true,
            renderer: 'text',
        },
        filter: {
            enabled: true,
            control: 'single-select',
            operators: ['eq'],
            defaultOperator: 'eq',
            options: [
                {id: true, value: true, label: 'Да', title: 'Да', name: 'Да'},
                {id: false, value: false, label: 'Нет', title: 'Нет', name: 'Нет'},
            ],
        },
        detail: {
            enabled: true,
            renderer: 'checkbox',
            component: null,
        },
        editor: {
            enabled: true,
            control: 'checkbox',
            component: {
                type: 'checkbox',
                props: {
                    size: 1,
                    label,
                },
            },
        },
        capabilities: createDefaultCapabilities(),
        displayOptions: {
            columnRenderers: ['text'],
            filterControls: ['single-select'],
            editorControls: ['checkbox'],
        },
    };
}

function normalizeStepItems(steps = []) {
    const source = Array.isArray(steps) && steps.length
        ? steps
        : [
            {key: 'step_1', label: 'Step 1'},
            {key: 'step_2', label: 'Step 2'},
            {key: 'step_3', label: 'Step 3'},
        ];

    return source
        .map((step, index) => {
            if (typeof step === 'string') {
                return {
                    key: `step_${index + 1}`,
                    label: step,
                };
            }

            if (!step || typeof step !== 'object') {
                return null;
            }

            const label = step.label || step.title || step.name || step.text || `Step ${index + 1}`;

            return {
                ...step,
                key: step.key || step.id || step.value || `step_${index + 1}`,
                label,
            };
        })
        .filter(Boolean);
}

function createStepsField({key, label, steps = []}) {
    const items = normalizeStepItems(steps);
    const defaultValue = {
        current: 0,
    };

    return {
        key,
        label,
        dataType: 'steps',
        type: 'steps',
        fieldType: 'steps',
        defaultValue,
        column: {
            enabled: true,
            visible: true,
            renderer: 'steps',
            component: {
                type: 'steps',
                props: {
                    size: 1,
                },
            },
        },
        filter: {
            enabled: false,
            control: 'text',
            operators: ['contains', 'eq'],
            defaultOperator: 'contains',
        },
        detail: {
            enabled: true,
            renderer: 'steps',
            component: {
                type: 'steps',
                props: {
                    size: 1,
                    items,
                },
            },
        },
        editor: {
            enabled: true,
            control: 'steps',
            component: {
                type: 'steps',
                props: {
                    size: 1,
                    interactive: true,
                    items,
                },
            },
        },
        settings: {
            steps: items,
        },
        capabilities: createDefaultCapabilities(),
        displayOptions: {
            columnRenderers: ['text','steps'],
            filterControls: ['text'],
            editorControls: ['steps'],
        },
    };
}

function createHtmlField({key, label}) {
    return {
        key,
        label,
        dataType: 'html',
        type: 'html',
        column: {
            enabled: false,
            visible: false,
            renderer: 'text',
        },
        filter: {
            enabled: true,
            control: 'text',
            operators: ['contains', 'eq'],
            defaultOperator: 'contains',
        },
        detail: {
            enabled: true,
            renderer: 'text',
            component: null,
        },
        editor: {
            enabled: true,
            control: 'html',
            component: {
                type: 'editor',
                props: {
                    placeholder: 'Введите текст'
                },
            },
        },
        capabilities: createDefaultCapabilities(),
        displayOptions: {
            columnRenderers: ['text'],
            filterControls: ['text'],
            editorControls: ['html'],
        },
    };
}

function createTextareaField({key, label, rows = 3}) {
    return {
        key,
        label,
        dataType: 'string',
        type: 'textarea',
        column: {
            enabled: true,
            visible: true,
            renderer: 'text',
        },
        filter: {
            enabled: true,
            control: 'text',
            operators: ['contains', 'eq'],
            defaultOperator: 'contains',
        },
        detail: {
            enabled: true,
            renderer: 'text',
            component: null,
        },
        editor: {
            enabled: true,
            control: 'textarea',
            component: {
                type: 'textarea',
                props: {
                    type: 'bordered',
                    size: 1,
                    rows,
                    placeholder: 'Введите текст',
                },
            },
        },
        settings: {
            rows,
        },
        capabilities: createDefaultCapabilities(),
        displayOptions: {
            columnRenderers: ['text'],
            filterControls: ['text'],
            editorControls: ['textarea'],
        },
    };
}

function createNumberField({key, label, control = 'number', renderer = 'text', editorEnabled = true}) {
    const isProgress = control === 'range' || renderer === 'progress-scale';
    const type = isProgress ? 'progress' : 'integer';
    const editorComponent = {
        type: 'input',
        props: {
            type: 'bordered',
            inputType: 'number',
            size: 1,
        },
    }

    return {
        key,
        label,
        dataType: isProgress ? 'number' : 'integer',
        type,
        column: {
            enabled: true,
            visible: true,
            renderer,
            component: isProgress
                ? {
                    type: 'progress-scale',
                    props: {
                        size: 1,
                    },
                }
                : null,
        },
        filter: {
            enabled: true,
            control,
            operators: ['eq', 'gt', 'gte', 'lt', 'lte', 'between'],
            defaultOperator: 'eq',
        },
        detail: {
            enabled: true,
            renderer: 'text',
            component: null,
        },
        editor: {
            enabled: editorEnabled,
            control,
            component: editorComponent,
        },
        capabilities: createDefaultCapabilities(),
        displayOptions: {
            columnRenderers: ['text', 'badge', 'progress-scale'],
            filterControls: ['number', 'range'],
            editorControls: ['number', 'range'],
        },
    };
}

function createMoneyField({
    key,
    label,
    currency = 'RUB',
    locale = 'ru-RU',
    precision = 2,
    editorEnabled = true,
}) {
    return {
        key,
        label,
        dataType: 'money',
        type: 'money',
        column: {
            enabled: true,
            visible: true,
            renderer: 'text',
            component: null,
        },
        filter: {
            enabled: true,
            control: 'number',
            operators: ['eq', 'gt', 'gte', 'lt', 'lte', 'between'],
            defaultOperator: 'eq',
        },
        detail: {
            enabled: true,
            renderer: 'text',
            component: null,
        },
        editor: {
            enabled: editorEnabled,
            control: 'money',
            component: {
                type: 'input',
                props: {
                    type: 'bordered',
                    inputType: 'number',
                    size: 1,
                    step: String(1 / (10 ** Number(precision || 2))),
                },
            },
        },
        settings: {
            currency,
            locale,
            precision,
        },
        capabilities: createDefaultCapabilities(),
        displayOptions: {
            columnRenderers: ['text'],
            filterControls: ['number', 'range'],
            editorControls: ['money', 'number'],
        },
    };
}

function createRatingField({
    key,
    label,
    max = 5,
    starsCount = 5,
    showValue = false,
    editorEnabled = true,
}) {
    const safeMax = Math.max(1, Number(max) || 5);
    const safeStarsCount = Math.max(1, Number(starsCount) || safeMax);
    const componentProps = {
        size: 1,
        max: safeMax,
        starsCount: safeStarsCount,
        showValue: Boolean(showValue),
    };

    return {
        key,
        label,
        dataType: 'rating',
        type: 'rating',
        fieldType: 'rating',
        defaultValue: 0,
        column: {
            enabled: true,
            visible: true,
            renderer: 'rating',
            component: {
                type: 'rating',
                props: {
                    ...componentProps,
                    readonly: true,
                },
            },
        },
        filter: {
            enabled: true,
            control: 'number',
            operators: ['eq', 'gt', 'gte', 'lt', 'lte', 'between'],
            defaultOperator: 'eq',
        },
        detail: {
            enabled: true,
            renderer: 'rating',
            component: {
                type: 'rating',
                props: {
                    ...componentProps,
                    readonly: true,
                },
            },
        },
        editor: {
            enabled: editorEnabled,
            control: 'rating',
            component: {
                type: 'rating',
                props: {
                    ...componentProps,
                    readonly: false,
                },
            },
        },
        settings: {
            max: safeMax,
            starsCount: safeStarsCount,
            showValue: Boolean(showValue),
        },
        capabilities: createDefaultCapabilities(),
        displayOptions: {
            columnRenderers: ['rating', 'text'],
            filterControls: ['number', 'range'],
            editorControls: ['rating', 'number'],
        },
    };
}

function createEnumField({key, label, options, renderer = 'tag'}) {
    const normalizedOptions = normalizeEnumOptions(options);

    return {
        key,
        label,
        dataType: 'enum',
        type: 'enum',
        column: {
            enabled: true,
            visible: true,
            renderer,
            component: renderer === 'tag'
                ? {
                    type: 'tag',
                    props: {
                        size: '1/2',
                        rootClass: 'overflow-hidden wrap-none',
                    },
                }
                : null,
        },
        filter: {
            enabled: true,
            control: 'multi-select',
            operators: ['in', 'eq'],
            defaultOperator: 'in',
            options: normalizedOptions,
        },
        detail: {
            enabled: true,
            renderer,
            component: null,
        },
        editor: {
            enabled: true,
            control: 'select',
            options: normalizedOptions,
            component: {
                type: 'dropdown',
                props: {
                    size: 1,
                    items: normalizedOptions,
                },
            },
        },
        capabilities: createDefaultCapabilities(),
        displayOptions: {
            columnRenderers: ['text', 'tag'],
            filterControls: ['multi-select', 'single-select'],
            editorControls: ['select', 'radio-group'],
        },
    };
}

function createDateField({key, label}) {
    return {
        key,
        label,
        dataType: 'date',
        type: 'date',
        column: {
            enabled: true,
            visible: true,
            renderer: 'date',
        },
        filter: {
            enabled: true,
            control: 'date',
            operators: ['eq', 'gt', 'gte', 'lt', 'lte', 'between'],
            defaultOperator: 'eq',
        },
        detail: {
            enabled: true,
            renderer: 'date',
            component: null,
        },
        editor: {
            enabled: true,
            control: 'date',
            component: {
                type: 'datepicker',
                props: {
                    locale: 'ru-RU',
                    format: 'DD.MM.YYYY',
                },
            },
        },
        capabilities: createDefaultCapabilities(),
        displayOptions: {
            columnRenderers: ['text', 'date', 'relative-date'],
            filterControls: ['date', 'date-range'],
            editorControls: ['date', 'date-range'],
        },
    };
}

function createDropDown({
    key,
    label,
    multiple = false,
    props = {},
    source = 'value',
    valueField = 'value',
    displayField = 'label',
}) {
    const editorControl = multiple ? 'entity-multi-picker' : 'entity-picker';

    return {
        key,
        label,
        source,
        valueField,
        displayField,
        dataType: 'entity',
        type: 'entity',
        column: props.column ||  {
            enabled: true,
            visible: true,
            renderer: 'text',
            displayField,
        },
        filter: props.filter || {
            enabled: true,
            control: 'text',
            operators: ['contains', 'eq', 'startsWith'],
            defaultOperator: 'contains',
        },
        detail: props.detail || {
            enabled: true,
            renderer: 'text',
            component: null,
        },
        editor: {
            enabled: true,
            control: editorControl,
            optionType: 'text',
            optionsSource: {
                type: 'endpoint',
                url: `/api/users/filter-options/${key}`,
            },
            component: {
                type: 'dropdown',
                props: {
                    size: 1,
                    searchable: true,
                    placeholder: `label`,
                    searchPlaceholder: `Поиск`,
                    multiple,
                },
            },
        },
        capabilities: createDefaultCapabilities(),
        displayOptions: {
            columnRenderers: ['text'],
            filterControls: ['entity-multi-select', 'entity-single-select'],
            editorControls: ['entity-picker', 'entity-multi-picker', 'select'],
        },
    };
}

function createUserEntityField({key, label, multiple = false}) {
    const control = multiple ? 'entity-multi-select' : 'entity-single-select';
    const editorControl = multiple ? 'entity-multi-picker' : 'entity-picker';

    return {
        key,
        label,
        source: 'id',
        dataType: 'entity',
        type: multiple ? 'users' : 'user',
        multiple,
        column: {
            enabled: true,
            visible: true,
            renderer: multiple ? 'avatar-stack' : 'avatar-label',
            component: {
                type: multiple ? 'avatars' : 'avatar',
                props: multiple
                    ? {
                        templateName: 'group',
                        max: 4,
                    }
                    : {
                        template: 'label',
                        size: 1,
                        noWrap: true,
                        inactive: true,
                    },
            },
        },
        filter: {
            enabled: true,
            control,
            searchable: true,
            searchKeys: ['title'],
            operators: ['in'],
            defaultOperator: 'in',
            options: getUsers(),
            optionsSource: {
                type: 'endpoint',
                url: `/api/users/filter-options/${key}`,
            },
            optionRenderer: 'avatar-checkbox',
            optionComponent: {
                type: 'avatar',
                propsMap: {
                    title: 'title',
                    imageUrl: 'imageUrl',
                },
            },
        },
        detail: {
            enabled: true,
            renderer: multiple ? 'avatar-stack' : 'avatar-label',
            component: {
                type: multiple ? 'avatars' : 'avatar',
                props: multiple
                    ? {
                        templateName: 'group',
                        max: 4,
                    }
                    : {
                        template: 'label',
                        size: 1,
                    },
            },
        },
        editor: {
            enabled: true,
            control: editorControl,
            optionType: 'avatar',
            optionsSource: {
                type: 'endpoint',
                url: `/api/users/filter-options/${key}`,
            },
            component: {
                type: 'dropdown',
                props: {
                    size: 1,
                    mode: 'tag',
                    searchable: true,
                    placeholder: label,
                    searchPlaceholder: `Поиск`,
                    multiple,
                },
            },
        },
        capabilities: createDefaultCapabilities(),
        displayOptions: {
            columnRenderers: ['text', 'avatar-label', 'avatar-only', 'avatar-stack'],
            filterControls: ['entity-multi-select', 'entity-single-select'],
            editorControls: ['entity-picker', 'entity-multi-picker', 'select'],
        },
    };
}

function createDefaultCapabilities() {
    return {
        editableDisplay: true,
        editableFilter: true,
        sortable: true,
        hideable: true,
    };
}

function createTaskRow(index) {
    const creator = getRandomUser();
    const responsible = getRandomUser();
    const observers = getRandomUsers(1, 6, [creator.id, responsible.id]);
    const status = faker.helpers.arrayElement(taskStatuses);
    const priority = faker.helpers.arrayElement(taskPriorities);
    const progress = randomInt(0, 100);

    const createdAt = faker.date.past({years: 1});
    const updatedAt = faker.date.between({from: createdAt, to: new Date()});
    const deadline = faker.date.future({years: 1, refDate: createdAt});

    return {
        id: index + 1,
        title: `Задача #${index + 1}: ${faker.word.words({count: {min: 3, max: 7}})}`,
        project: makeProjectCell(faker.helpers.arrayElement(projects)),
        status: createEnumCell(getTaskField('status'), status.id),
        priority: createEnumCell(getTaskField('priority'), priority.id),
        progress: createProgressCell(progress),
        creator: makeUserCell(creator),
        responsible: makeUserCell(responsible),
        observers: {
            value: observers.map((user) => user.id),
            items: observers.map(makeUserCell),
        },
        deadline: formatIsoDate(deadline),
        createdAt: formatIsoDate(createdAt),
        updatedAt: formatIsoDate(updatedAt),
        comment: createTaskComment(),
    };
}

function createTaskComment() {
    if (faker.datatype.boolean({probability: 0.4})) {
        return '';
    }

    return faker.lorem.paragraphs({min: 2, max: 3}, '\n');
}

function makeUserCell(user) {
    const avatar = normalizeAvatarValue(user.avatar);

    return {
        id: user.id,
        name: user.fullName,
        title: user.fullName,
        imageUrl: avatar,
        detailEntity: 'user',
        entity: 'user',
    };
}

function isSameEntityCell(cell, entity, item) {
    if (!cell || typeof cell !== 'object' || !entity || !item?.id) {
        return false;
    }

    const cellEntity = cell.entity || cell.detailEntity;

    return String(cellEntity || '') === String(entity) &&
        String(cell.id ?? cell.value) === String(item.id);
}

function createEntityCell(entity, item) {
    if (entity === 'user') {
        return makeUserCell(item);
    }

    return item;
}

function patchTaskCellForUpdatedEntity(cell, entity, item) {
    if (!cell || typeof cell !== 'object') {
        return {
            changed: false,
            value: cell,
        };
    }

    if (isSameEntityCell(cell, entity, item)) {
        return {
            changed: true,
            value: createEntityCell(entity, item),
        };
    }

    if (!Array.isArray(cell.items)) {
        return {
            changed: false,
            value: cell,
        };
    }

    let changed = false;
    const items = cell.items.map((entry) => {
        if (!isSameEntityCell(entry, entity, item)) {
            return entry;
        }

        changed = true;
        return createEntityCell(entity, item);
    });

    if (!changed) {
        return {
            changed: false,
            value: cell,
        };
    }

    const {component, ...cellData} = cell;

    return {
        changed: true,
        value: {
            ...cellData,
            items,
        },
    };
}

function patchTaskRowsForUpdatedEntity(entity, item) {
    const affectedRows = [];

    taskRows = taskRows.map((row) => {
        let changed = false;
        const nextRow = Object.fromEntries(
            Object.entries(row).map(([key, value]) => {
                const result = patchTaskCellForUpdatedEntity(value, entity, item);

                if (result.changed) {
                    changed = true;
                }

                return [key, result.value];
            }),
        );

        if (changed) {
            affectedRows.push(nextRow);
            return nextRow;
        }

        return row;
    });

    return affectedRows;
}

function getRandomUser() {
    return users[randomInt(0, users.length - 1)];
}

function getRandomUsers(min = 1, max = 4, excludeIds = []) {
    const availableUsers = users.filter((user) => !excludeIds.includes(user.id));
    const count = Math.min(randomInt(min, max), availableUsers.length);

    return faker.helpers.arrayElements(availableUsers, count);
}

function getUsers() {
    return users.map((user) => ({
        id: user.id,
        value: user.id,
        title: user.fullName,
        label: user.fullName,
        imageUrl: normalizeAvatarValue(user.avatar),
        size: 1,
    }));
}

function getProjectLabel(project) {
    if (project && typeof project === 'object') {
        return project.label || project.title || project.name || project.value || project.id || '';
    }

    return project || '';
}

function normalizeProject(project, index = 0) {
    if (project && typeof project === 'object') {
        const id = project.id ?? project.value ?? index + 1;
        const name = getProjectLabel(project) || `Project ${id}`;
        const {component, ...projectData} = project;

        return {
            ...projectData,
            id,
            value: id,
            title: project.title || project.label || project.name || name,
            label: project.label || project.title || project.name || name,
            name: project.name || project.title || project.label || name,
        };
    }

    const id = index + 1;
    const name = String(project || `Project ${id}`);

    return {
        id,
        value: id,
        title: name,
        label: name,
        name,
    };
}

function findProjectById(id) {
    return projects.find((project) => String(project.id) === String(id) || String(project.value) === String(id)) || null;
}

function makeProjectCell(project) {
    const normalizedProject = normalizeProject(project);

    return {
        id: normalizedProject.id,
        value: normalizedProject.value,
        title: normalizedProject.title,
        label: normalizedProject.label,
        name: normalizedProject.name,
    };
}

function normalizeUserCell(cell) {
    if (!cell || typeof cell !== 'object') {
        return cell;
    }

    const userId = cell.id ?? cell.value;
    const user = findUserById(userId);

    return makeUserCell(user || {
        id: userId,
        fullName: cell.fullName || cell.name || cell.title || cell.label || '',
        avatar: cell.avatar || cell.imageUrl || cell.avatarImageUrl || '',
    });
}

function normalizeUsersCell(cell) {
    if (!cell || typeof cell !== 'object') {
        return cell;
    }

    const ids = Array.isArray(cell.value)
        ? cell.value
        : Array.isArray(cell.values)
            ? cell.values
            : Array.isArray(cell.items)
                ? cell.items.map((item) => item.id ?? item.value).filter(Boolean)
                : [];
    const selectedUsers = ids
        .map((id) => {
            const user = findUserById(id);
            const fallback = Array.isArray(cell.items)
                ? cell.items.find((item) => String(item.id ?? item.value) === String(id))
                : null;

            return user || (fallback
                ? {
                    id,
                    fullName: fallback.fullName || fallback.name || fallback.title || fallback.label || '',
                    avatar: fallback.avatar || fallback.imageUrl || fallback.avatarImageUrl || '',
                }
                : null);
        })
        .filter(Boolean);

    return createAvatarsCell(selectedUsers);
}

function getPersistedStoreData(tableKey) {
    return {
        templates: templateData || {},
        tableSettings: (tableKey ? getTableSettings(tableKey) : tableSettingsData) || {},
        viewSettings: (tableKey ? getViewSettings(tableKey) : viewSettingsData) || {},
        mockData: storeData.mockData || {},
    };
}

function getStoreData(tableKey) {
    return {
        ...getPersistedStoreData(tableKey),
        templates: Object.values(templateData || {}),
        fieldTypes: fieldTypeRegistry,
    };
}

async function writeStoreData() {
    await fs.writeFile(
        DATA_FILE,
        JSON.stringify(getPersistedStoreData(), null, 2),
        'utf8',
    );
}

async function ensureMockData() {
    const mockData = storeData.mockData && typeof storeData.mockData === 'object'
        ? storeData.mockData
        : {};
    const hasUsers = Array.isArray(mockData.users) && mockData.users.length > 0;
    const hasProjects = Array.isArray(mockData.projects) && mockData.projects.length > 0;
    const hasTasks = Array.isArray(mockData.tasks) && mockData.tasks.length > 0;
    let dataChanged = false;

    if (hasUsers) {
        const normalizedUsers = await Promise.all(mockData.users.map(async (user) => ({
            ...user,
            phone: normalizePhoneValue(user.phone),
            avatar: await normalizeStoredAvatarAsset(user.avatar),
        })));
        dataChanged = dataChanged ||
            JSON.stringify(normalizedUsers) !== JSON.stringify(mockData.users);
        users = normalizedUsers;
        mockData.users = users;
    } else {
        users = await Promise.all(users.map(async (user) => ({
            ...user,
            phone: normalizePhoneValue(user.phone),
            avatar: await ensureLocalAvatarAsset(user),
        })));
        mockData.users = users;
    }

    if (hasProjects) {
        const normalizedProjects = mockData.projects.map((project, index) => normalizeProject(project, index));
        dataChanged = dataChanged ||
            JSON.stringify(normalizedProjects) !== JSON.stringify(mockData.projects);
        projects = normalizedProjects;
        mockData.projects = projects;
    } else {
        mockData.projects = projects;
    }

    if (hasTasks) {
        const normalizedTasks = mockData.tasks.map((task) => ({
            ...task,
            project: makeProjectCell(
                findProjectById(normalizeItemValue(task.project, getTaskField('project'))) || task.project,
            ),
            status: createEnumCell(getTaskField('status'), normalizeItemValue(task.status, getTaskField('status'))),
            priority: createEnumCell(getTaskField('priority'), normalizeItemValue(task.priority, getTaskField('priority'))),
            progress: createProgressCell(normalizeItemValue(task.progress, getTaskField('progress'))),
            creator: normalizeUserCell(task.creator),
            responsible: normalizeUserCell(task.responsible),
            observers: normalizeUsersCell(task.observers),
        }));
        dataChanged = dataChanged ||
            JSON.stringify(normalizedTasks) !== JSON.stringify(mockData.tasks);
        taskRows = normalizedTasks;
        mockData.tasks = taskRows;
    } else {
        taskRows = Array.from(
            {length: MOCK_TASKS_COUNT},
            (_, index) => createTaskRow(index),
        );
        mockData.tasks = taskRows;
    }

    storeData.mockData = mockData;

    if (!hasUsers || !hasProjects || !hasTasks || dataChanged) {
        await writeStoreData();
    }
}

function normalizeTableSettingsId(tableId = DEFAULT_TABLE_ID) {
    const normalized = String(tableId || '').trim();

    return normalized || DEFAULT_TABLE_ID;
}

function normalizeColumnSettings(settings = {}) {
    return settings && typeof settings === 'object' && !Array.isArray(settings)
        ? settings
        : {};
}

function normalizeFieldSettings(settings = {}) {
    return settings && typeof settings === 'object' && !Array.isArray(settings)
        ? settings
        : {};
}

function createDefaultFieldSettings(fields = []) {
    return fields.reduce((settings, field, index) => {
        if (!field?.key) {
            return settings;
        }

        settings[field.key] = {
            visible: field.filter?.enabled !== false,
            order: (index + 1) * 10,
            control: field.filter?.control || field.type || field.dataType || 'text',
        };

        return settings;
    }, {});
}

function createDefaultDetailFieldSettings(fields = []) {
    return fields.reduce((settings, field, index) => {
        if (!field?.key) {
            return settings;
        }

        settings[field.key] = {
            visible: field.detail?.enabled !== false,
            order: (index + 1) * 10,
            type: field.type || field.dataType || 'string',
            renderer:
                field.detail?.renderer ||
                field.column?.renderer ||
                field.type ||
                field.dataType ||
                'text',
            component: field.detail?.component || null,
        };

        return settings;
    }, {});
}

function createDefaultEditorFieldSettings(fields = []) {
    return fields.reduce((settings, field, index) => {
        if (!field?.key) {
            return settings;
        }

        settings[field.key] = {
            visible: field.editor?.enabled !== false,
            enabled: field.editor?.enabled !== false,
            order: (index + 1) * 10,
            type: field.type || field.dataType || 'string',
            control:
                field.editor?.control ||
                field.filter?.control ||
                field.type ||
                field.dataType ||
                'text',
            component: field.editor?.component || null,
        };

        return settings;
    }, {});
}

function mergeFieldSettings(defaultSettings = {}, customSettings = {}) {
    const nextSettings = {...defaultSettings};

    Object.entries(customSettings || {}).forEach(([key, settings]) => {
        nextSettings[key] = {
            ...(nextSettings[key] || {}),
            ...(settings || {}),
        };
    });

    return nextSettings;
}

function normalizeTableSettings(tableId, settings = {}) {
    const key = normalizeTableSettingsId(tableId);
    const source = settings && typeof settings === 'object' ? settings : {};
    const columnSettings = normalizeColumnSettings(
        source.columnSettings || source.columns || source,
    );

    return {
        key,
        columnSettings,
        updatedAt: source.updatedAt || new Date().toISOString(),
    };
}

function getTableSettings(tableId = DEFAULT_TABLE_ID) {
    const key = normalizeTableSettingsId(tableId);
    const settings = tableSettingsData?.[key];

    return settings && typeof settings === 'object'
        ? settings
        : {
            key,
            columnSettings: {},
        };
}

function normalizeViewSettings(tableId, settings = {}) {
    const key = normalizeTableSettingsId(tableId);
    const source = settings?.viewSettings || settings?.item || settings || {};
    const tableSource = source.table || {};
    const detailSource = source.detail || {};
    const filterSource = source.filter || {};
    const editorSource = source.editor || {};
    const defaultFilterFields = createDefaultFieldSettings(getTaskFilterFields());
    const defaultDetailFields = createDefaultDetailFieldSettings(getTaskDetailFields());
    const defaultEditorFields = createDefaultEditorFieldSettings(getTaskDetailFields());
    const legacyColumns =
        tableSource.columns ||
        source.columnSettings ||
        source.columns ||
        settings.columnSettings ||
        settings.columns ||
        {};

    return {
        key,
        table: {
            ...(tableSource || {}),
            columns: normalizeColumnSettings(legacyColumns),
        },
        detail: {
            ...(detailSource || {}),
            fields: mergeFieldSettings(
                defaultDetailFields,
                normalizeFieldSettings(detailSource.fields),
            ),
        },
        filter: {
            ...(filterSource || {}),
            fields: mergeFieldSettings(
                defaultFilterFields,
                normalizeFieldSettings(filterSource.fields),
            ),
        },
        editor: {
            ...(editorSource || {}),
            fields: mergeFieldSettings(
                defaultEditorFields,
                normalizeFieldSettings(editorSource.fields),
            ),
        },
        updatedAt: source.updatedAt || settings.updatedAt || new Date().toISOString(),
    };
}

function migrateViewSettings(viewSettings = {}, tableSettings = {}) {
    const nextViewSettings =
        viewSettings && typeof viewSettings === 'object' && !Array.isArray(viewSettings)
            ? {...viewSettings}
            : {};

    Object.entries(tableSettings || {}).forEach(([key, value]) => {
        if (nextViewSettings[key]) {
            return;
        }

        nextViewSettings[key] = normalizeViewSettings(key, {
            columnSettings: value?.columnSettings || value?.columns || {},
        });
    });

    return nextViewSettings;
}

function getViewSettings(tableId = DEFAULT_TABLE_ID) {
    const key = normalizeTableSettingsId(tableId);
    const settings = viewSettingsData?.[key];

    return settings && typeof settings === 'object'
        ? normalizeViewSettings(key, settings)
        : normalizeViewSettings(key, {});
}

function setViewSettings(tableId, settings = {}) {
    const normalized = normalizeViewSettings(tableId, settings);
    normalized.updatedAt = new Date().toISOString();

    viewSettingsData = {
        ...(viewSettingsData || {}),
        [normalized.key]: normalized,
    };

    tableSettingsData = {
        ...(tableSettingsData || {}),
        [normalized.key]: {
            key: normalized.key,
            columnSettings: normalized.table.columns,
            updatedAt: normalized.updatedAt,
        },
    };

    return normalized;
}

function normalizeFilterTemplate(template = {}) {
    const key = template.key || `filter_template_${Date.now()}`;
    const data = template.data && typeof template.data === 'object'
        ? template.data
        : {};

    return {
        ...template,
        key,
        data: {
            ...data,
            values: {
                ...(data.values || {}),
            },
            tags: {
                ...(data.tags || {}),
            },
        },
    };
}

function applyFilter(data, field, operator, values) {
    const arr = normalizeValues(values);
    const fieldSettings = getTaskFilterFields().find((item) => item.key === field);

    return data.filter((item) => {
        const itemValue = normalizeItemValue(item[field], fieldSettings);
        const comparableValues = getComparableItemValues(item[field], fieldSettings);

        switch (operator) {
            case 'in':
                if (Array.isArray(itemValue)) {
                    return itemValue.some((value) => arr.map(String).includes(String(value)));
                }

                return comparableValues.some((value) => arr.map(String).includes(String(value)));

            case 'eq':
                return comparableValues.some((value) => String(value) === String(arr[0]));

            case 'contains':
                return String(normalizeItemDisplayValue(item[field], fieldSettings))
                    .toLowerCase()
                    .includes(String(arr[0]).toLowerCase());

            case 'startsWith':
                return String(normalizeItemDisplayValue(item[field], fieldSettings))
                    .toLowerCase()
                    .startsWith(String(arr[0]).toLowerCase());

            case 'gt':
                return compareValue(itemValue, arr[0], fieldSettings) > 0;

            case 'gte':
                return compareValue(itemValue, arr[0], fieldSettings) >= 0;

            case 'lt':
                return compareValue(itemValue, arr[0], fieldSettings) < 0;

            case 'lte':
                return compareValue(itemValue, arr[0], fieldSettings) <= 0;

            case 'between': {
                const [min, max] = arr;

                return compareValue(itemValue, min, fieldSettings) >= 0 &&
                    compareValue(itemValue, max, fieldSettings) <= 0;
            }

            case 'any':
                return true;

            default:
                return true;
        }
    });
}

function getComparableItemValues(rawValue, fieldSettings) {
    const values = normalizeValues(normalizeItemValue(rawValue, fieldSettings));

    if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
        [rawValue.id, rawValue.value, rawValue.code].forEach((value) => {
            if (value !== null && typeof value !== 'undefined' && value !== '') {
                values.push(value);
            }
        });
    }

    return [...new Set(values.map((value) => String(value)))];
}

function normalizeItemValue(rawValue, fieldSettings) {
    if (rawValue === null || rawValue === undefined) {
        return '';
    }

    if (Array.isArray(rawValue)) {
        return rawValue.map((item) => normalizeItemValue(item, fieldSettings));
    }

    if (typeof rawValue !== 'object') {
        return rawValue;
    }

    if (Array.isArray(rawValue.value)) {
        return rawValue.value;
    }

    if (rawValue.value !== undefined) {
        return rawValue.value;
    }

    if (fieldSettings?.source && rawValue[fieldSettings.source] !== undefined) {
        return rawValue[fieldSettings.source];
    }

    if (rawValue.id !== undefined) {
        return rawValue.id;
    }

    if (rawValue.name !== undefined) {
        return rawValue.name;
    }

    if (rawValue.title !== undefined) {
        return rawValue.title;
    }

    return String(rawValue);
}

function normalizeDateValue(value) {
    if (value === null || typeof value === 'undefined' || value === '') {
        return '';
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return formatIsoDate(value);
    }

    const source = value && typeof value === 'object' && !Array.isArray(value)
        ? value.value || value.displayValue || value.date || value.formattedValue || ''
        : value;
    const stringValue = String(source || '').trim();
    const isoMatch = stringValue.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (isoMatch) {
        return `${isoMatch[3]}.${isoMatch[2]}.${isoMatch[1]}`;
    }

    return stringValue;
}

function normalizeItemDisplayValue(rawValue, fieldSettings) {
    if (rawValue === null || rawValue === undefined) {
        return '';
    }

    if (Array.isArray(rawValue)) {
        return rawValue.map((item) => normalizeItemDisplayValue(item, fieldSettings)).join(' ');
    }

    if (typeof rawValue !== 'object') {
        return rawValue;
    }

    return rawValue.label ||
        rawValue.title ||
        rawValue.name ||
        rawValue.fullName ||
        normalizeItemValue(rawValue, fieldSettings);
}

function normalizeValues(values) {
    if (values === undefined || values === null) {
        return [];
    }

    return Array.isArray(values) ? values : [values];
}

function compareValue(left, right, fieldSettings) {
    if (fieldSettings?.filter?.control === 'date' || fieldSettings?.dataType === 'date') {
        return new Date(left).getTime() - new Date(right).getTime();
    }

    return Number(left) - Number(right);
}

async function fileExists(path) {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
}

function getAvatarAssetBaseName(userOrId) {
    const id = typeof userOrId === 'object'
        ? userOrId?.id
        : userOrId;
    const normalizedId = Number(id);

    return Number.isFinite(normalizedId) && normalizedId > 0
        ? `user-${normalizedId}`
        : `user-${String(id || 'unknown').replace(/[^\w-]/g, '-')}`;
}

function getLocalAvatarUrl(userOrId, extension = 'jpg') {
    return `${AVATAR_PUBLIC_BASE}/${getAvatarAssetBaseName(userOrId)}.${extension}`;
}

function getMimeTypeByExtension(extension = '') {
    const normalized = String(extension || '').toLowerCase();
    const map = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
    };

    return map[normalized] || 'application/octet-stream';
}

function formatFileSize(bytes = 0) {
    const size = Number(bytes) || 0;

    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${Math.round(size / 1024)} KB`;
    }

    return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function getFileNameFromUrl(url = '') {
    return decodeURIComponent(String(url || '').split('/').pop() || '');
}

function getAvatarLocalPathFromUrl(url = '') {
    const source = String(url || '');

    if (!source.startsWith(AVATAR_PUBLIC_BASE)) {
        return '';
    }

    return `${AVATAR_DIR}/${source.slice(AVATAR_PUBLIC_BASE.length + 1)}`;
}

async function createAvatarFileValue(url = '', options = {}) {
    if (!url) {
        return '';
    }

    const fileName = options.fileName || getFileNameFromUrl(url);
    const extension = String(fileName).split('.').pop() || '';
    let size = Number(options.size) || 0;

    if (!size) {
        const localPath = getAvatarLocalPathFromUrl(url);

        if (localPath) {
            try {
                const stat = await fs.stat(localPath);
                size = stat.size;
            } catch {
                size = 0;
            }
        }
    }

    return {
        type: 'file',
        value: url,
        url,
        displayValue: url,
        name: fileName,
        fileName,
        fileSize: formatFileSize(size),
        size,
        mimeType: options.mimeType || getMimeTypeByExtension(extension),
    };
}

function getFileExtension(file = {}) {
    const name = file.originalName || file.name || '';
    const fromName = String(name).split('.').pop();

    if (fromName && fromName !== name) {
        return fromName.toLowerCase().replace(/[^\w]/g, '') || 'bin';
    }

    const type = String(file.mimeType || file.type || '');
    const fromType = type.split('/').pop();

    return (fromType || 'bin').toLowerCase().replace(/[^\w]/g, '') || 'bin';
}

function isLocalAvatarUrl(value) {
    return String(value || '').includes('/assets/avatars/');
}

function getAvatarInitials(user = {}) {
    const source = getUserFullName(user) || user.name || user.title || '';
    const initials = source
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();

    return initials || String(user.id || '?').slice(0, 2);
}

function createAvatarFallbackSvg(user = {}) {
    const colors = ['#2563eb', '#059669', '#7c3aed', '#dc2626', '#ca8a04', '#0891b2'];
    const color = colors[(Number(user.id) || 0) % colors.length];
    const initials = getAvatarInitials(user)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="150" fill="${color}"/><text x="50%" y="50%" fill="#fff" font-family="Arial, sans-serif" font-size="88" font-weight="700" text-anchor="middle" dominant-baseline="central">${initials}</text></svg>`;
}

async function ensureLocalAvatarAsset(user = {}) {
    await fs.mkdir(AVATAR_DIR, {recursive: true});

    const baseName = getAvatarAssetBaseName(user);
    const jpgPath = `${AVATAR_DIR}/${baseName}.jpg`;
    const svgPath = `${AVATAR_DIR}/${baseName}.svg`;

    if (await fileExists(jpgPath)) {
        return createAvatarFileValue(getLocalAvatarUrl(user, 'jpg'), {
            fileName: `${baseName}.jpg`,
            mimeType: 'image/jpeg',
        });
    }

    if (await fileExists(svgPath)) {
        return createAvatarFileValue(getLocalAvatarUrl(user, 'svg'), {
            fileName: `${baseName}.svg`,
            mimeType: 'image/svg+xml',
        });
    }

    const currentAvatar = normalizeAvatarValue(user.avatar);
    const sourceUrl = currentAvatar && !isLocalAvatarUrl(currentAvatar)
        ? currentAvatar
        : `https://i.pravatar.cc/300?img=${Number(user.id) || 1}`;

    if (sourceUrl) {
        try {
            const response = await fetch(sourceUrl);

            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                await fs.writeFile(jpgPath, Buffer.from(arrayBuffer));

                return createAvatarFileValue(getLocalAvatarUrl(user, 'jpg'), {
                    fileName: `${baseName}.jpg`,
                    size: Buffer.from(arrayBuffer).length,
                    mimeType: response.headers.get('content-type') || 'image/jpeg',
                });
            }
        } catch {
            // Fallback below keeps mock avatars local even without network.
        }
    }

    await fs.writeFile(svgPath, createAvatarFallbackSvg(user), 'utf8');

    return createAvatarFileValue(getLocalAvatarUrl(user, 'svg'), {
        fileName: `${baseName}.svg`,
        mimeType: 'image/svg+xml',
    });
}

async function normalizeUserAvatarAsset(user = {}) {
    const avatar = await ensureLocalAvatarAsset(user);

    return {
        ...user,
        avatar,
    };
}

async function normalizeStoredAvatarAsset(value) {
    const url = normalizeAvatarValue(value);

    if (!url) {
        return '';
    }

    const normalizedFile = await createAvatarFileValue(url);

    if (value && typeof value === 'object' && !Array.isArray(value)) {
        const {component, ...fileData} = value;

        return {
            ...normalizedFile,
            ...fileData,
            type: 'file',
            value: url,
            url,
            displayValue: value.displayValue || url,
            name: value.name || value.fileName || normalizedFile.name,
            fileName: value.fileName || value.name || normalizedFile.fileName,
            fileSize: value.fileSize || normalizedFile.fileSize,
            size: value.size || normalizedFile.size,
            mimeType: value.mimeType || normalizedFile.mimeType,
        };
    }

    return normalizedFile;
}

function parseMultipartHeaders(rawHeaders = '') {
    return rawHeaders.split('\r\n').reduce((headers, line) => {
        const separatorIndex = line.indexOf(':');

        if (separatorIndex < 0) {
            return headers;
        }

        headers[line.slice(0, separatorIndex).trim().toLowerCase()] = line
            .slice(separatorIndex + 1)
            .trim();

        return headers;
    }, {});
}

function parseContentDisposition(value = '') {
    return value.split(';').reduce((result, part) => {
        const [rawKey, ...rawValue] = part.trim().split('=');
        const key = rawKey.trim();

        if (!rawValue.length) {
            return result;
        }

        result[key] = rawValue.join('=').trim().replace(/^"|"$/g, '');

        return result;
    }, {});
}

async function readRequestBuffer(req) {
    const chunks = [];

    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
}

async function parseMultipartRequest(req) {
    const contentType = req.headers['content-type'] || '';
    const boundary = String(contentType).match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[1]
        || String(contentType).match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[2];

    if (!boundary) {
        return {
            fields: {},
            files: [],
        };
    }

    const body = await readRequestBuffer(req);
    const delimiter = Buffer.from(`--${boundary}`);
    const fields = {};
    const files = [];
    let cursor = 0;

    while (cursor < body.length) {
        const boundaryIndex = body.indexOf(delimiter, cursor);

        if (boundaryIndex < 0) {
            break;
        }

        const nextStart = boundaryIndex + delimiter.length;

        if (body.slice(nextStart, nextStart + 2).toString() === '--') {
            break;
        }

        const partStart = nextStart + 2;
        const nextBoundaryIndex = body.indexOf(delimiter, partStart);

        if (nextBoundaryIndex < 0) {
            break;
        }

        const part = body.slice(partStart, Math.max(partStart, nextBoundaryIndex - 2));
        const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));

        if (headerEnd >= 0) {
            const headers = parseMultipartHeaders(part.slice(0, headerEnd).toString('utf8'));
            const content = part.slice(headerEnd + 4);
            const disposition = parseContentDisposition(headers['content-disposition'] || '');
            const name = disposition.name || '';
            const filename = disposition.filename || '';

            if (filename) {
                files.push({
                    fieldName: name,
                    originalName: filename,
                    mimeType: headers['content-type'] || 'application/octet-stream',
                    buffer: content,
                });
            } else if (name) {
                fields[name] = content.toString('utf8');
            }
        }

        cursor = nextBoundaryIndex;
    }

    return {
        fields,
        files,
    };
}

function getUploadedFileForField(files = [], fieldKey = '') {
    return files.find((file) =>
        file.fieldName === `files.values.${fieldKey}.file` ||
        file.fieldName.includes(`values.${fieldKey}.file`),
    ) || null;
}

function getUploadedFileUrl(entity, entityId, fieldKey, extension) {
    const safeEntity = String(entity || 'entity').replace(/[^\w-]/g, '-');
    const safeId = String(entityId || 'unknown').replace(/[^\w-]/g, '-');
    const safeField = String(fieldKey || 'file').replace(/[^\w-]/g, '-');

    return `${UPLOAD_PUBLIC_BASE}/${safeEntity}-${safeId}/${safeField}.${extension}`;
}

async function saveUploadedFieldFile(entity, entityItem = {}, fieldKey = '', file = null) {
    if (!file?.buffer) {
        return normalizeAvatarValue(entityItem?.[fieldKey]);
    }

    const extension = getFileExtension(file);

    if (entity === 'user' && fieldKey === 'avatar') {
        await fs.mkdir(AVATAR_DIR, {recursive: true});

        const filePath = `${AVATAR_DIR}/${getAvatarAssetBaseName(entityItem)}.${extension}`;

        await fs.writeFile(filePath, file.buffer);

        return createAvatarFileValue(getLocalAvatarUrl(entityItem, extension), {
            fileName: `${getAvatarAssetBaseName(entityItem)}.${extension}`,
            size: file.buffer.length,
            mimeType: file.mimeType || file.type || getMimeTypeByExtension(extension),
        });
    }

    const safeEntity = String(entity || 'entity').replace(/[^\w-]/g, '-');
    const safeId = String(entityItem?.id || entityItem?.value || 'unknown').replace(/[^\w-]/g, '-');
    const safeField = String(fieldKey || 'file').replace(/[^\w-]/g, '-');
    const targetDir = `${UPLOAD_DIR}/${safeEntity}-${safeId}`;
    const filePath = `${targetDir}/${safeField}.${extension}`;

    await fs.mkdir(targetDir, {recursive: true});

    await fs.writeFile(filePath, file.buffer);

    return getUploadedFileUrl(safeEntity, safeId, safeField, extension);
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function padDatePart(value) {
    return String(value).padStart(2, '0');
}

function formatIsoDate(date) {
    return `${padDatePart(date.getDate())}.${padDatePart(date.getMonth() + 1)}.${date.getFullYear()}`;
}

await ensureMockData();

function parsePositiveInt(value, fallback) {
    const number = Number(value);

    if (!Number.isFinite(number) || number <= 0) {
        return fallback;
    }

    return Math.floor(number);
}

function sortRows(rows, sortKey, sortDirection = 'asc') {
    if (!sortKey) {
        return rows;
    }

    const fieldSettings = getTaskFilterFields().find((item) => item.key === sortKey);
    const direction = sortDirection === 'desc' ? -1 : 1;

    return [...rows].sort((a, b) => {
        const left = normalizeItemValue(a[sortKey], fieldSettings);
        const right = normalizeItemValue(b[sortKey], fieldSettings);

        if (fieldSettings?.dataType === 'date') {
            return (new Date(left).getTime() - new Date(right).getTime()) * direction;
        }

        if (fieldSettings?.dataType === 'integer') {
            return (Number(left) - Number(right)) * direction;
        }

        return String(left).localeCompare(String(right), 'ru') * direction;
    });
}

app.post('/api/template/save', async (req, res) => {
    const body = req.body || {};
    const templateList = Array.isArray(body)
        ? body
        : Array.isArray(body.items)
            ? body.items
            : Array.isArray(body.templates)
                ? body.templates
                : [body];

    const normalizedTemplates = templateList
        .filter((template) => template && typeof template === 'object')
        .map((template) => normalizeFilterTemplate(template));

    templateData = {
        ...(templateData || {}),
    };

    normalizedTemplates.forEach((template) => {
        templateData[template.key] = template;
    });

    for (const [key, data] of Object.entries(templateData)) {
        if (data.deleted) {
            delete templateData[key];
        }
    }

    try {
        await writeStoreData();

        res.json({
            success: true,
            item: normalizedTemplates[0] || null,
            saved: normalizedTemplates,
            items: templateData,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
        });
    }
});

app.get('/api/users/filter-options/:field', (req, res) => {
    switch (req.params.field) {
        case 'creator':
        case 'responsible':
        case 'observers':
        case 'author':
            res.json({items: getUsers()});
            break;
        case 'project':
            res.json({items: projects});
            break;
        default:
            res.json({items: []});
    }
});

app.get('/api/tasks/filter-options/:field', (req, res) => {
    switch (req.params.field) {
        case 'creator':
        case 'responsible':
        case 'observers':
            res.json({items: getUsers()});
            break;

        case 'project':
            res.json({items: projects});
            break;
        case 'status':
            res.json({items: normalizeEnumOptions(taskStatuses)});
            break;

        case 'priority':
            res.json({items: normalizeEnumOptions(taskPriorities)});
            break;

        default:
            res.json({items: []});
    }
});

app.get('/api/settings/get', (req, res) => {
    const data = getStoreData(req.query.tableId);
    res.json({...data});
});

app.get('/api/field-types', (req, res) => {
    res.json({
        items: fieldTypeRegistry,
    });
});

app.post('/api/:entity/fields', async (req, res) => {
    const entity = normalizeEntityName(req.params.entity);

    if (!entity) {
        res.status(404).json({
            success: false,
            message: 'Entity not found',
        });
        return;
    }

    try {
        const field = addCustomFieldDefinition(entity, req.body || {});
        await writeStoreData();

        res.json({
            success: true,
            entity,
            item: field,
            fields: getEntityFields(entity),
            columns: entity === 'task' ? getTaskColumns() : undefined,
            fieldTypes: fieldTypeRegistry,
            affectedRows: entity === 'task' ? taskRows : users,
            rows: entity === 'task' ? taskRows : users,
            viewSettings: getViewSettings(req.query.tableId || req.body?.tableSettingsKey || DEFAULT_TABLE_ID),
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Field create failed',
        });
    }
});

app.patch('/api/:entity/fields/:fieldKey', async (req, res) => {
    const entity = normalizeEntityName(req.params.entity);

    if (!entity) {
        res.status(404).json({
            success: false,
            message: 'Entity not found',
        });
        return;
    }

    try {
        const field = updateFieldDefinition(entity, req.params.fieldKey, req.body || {});
        await writeStoreData();

        res.json({
            success: true,
            entity,
            item: field,
            fields: getEntityFields(entity),
            columns: entity === 'task' ? getTaskColumns() : undefined,
            fieldTypes: fieldTypeRegistry,
            affectedRows: entity === 'task' ? taskRows : users,
            rows: entity === 'task' ? taskRows : users,
            viewSettings: getViewSettings(req.query.tableId || req.body?.tableSettingsKey || DEFAULT_TABLE_ID),
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Field update failed',
        });
    }
});

app.delete('/api/:entity/fields/:fieldKey', async (req, res) => {
    const entity = normalizeEntityName(req.params.entity);

    if (!entity) {
        res.status(404).json({
            success: false,
            message: 'Entity not found',
        });
        return;
    }

    try {
        const field = removeCustomFieldDefinition(entity, req.params.fieldKey);
        await writeStoreData();

        res.json({
            success: true,
            entity,
            item: entity === 'user'
                ? users.find((user) => String(user.id) === String(req.query.itemId)) || undefined
                : taskRows.find((row) => String(row.id) === String(req.query.itemId)) || undefined,
            removed: field,
            fields: getEntityFields(entity),
            columns: entity === 'task' ? getTaskColumns() : undefined,
            fieldTypes: fieldTypeRegistry,
            affectedRows: entity === 'task' ? taskRows : undefined,
            rows: entity === 'task' ? taskRows : undefined,
            viewSettings: getViewSettings(req.query.tableId || req.body?.tableSettingsKey || DEFAULT_TABLE_ID),
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Field delete failed',
        });
    }
});

app.get('/api/view-settings', (req, res) => {
    res.json({
        item: getViewSettings(DEFAULT_TABLE_ID),
        items: viewSettingsData,
    });
});

app.get('/api/view-settings/:tableId', (req, res) => {
    res.json({
        item: getViewSettings(req.params.tableId),
        items: viewSettingsData,
    });
});

app.post('/api/view-settings/:tableId', async (req, res) => {
    const settings = setViewSettings(req.params.tableId, req.body || {});

    try {
        await writeStoreData();

        res.json({
            success: true,
            item: settings,
            items: viewSettingsData,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
        });
    }
});

app.get('/api/table-settings', (req, res) => {
    res.json({
        item: getTableSettings(DEFAULT_TABLE_ID),
        items: tableSettingsData,
    });
});

app.get('/api/table-settings/:tableId', (req, res) => {
    res.json({
        item: getTableSettings(req.params.tableId),
        items: tableSettingsData,
    });
});

app.post('/api/table-settings', async (req, res) => {
    const viewSettings = setViewSettings(DEFAULT_TABLE_ID, req.body || {});
    const settings = getTableSettings(viewSettings.key);

    try {
        await writeStoreData();

        res.json({
            success: true,
            item: settings,
            items: tableSettingsData,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
        });
    }
});

app.post('/api/table-settings/:tableId', async (req, res) => {
    const viewSettings = setViewSettings(req.params.tableId, req.body || {});
    const settings = getTableSettings(viewSettings.key);

    try {
        await writeStoreData();

        res.json({
            success: true,
            item: settings,
            items: tableSettingsData,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
        });
    }
});

app.get('/api/users/create', userCreateDraftHandler);
app.post('/api/users', userCreateHandler);
app.get('/api/users/:id', userDetailHandler);
app.patch('/api/users/:id', userUpdateHandler);
app.delete('/api/users/:id', userDeleteHandler);
app.get('/api/users', tasksHandler);
app.get('/api/tasks/create', taskCreateDraftHandler);
app.post('/api/tasks', taskCreateHandler);
app.get('/api/tasks/:id', taskDetailHandler);
app.patch('/api/tasks/:id', taskUpdateHandler);
app.delete('/api/tasks/:id', taskDeleteHandler);
app.get('/api/tasks', tasksHandler);

function getEditorInputValue(item = {}, field = {}) {
    if (!field?.key || !item || !Object.prototype.hasOwnProperty.call(item, field.key)) {
        return '';
    }

    const value = item[field.key];

    if (value === null || typeof value === 'undefined') {
        return '';
    }

    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === 'object') {
        if (Object.prototype.hasOwnProperty.call(value, 'value')) {
            return value.value;
        }

        if (Object.prototype.hasOwnProperty.call(value, 'id')) {
            return value.id;
        }

        return value.label || value.title || value.name || '';
    }

    return value;
}

function getPhoneEditorProps(value = {}) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    return {
        value: value.displayValue || value.value || '',
        iso2: value.iso2 || '',
        dialCode: value.dialCode || '',
        maskPattern: value.maskPattern || '',
    };
}

function getFileUploadEditorProps(value) {
    const getUploadSource = (source) => {
        if (!source) {
            return '';
        }

        if (Array.isArray(source)) {
            return source
                .map(getUploadSource)
                .find(Boolean) || '';
        }

        if (typeof source === 'object') {
            return source.displayValue ||
                source.value ||
                source.url ||
                source.imageUrl ||
                source.src ||
                '';
        }

        return String(source);
    };

    const createUploadItem = (src) => ({
        id: src,
        name: String(src).split(/[\\/]/).pop() || String(src),
        fileSize: '',
        progress: 100,
        state: 'done',
        value: src,
    });

    if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (Array.isArray(value.items) && value.items.length) {
            const items = value.items
                .map(getUploadSource)
                .filter(Boolean)
                .map(createUploadItem);

            return items.length ? {items} : {};
        }

        const src = getUploadSource(value);
        return src ? {items: [createUploadItem(src)]} : {};
    }

    if (!value) {
        return {};
    }

    const src = getUploadSource(value);
    return src ? {items: [createUploadItem(src)]} : {};
}

function withEditorInputValues(fields = [], item = {}) {
    return fields.map((field) => {
        const component = field?.editor?.component;
        switch (component?.type) {
            case 'input':
            case 'editor':
                return {
                    ...field,
                    editor: {
                        ...(field.editor || {}),
                        component: {
                            ...component,
                            props: {
                                ...(component.props || {}),
                                defaultValue: getEditorInputValue(item, field),
                            },
                        },
                    },
                };
            case 'datepicker':
                return {
                    ...field,
                    editor: {
                        ...(field.editor || {}),
                        component: {
                            ...component,
                            props: {
                                ...(component.props || {}),
                                date: getEditorInputValue(item, field),
                            },
                        },
                    },
                };
            case 'country-code':
                return {
                    ...field,
                    editor: {
                        ...(field.editor || {}),
                        component: {
                            ...component,
                            props: {
                                ...(component.props || {}),
                                value: getEditorInputValue(item, field),
                                ...getPhoneEditorProps(item[field.key]),
                            },
                        },
                    },
                };
            case 'file-upload':
                return {
                    ...field,
                    editor: {
                        ...(field.editor || {}),
                        component: {
                            ...component,
                            props: {
                                ...(component.props || {}),
                                ...getFileUploadEditorProps(item[field.key]),
                            },
                        },
                    },
                };
            default:
                return field;
        }

    });
}

function getTaskField(fieldKey) {
    return getTaskDetailFields().find((field) => field.key === fieldKey) ||
        getTaskFilterFields().find((field) => field.key === fieldKey);
}

function getEntityField(entity = 'task', fieldKey = '') {
    return entity === 'user'
        ? getUserDetailField(fieldKey)
        : getTaskField(fieldKey);
}

function findUserById(id) {
    return users.find((user) => String(user.id) === String(id)) || null;
}

function getUserFullName(user = {}) {
    return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ') || user.fullName || '';
}

function normalizePhoneRawValue(value) {
    return String(value || '')
        .replace(/[^\d+]/g, '')
        .replace(/(?!^)\+/g, '');
}

function normalizePhoneValue(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        const displayValue = value.displayValue || value.value || '';
        const phoneValue = normalizePhoneRawValue(value.value || displayValue);

        return {
            type: 'phone',
            value: phoneValue,
            displayValue,
            iso2: value.iso2 || '',
            dialCode: value.dialCode || '',
            maskPattern: value.maskPattern || '',
        };
    }

    const displayValue = String(value || '');
    const phoneValue = normalizePhoneRawValue(displayValue);

    return {
        type: 'phone',
        value: phoneValue,
        displayValue,
        iso2: '',
        dialCode: '',
        maskPattern: '',
    };
}

function normalizeAvatarValue(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        const item = Array.isArray(value.items) ? value.items[0] : null;

        return value.value ||
            value.displayValue ||
            value.url ||
            item?.value ||
            item?.url ||
            item?.name ||
            '';
    }

    return String(value || '');
}

function isFileRemoveValue(value) {
    if (!value) {
        return true;
    }

    if (Array.isArray(value)) {
        return value.length === 0 || value.every(isFileRemoveValue);
    }

    if (typeof value !== 'object') {
        return false;
    }

    if (value.action === 'remove') {
        return true;
    }

    const hasItems = Array.isArray(value.items) && value.items.length > 0;
    const src = value.value || value.displayValue || value.url || value.imageUrl || value.src || '';

    return !hasItems && !src;
}

function getUserDetailField(fieldKey) {
    return getUserDetailFields().find((field) => field.key === fieldKey) || null;
}

function createAvatarDetailValue(value, user = {}, field = null) {
    const avatar = normalizeAvatarValue(value);
    const fullName = getUserFullName(user);
    const fileName = avatar.split(/[\\/]/).pop() || avatar;
    const hasAvatar = Boolean(avatar);
    const fileMeta = value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : {};

    if (!hasAvatar) {
        return {
            type: 'avatar',
            title: `${user.firstName} ${user.lastName}`,
        };
    }

    return {
        type: 'file',
        value: avatar,
        url: avatar,
        displayValue: avatar,
        name: fileMeta.name || fileMeta.fileName || fileName,
        fileName: fileMeta.fileName || fileMeta.name || fileName,
        fileSize: fileMeta.fileSize || '',
        size: fileMeta.size || 0,
        mimeType: fileMeta.mimeType || getMimeTypeByExtension(fileName.split('.').pop()),
        title: fullName || fileName,
        imageUrl: avatar,
    };
}

function normalizeUserDetailItem(user = {}) {
    const fullName = getUserFullName(user);
    const avatar = normalizeAvatarValue(user.avatar);
    const avatarField = getUserDetailField('avatar');

    return {
        ...user,
        phone: normalizePhoneValue(user.phone),
        avatar: createAvatarDetailValue(user.avatar, user, avatarField),
        fullName,
        name: fullName,
        title: fullName,
        imageUrl: avatar,
        detailEntity: 'user',
        entity: 'user',
    };
}

function createAvatarsCell(selectedUsers = []) {
    const items = selectedUsers.map(makeUserCell);

    return {
        value: selectedUsers.map((user) => user.id),
        items,
    };
}

function createEnumCell(field = {}, value) {
    const option = (field.filter?.options || field.editor?.options || [])
        .find((item) =>
            String(item.value) === String(value) ||
            String(item.id) === String(value) ||
            String(item.code) === String(value),
        );

    if (!option) {
        return value;
    }

    return {
        id: option.id,
        value: option.value,
        code: option.code,
        title: option.title || option.label || option.value,
        label: option.label || option.title || option.value,
        name: option.name || option.label || option.title || option.value,
        type: option.type || 'default',
    };
}

function createProgressCell(value) {
    const progress = Number(value);
    const safeProgress = Number.isFinite(progress) ? progress : 0;

    return {
        value: safeProgress,
    };
}

function getNextEntityId(items = []) {
    return items.reduce((maxId, item) => {
        const id = Number(item?.id);
        return Number.isFinite(id) ? Math.max(maxId, id) : maxId;
    }, 0) + 1;
}

function getEmptyFieldValue(field = {}) {
    const fieldType = resolveFieldType(field);

    if (typeof field.defaultValue !== 'undefined' && field.defaultValue !== null) {
        return cloneFieldDefaultValue(field.defaultValue);
    }

    if (fieldType === 'steps' || field.dataType === 'steps') {
        return {current: 0};
    }

    if (fieldType === 'checkbox' || field.dataType === 'boolean') {
        return false;
    }

    if (fieldType === 'rating') {
        return 0;
    }

    if (fieldType === 'money') {
        return {
            type: 'money',
            value: '',
            currency: field.settings?.currency || field.schema?.settings?.currency || 'RUB',
        };
    }

    if (fieldType === 'phone' || field.dataType === 'phone') {
        return normalizePhoneValue('');
    }

    return '';
}

function applyEmptyFieldValues(entity = 'task', item = {}) {
    const fields = entity === 'user' ? getUserDetailFields() : getTaskDetailFields();

    return fields.reduce((result, field) => {
        if (!field?.key || Object.prototype.hasOwnProperty.call(result, field.key)) {
            return result;
        }

        result[field.key] = getEmptyFieldValue(field);
        return result;
    }, {...item});
}

function createTaskDraft() {
    const id = getNextEntityId(taskRows);
    const now = formatIsoDate(new Date());

    return applyEmptyFieldValues('task', {
        id,
        title: '',
        project: null,
        status: createEnumCell(getTaskField('status'), taskStatuses[0]?.id),
        priority: createEnumCell(getTaskField('priority'), taskPriorities[0]?.id),
        progress: createProgressCell(0),
        creator: null,
        responsible: null,
        observers: {
            value: [],
            items: [],
        },
        deadline: '',
        createdAt: now,
        updatedAt: now,
        comment: '',
    });
}

function createUserDraft() {
    const id = getNextEntityId(users);
    const now = formatIsoDate(new Date());

    return applyEmptyFieldValues('user', {
        id,
        firstName: '',
        middleName: '',
        lastName: '',
        fullName: '',
        email: '',
        phone: normalizePhoneValue(''),
        avatar: '',
        createdAt: now,
        updatedAt: now,
    });
}

async function normalizeEntityUpdateValue(entity = 'task', field = {}, value, currentItem = {}, uploadedFile = null) {
    const fieldType = resolveFieldType(field);
    const singleValue = Array.isArray(value) && value.length === 1 ? value[0] : value;

    if (uploadedFile) {
        return saveUploadedFieldFile(entity, currentItem, field.key, uploadedFile);
    }

    if (field.key === 'id') {
        return currentItem[field.key];
    }

    if (field.multiple || field.type === 'users') {
        const ids = normalizeValues(value);
        const selectedUsers = ids
            .map(findUserById)
            .filter(Boolean);

        return createAvatarsCell(selectedUsers);
    }

    if (field.type === 'user') {
        const user = findUserById(Array.isArray(value) ? value[0] : value);

        return user ? makeUserCell(user) : null;
    }

    if (field.dataType === 'enum' || field.type === 'enum') {
        return createEnumCell(field, Array.isArray(value) ? value[0] : value);
    }

    if (field.key === 'project') {
        const project = findProjectById(Array.isArray(value) ? value[0] : value);

        return project ? makeProjectCell(project) : null;
    }

    if (field.type === 'progress' || field.column?.renderer === 'progress-scale') {
        return createProgressCell(Array.isArray(value) ? value[0] : value);
    }

    if (fieldType === 'date' || field.dataType === 'date') {
        return normalizeDateValue(singleValue);
    }

    if (fieldType === 'phone' || field.dataType === 'phone' || field.editor?.component?.type === 'country-code') {
        return normalizePhoneValue(singleValue);
    }

    if (fieldType === 'avatar' || field.key === 'avatar') {
        if (isFileRemoveValue(singleValue)) {
            return '';
        }

        return normalizeStoredAvatarAsset(singleValue);
    }

    if (fieldType === 'file' || field.dataType === 'file') {
        if (isFileRemoveValue(singleValue)) {
            return '';
        }

        return normalizeStoredAvatarAsset(singleValue);
    }

    if (fieldType === 'money') {
        const amount = singleValue && typeof singleValue === 'object'
            ? singleValue.value
            : singleValue;

        return {
            type: 'money',
            value: amount === '' || amount === null || typeof amount === 'undefined'
                ? ''
                : Number(amount),
            currency: singleValue?.currency || field.settings?.currency || field.schema?.settings?.currency || 'RUB',
        };
    }

    if (fieldType === 'rating') {
        const ratingValue = singleValue && typeof singleValue === 'object'
            ? singleValue.value
            : singleValue;
        const max = Number(field.settings?.max || field.schema?.settings?.max || field.editor?.component?.props?.max || 5) || 5;
        const numericValue = Number(ratingValue);

        if (!Number.isFinite(numericValue)) {
            return 0;
        }

        return Math.min(Math.max(numericValue, 0), Math.max(max, 1));
    }

    if (fieldType === 'number' || field.dataType === 'number' || field.dataType === 'integer') {
        const numericValue = singleValue && typeof singleValue === 'object'
            ? singleValue.value
            : singleValue;

        return numericValue === '' || numericValue === null || typeof numericValue === 'undefined'
            ? ''
            : Number(numericValue);
    }

    if (fieldType === 'steps' || field.dataType === 'steps') {
        const current = singleValue && typeof singleValue === 'object'
            ? singleValue.current
            : singleValue;

        return {
            current: Number.isFinite(Number(current)) ? Number(current) : 0,
        };
    }

    if (fieldType === 'checkbox' || field.dataType === 'boolean') {
        return Boolean(singleValue);
    }

    return singleValue;
}

async function taskUpdateHandler(req, res) {
    const id = Number(req.params.id);
    const isMultipart = String(req.headers['content-type'] || '').includes('multipart/form-data');
    const multipart = isMultipart
        ? await parseMultipartRequest(req)
        : {
            fields: {},
            files: [],
        };
    const multipartPayload = multipart.fields.payload
        ? JSON.parse(multipart.fields.payload)
        : null;
    const requestBody = multipartPayload || req.body || {};
    const tableId = normalizeTableSettingsId(
        requestBody?.tableSettingsKey || req.query.tableId || DEFAULT_TABLE_ID,
    );
    const itemIndex = taskRows.findIndex((row) => Number(row.id) === id);

    if (itemIndex < 0) {
        res.status(404).json({
            success: false,
            message: 'Task not found',
        });
        return;
    }

    const values = requestBody?.values && typeof requestBody.values === 'object'
        ? requestBody.values
        : {};
    const nextItem = {
        ...taskRows[itemIndex],
    };

    for (const [fieldKey, value] of Object.entries(values)) {
        const field = getTaskField(fieldKey);

        if (!field) {
            continue;
        }

        const uploadedFile = getUploadedFileForField(multipart.files, fieldKey);

        nextItem[fieldKey] = await normalizeEntityUpdateValue('task', field, value, nextItem, uploadedFile);
    }

    taskRows[itemIndex] = nextItem;
    storeData.mockData = {
        ...(storeData.mockData || {}),
        users,
        projects,
        tasks: taskRows,
    };

    try {
        await writeStoreData();

        res.json({
            success: true,
            entity: 'task',
            heading: 'Задача',
        title: nextItem.title?.name || nextItem.title || `Задача #${nextItem.id}`,
        item: nextItem,
        affectedRows: [nextItem],
        rows: [nextItem],
            fields: withEditorInputValues(getTaskDetailFields(), nextItem),
        fieldTypes: fieldTypeRegistry,
        viewSettings: getViewSettings(tableId),
    });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Task update failed',
        });
    }
}

function taskCreateDraftHandler(req, res) {
    const tableId = normalizeTableSettingsId(req.query.tableId || DEFAULT_TABLE_ID);
    const item = createTaskDraft();

    res.json({
        success: true,
        entity: 'task',
        mode: 'create',
        heading: 'Задача',
        title: 'Новая задача',
        item,
        fields: withEditorInputValues(getTaskDetailFields(), item),
        fieldTypes: fieldTypeRegistry,
        viewSettings: getViewSettings(tableId),
    });
}

async function taskCreateHandler(req, res) {
    const isMultipart = String(req.headers['content-type'] || '').includes('multipart/form-data');
    const multipart = isMultipart
        ? await parseMultipartRequest(req)
        : {
            fields: {},
            files: [],
        };
    const multipartPayload = multipart.fields.payload
        ? JSON.parse(multipart.fields.payload)
        : null;
    const requestBody = multipartPayload || req.body || {};
    const tableId = normalizeTableSettingsId(
        requestBody?.tableSettingsKey || req.query.tableId || DEFAULT_TABLE_ID,
    );
    const values = requestBody?.values && typeof requestBody.values === 'object'
        ? requestBody.values
        : {};
    const nextItem = createTaskDraft();

    for (const [fieldKey, value] of Object.entries(values)) {
        const field = getTaskField(fieldKey);

        if (!field) {
            continue;
        }

        const uploadedFile = getUploadedFileForField(multipart.files, fieldKey);

        nextItem[fieldKey] = await normalizeEntityUpdateValue('task', field, value, nextItem, uploadedFile);
    }

    if (!String(nextItem.title || '').trim()) {
        nextItem.title = `Задача #${nextItem.id}`;
    }

    taskRows.unshift(nextItem);
    storeData.mockData = {
        ...(storeData.mockData || {}),
        users,
        projects,
        tasks: taskRows,
    };

    try {
        await writeStoreData();

        res.json({
            success: true,
            entity: 'task',
            heading: 'Задача',
            title: nextItem.title?.name || nextItem.title || `Задача #${nextItem.id}`,
            item: nextItem,
            affectedRows: [nextItem],
            rows: [nextItem],
            fields: withEditorInputValues(getTaskDetailFields(), nextItem),
            fieldTypes: fieldTypeRegistry,
            viewSettings: getViewSettings(tableId),
            pagination: {
                total: taskRows.length,
            },
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Task create failed',
        });
    }
}

function taskDetailHandler(req, res) {
    const id = Number(req.params.id);
    const tableId = normalizeTableSettingsId(req.query.tableId || DEFAULT_TABLE_ID);
    const viewSettings = getViewSettings(tableId);
    const item = taskRows.find((row) => Number(row.id) === id);

    if (!item) {
        res.status(404).json({
            success: false,
            message: 'Task not found',
        });
        return;
    }

    res.json({
        success: true,
        entity: 'task',
        heading: 'Задача',
        title: item.title?.name || item.title || `Задача #${item.id}`,
        item,
        fields: withEditorInputValues(getTaskDetailFields(), item),
        fieldTypes: fieldTypeRegistry,
        viewSettings,
    });
}

async function taskDeleteHandler(req, res) {
    const id = Number(req.params.id);
    const tableId = normalizeTableSettingsId(req.query.tableId || DEFAULT_TABLE_ID);
    const itemIndex = taskRows.findIndex((row) => Number(row.id) === id);

    if (itemIndex < 0) {
        res.status(404).json({
            success: false,
            message: 'Task not found',
        });
        return;
    }

    const [deletedItem] = taskRows.splice(itemIndex, 1);
    storeData.mockData = {
        ...(storeData.mockData || {}),
        users,
        projects,
        tasks: taskRows,
    };

    try {
        await writeStoreData();

        res.json({
            success: true,
            entity: 'task',
            deletedId: id,
            item: deletedItem,
            affectedRows: [],
            rows: [],
            fields: getTaskFilterFields(),
            fieldTypes: fieldTypeRegistry,
            viewSettings: getViewSettings(tableId),
            pagination: {
                total: taskRows.length,
            },
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Task delete failed',
        });
    }
}

function userDetailHandler(req, res) {
    const id = Number(req.params.id);
    const tableId = normalizeTableSettingsId(req.query.tableId || DEFAULT_TABLE_ID);
    const viewSettings = getViewSettings(tableId);
    const user = findUserById(id);

    if (!user) {
        res.status(404).json({
            success: false,
            message: 'User not found',
        });
        return;
    }

    const item = normalizeUserDetailItem(user);

    res.json({
        success: true,
        entity: 'user',
        heading: 'Пользователь',
        title: item.fullName || item.title || `Пользователь #${item.id}`,
        item,
        fields: withEditorInputValues(getUserDetailFields(), item),
        fieldTypes: fieldTypeRegistry,
        viewSettings,
    });
}

function userCreateDraftHandler(req, res) {
    const tableId = normalizeTableSettingsId(req.query.tableId || DEFAULT_TABLE_ID);
    const item = normalizeUserDetailItem(createUserDraft());

    res.json({
        success: true,
        entity: 'user',
        mode: 'create',
        heading: 'Пользователь',
        title: 'Новый пользователь',
        item,
        fields: withEditorInputValues(getUserDetailFields(), item),
        fieldTypes: fieldTypeRegistry,
        viewSettings: getViewSettings(tableId),
    });
}

async function userCreateHandler(req, res) {
    const isMultipart = String(req.headers['content-type'] || '').includes('multipart/form-data');
    const multipart = isMultipart
        ? await parseMultipartRequest(req)
        : {
            fields: {},
            files: [],
        };
    const multipartPayload = multipart.fields.payload
        ? JSON.parse(multipart.fields.payload)
        : null;
    const requestBody = multipartPayload || req.body || {};
    const tableId = normalizeTableSettingsId(
        requestBody?.tableSettingsKey || req.query.tableId || DEFAULT_TABLE_ID,
    );
    const values = requestBody?.values && typeof requestBody.values === 'object'
        ? requestBody.values
        : {};
    const nextUser = createUserDraft();

    for (const [fieldKey, value] of Object.entries(values)) {
        if (fieldKey === 'id') {
            continue;
        }

        const field = getEntityField('user', fieldKey);

        if (!field) {
            continue;
        }

        const uploadedFile = getUploadedFileForField(multipart.files, fieldKey);

        nextUser[fieldKey] = await normalizeEntityUpdateValue('user', field, value, nextUser, uploadedFile);
    }

    nextUser.fullName = getUserFullName(nextUser);
    users.unshift(nextUser);
    storeData.mockData = {
        ...(storeData.mockData || {}),
        users,
        projects,
        tasks: taskRows,
    };

    try {
        await writeStoreData();

        const item = normalizeUserDetailItem(nextUser);

        res.json({
            success: true,
            entity: 'user',
            heading: 'Пользователь',
            title: item.fullName || item.title || `Пользователь #${item.id}`,
            item,
            affectedRows: [],
            rows: [],
            fields: withEditorInputValues(getUserDetailFields(), item),
            fieldTypes: fieldTypeRegistry,
            viewSettings: getViewSettings(tableId),
            pagination: {
                total: users.length,
            },
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'User create failed',
        });
    }
}

async function userDeleteHandler(req, res) {
    const id = Number(req.params.id);
    const tableId = normalizeTableSettingsId(req.query.tableId || DEFAULT_TABLE_ID);
    const userIndex = users.findIndex((user) => Number(user.id) === id);

    if (userIndex < 0) {
        res.status(404).json({
            success: false,
            message: 'User not found',
        });
        return;
    }

    const [deletedUser] = users.splice(userIndex, 1);
    storeData.mockData = {
        ...(storeData.mockData || {}),
        users,
        projects,
        tasks: taskRows,
    };

    try {
        await writeStoreData();

        res.json({
            success: true,
            entity: 'user',
            deletedId: id,
            item: normalizeUserDetailItem(deletedUser),
            affectedRows: [],
            rows: [],
            fields: getUserFilterFields(),
            fieldTypes: fieldTypeRegistry,
            viewSettings: getViewSettings(tableId),
            pagination: {
                total: users.length,
            },
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'User delete failed',
        });
    }
}

async function userUpdateHandler(req, res) {
    const id = Number(req.params.id);
    const isMultipart = String(req.headers['content-type'] || '').includes('multipart/form-data');
    const multipart = isMultipart
        ? await parseMultipartRequest(req)
        : {
            fields: {},
            files: [],
        };
    const multipartPayload = multipart.fields.payload
        ? JSON.parse(multipart.fields.payload)
        : null;
    const requestBody = multipartPayload || req.body || {};
    const tableId = normalizeTableSettingsId(
        requestBody?.tableSettingsKey || req.query.tableId || DEFAULT_TABLE_ID,
    );
    const userIndex = users.findIndex((user) => Number(user.id) === id);

    if (userIndex < 0) {
        res.status(404).json({
            success: false,
            message: 'User not found',
        });
        return;
    }

    const values = requestBody?.values && typeof requestBody.values === 'object'
        ? requestBody.values
        : {};
    const nextUser = {
        ...users[userIndex],
    };

    for (const [fieldKey, value] of Object.entries(values)) {
        if (fieldKey === 'id') {
            continue;
        }

        const field = getEntityField('user', fieldKey);

        if (!field) {
            continue;
        }

        const uploadedFile = getUploadedFileForField(multipart.files, fieldKey);

        nextUser[fieldKey] = await normalizeEntityUpdateValue('user', field, value, nextUser, uploadedFile);
    }

    nextUser.fullName = getUserFullName(nextUser);
    users[userIndex] = nextUser;
    const affectedRows = patchTaskRowsForUpdatedEntity('user', nextUser);
    storeData.mockData = {
        ...(storeData.mockData || {}),
        users,
        projects,
        tasks: taskRows,
    };

    try {
        await writeStoreData();

        const item = normalizeUserDetailItem(nextUser);

        res.json({
            success: true,
            entity: 'user',
            heading: 'Пользователь',
            title: item.fullName || item.title || `Пользователь #${item.id}`,
            item,
            affectedRows,
            rows: affectedRows,
            fields: withEditorInputValues(getUserDetailFields(), item),
            fieldTypes: fieldTypeRegistry,
            viewSettings: getViewSettings(tableId),
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'User update failed',
        });
    }
}

function tasksHandler(req, res) {
    let rows = taskRows;
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    const tableId = normalizeTableSettingsId(req.query.tableId || DEFAULT_TABLE_ID);
    const viewSettings = getViewSettings(tableId);
    const tableSettings = getTableSettings(tableId);

    for (const [field, filter] of Object.entries(filters)) {
        const values = filter.values || filter.value;
        rows = applyFilter(rows, field, filter.operator, values);
    }

    if (req.query.search) {
        const search = String(req.query.search).toLowerCase();

        rows = rows.filter((item) => {
            return [
                item.title,
                getProjectLabel(item.project),
                item.creator?.name,
                item.responsible?.name,
            ].some((value) => String(value || '').toLowerCase().includes(search));
        });
    }

    rows = sortRows(rows, req.query.sort || req.query.sortKey, req.query.order || req.query.sortDirection);

    const total = rows.length;
    const limit = parsePositiveInt(req.query.limit ?? req.query.n, 10);
    const page = parsePositiveInt(req.query.page, 1);
    const offset =
        req.query.offset !== undefined
            ? Math.min(parsePositiveInt(req.query.offset, 0), total)
            : Math.min((page - 1) * limit, total);
    const nextOffset = Math.min(offset + limit, total);
    const data = rows.slice(offset, nextOffset);

    res.json({
        columns: getTaskColumns(),
        columnSettings: viewSettings.table.columns,
        tableSettings,
        viewSettings,
        fields: getTaskFilterFields(),
        fieldTypes: fieldTypeRegistry,
        items: data,
        userRows: rows,
        users: {
            count: users.length,
        },
        pagination: {
            page,
            limit,
            offset,
            nextOffset,
            total,
            pageSize: [10, 20, 30, 40],
            totalPages: Math.ceil(total / limit),
            hasMore: nextOffset < total,
        },
    });
}

app.listen(SERVER_PORT, () => {
    console.log(`Mock API: ${SERVER_BASE_URL}`);
    console.log(`Tasks endpoint: ${SERVER_BASE_URL}/api/tasks`);
});
