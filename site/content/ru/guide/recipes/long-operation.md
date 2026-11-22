---
description: Долгая операция в фоне — список действий страницы, индикатор в строке пути, сообщение о конце и неудача в уведомлениях.
profile: how_to
---

# Долгая операция

Человек запускает резервную копию и работает дальше. Индикатор в строке
пути показывает, что копия идёт, а когда она кончится — скажет сам.

## Перед началом

- Набор подключён — [Подключение](../../connection/).
- Сервер умеет сообщать ход действия: опросом, событиями или веб-сокетом.

## Шаги

1. Поставьте индикатор рядом с крошками строки пути:

   ```html
   <sf-admin-activity id="activity" history-href="/admin/activity"></sf-admin-activity>
   ```

2. Держите список действий в коде страницы и задавайте его заново при
   каждом изменении:

   ```js
   const activity = document.querySelector('#activity');
   let runs = [];
   const put = (run) => {
     runs = [...runs.filter((one) => one.id !== run.id), run];
     activity.runs = runs;
   };
   put({id: 'copy-1', label: 'Копия srv1.larena.cloud', state: 'running', value: 0, total: 100, unit: '%'});
   ```

3. Сообщайте ход и итог: `state: 'done'` или `state: 'failed'` с `text` —
   причиной неудачи.

4. Отвечайте на «Повторить» и «Отменить» — события
   `sf-admin-activity-retry` и `sf-admin-activity-cancel` с `id` действия.

## Результат

Нажмите «Сделать копию» и «Обновить PHP»: первое закончится успешно,
второе — неудачей, и она появится в списке уведомлений ниже.

:::example {id="guide/long-operation" label="Долгая операция" log="sf-admin-activity-finished sf-admin-activity-retry"}
:::

## См. также

- [Фоновые действия](../../concepts/activity/)
- [Рецепт «Долгая работа» SIMAI Framework](https://ui.simai.io/ru/recipes/progress/long-job/)
