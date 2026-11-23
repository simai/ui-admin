---
description: Как отвечать порту навигации SIMAI Admin из 1С-Битрикса — контроллер модуля и вызов через BX.ajax.runAction.
profile: how_to
---

# 1С-Битрикс

В Битриксе намерения порта удобно принимать контроллером модуля: он сам
проверяет сессию и токен, а порт на странице вызывает его через
`BX.ajax.runAction`.

## Перед началом

- Свой модуль, например `vendor.admin`, с меню разделов и правами.
- Страница админки, на которой подключён набор — [Подключение](../../connection/).

## Шаги

1. Создайте контроллер в модуле:

   ```php
   // /local/modules/vendor.admin/lib/Controller/Navigation.php
   namespace Vendor\Admin\Controller;

   use Bitrix\Main\Engine\Controller;
   use Vendor\Admin\Menu;

   final class Navigation extends Controller
   {
       public function intentAction(string $intent, array $payload = [], string $page = ''): array
       {
           global $USER;
           $menu = new Menu((int) $USER->GetID());

           return match ($intent) {
               'navigation.load' => ['answer' => 'applied'] + $menu->load($page),
               'favourite.toggle' => ['answer' => 'applied', 'favourites' => $menu->toggleFavourite($payload['key'])],
               'notifications.load' => ['answer' => 'applied'] + $menu->notifications(),
               'notifications.read' => ['answer' => 'applied', 'unread' => $menu->read($payload['keys'] ?? [], !empty($payload['all']))],
               default => ['answer' => 'unavailable', 'reason' => 'capability-not-provided'],
           };
       }
   }
   ```

2. Пусть порт на странице вызывает контроллер:

   ```js
   const port = {
     port: 'simai.admin-navigation-port',
     version: '1.1.0',
     capabilities: ['favourites', 'notifications'],
     async raise(intent, payload = {}) {
       try {
         const {data} = await BX.ajax.runAction('vendor:admin.Navigation.intent', {
           data: {intent, payload, page: location.pathname},
         });
         return data;
       } catch {
         return {answer: 'unavailable', reason: 'Сервер не ответил.'};
       }
     },
   };
   ```

3. Вручите порт меню и уведомлениям, как в разделе [Сервер](../).

## Результат

Меню админки на Битриксе читает разделы и уведомления через контроллер
модуля; права и сессию проверяет сам Битрикс.

## См. также

- [REST](../rest/)
- [Порт навигации](../../concepts/port/)
