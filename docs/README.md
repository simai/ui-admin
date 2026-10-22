# Документация SIMAI Admin

Корневой [`README.md`](../README.md) — короткая точка входа. Компоненты пакета
`larena` описаны в [`components/README.md`](../components/README.md) и в
документации у каждого компонента (`components/src/smart/*/docs*`); решения
владельца по экранам админки — в
[`components/docs/developer/admin-decisions.md`](../components/docs/developer/admin-decisions.md).

## Сайт и полигон

- [Полигон](POLYGON.md) — главная страница: 120 записей, все типы свойств,
  хост с переключаемыми состояниями; что из этого брать Larena.

## Разработчикам

- [Локальная разработка](developer/local-development.md) — соседние checkout, команды, страницы, переменные окружения.
- [Framework runtime и пакет компонентов](developer/framework-runtime.md) — два lock-файла, материализация, проверки, выпуск и выкладка.
- [Связи компонентов](developer/component-connections.md) — как страницы подключают Framework, пакет и хосты портов.
- [Административное меню](developer/admin-menu.md) — меню через порт навигации и разметкой.
- [sf-table на mock API](developer/sf-table-integration.md) — страница `/mock-api.html`: методы, события, CRUD.
- [Контракт API](developer/api-contract.md) — HTTP mock API (`server.js`).
- [Технический аудит](developer/repository-audit.md) — состояние на 2026-10-22 и открытые вопросы.

## Архив

- [Larena Smart Integration: P0 evidence](larena-smart-integration/README.md) — проверка 2026-08-20, до пинов по выпускам и пакета `larena`; не обновляется.

## Границы документации

Документы описывают этот репозиторий. Framework (`ui-source`, `ui`), сборка
пакетов (`ui-builder`), выпуск (`ui-control`) и Larena — самостоятельные
владельцы своих контрактов.
