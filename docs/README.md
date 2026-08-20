# Документация SIMAI Admin

Этот каталог содержит актуальную техническую документацию демо-админки. Корневой `README.md` оставлен короткой точкой входа.

## Разработчикам

- [Локальная разработка](developer/local-development.md) - установка, команды и переменные окружения.
- [Framework runtime](developer/framework-runtime.md) - lock-файл, строгая materialization, provenance и выпуск сборки.
- [Контракт API](developer/api-contract.md) - endpoints, переназначение путей, форматы запросов и Larena smoke.
- [sf-table в Admin](developer/sf-table-integration.md) - полный lifecycle, contract данных, события, CRUD и связь с текущим API-клиентом.
- [Административное меню](developer/admin-menu.md) - разметка, вложенность, зависимости и локальные настройки `sf-admin-menu`.
- [Связи компонентов](developer/component-connections.md) - как меню, таблица, Core loader и Admin orchestration соединены между собой.
- [Технический аудит](developer/repository-audit.md) - подтвержденная структура, риски и ограничения на 2026-08-20.

## Границы документации

Документы описывают этот frontend-репозиторий. Внешний mock API, Larena и репозитории UI Core/Smart остаются самостоятельными владельцами своих контрактов и исходников.
