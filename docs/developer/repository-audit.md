# Технический аудит

Дата проверки: 2026-08-20.

## Подтверждено

- Приложение - Vite/TypeScript frontend с точкой входа `index.html` и orchestration в `src/main.ts`.
- Assets Core и Smart фиксируются полными Git SHA и SHA-256 в `config/simai-assets.lock.json`.
- Strict materializer читает локальный `.env`, поэтому фактический путь `../ui-core` можно задать без изменения lock-файла.
- `npm run dev:runtime` обходит materializer и способен работать от указанного готового runtime, где присутствуют `core/` и `smart/`.
- `.env` и generated runtime directories игнорируются Git; `.env.example` разрешён для коммита.
- Проверка `npm run test:runtime` валидирует точные commit SHA, хэши обязательных файлов и provenance.

## Важные ограничения

1. `dev:runtime` проверяет доступность готовых assets только во время работы Vite; он не сравнивает их с lock-файлом. Перед сборкой нужен strict runtime.
2. `npm run build` требует оба checkout: Core и Smart. Готовый `distr/` не подменяет production materialization.
3. В lock-файле дефолтный Core путь остаётся `../ui`, хотя локальный каталог называется `ui-core`. Это корректно компенсируется `.env`, но fresh clone без `.env` получит ошибку пути.
4. Mock API расположен вне этого репозитория, поэтому contract можно задокументировать, но невозможно полноценно проверить CRUD без его запуска.
5. В репозитории не было отдельного `docs/` и нет `CHANGELOG.md`; текущая документация теперь разложена по `docs/`, а необходимость changelog следует решить до первого versioned release.

## Рекомендованный рабочий режим

Для повседневной разработки используйте `npm run dev:runtime` с готовым `SIMAI_RUNTIME_ROOT`. Перед изменением lock-пары или релизной сборкой обеспечьте доступ к точным Core/Smart checkout и выполните `npm run test:runtime`, затем `npm run build`.
