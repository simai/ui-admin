---
description: Как отвечать порту навигации SIMAI Admin из Laravel — маршрут и контроллер намерений с проверкой прав; что меняется в Larena.
profile: how_to
---

# Laravel и Larena

В Laravel намерения порта принимает один маршрут и один контроллер. Дерево
меню удобно собирать из конфигурации разделов и прав пользователя.

## Перед началом

- Порт на странице отправляет намерения на `/admin/navigation` —
  [Сервер](../).
- Аутентификация администратора и права через политики или `Gate`.

## Шаги

1. Заведите маршрут:

   ```php
   // routes/web.php
   Route::post('/admin/navigation', AdminNavigationController::class)->middleware('auth');
   ```

2. Напишите контроллер. Неизвестное намерение — `unavailable`:

   ```php
   final class AdminNavigationController
   {
       public function __invoke(Request $request, AdminMenu $menu): JsonResponse
       {
           $intent = $request->string('intent')->toString();
           $payload = $request->input('payload', []);
           $user = $request->user();

           return response()->json(match ($intent) {
               'navigation.load' => ['answer' => 'applied', ...$menu->for($user, $request->string('page'))],
               'favourite.toggle' => ['answer' => 'applied', 'favourites' => $menu->toggleFavourite($user, $payload['key'])],
               'notifications.load' => ['answer' => 'applied', ...$menu->notifications($user)],
               'notifications.read' => ['answer' => 'applied', 'unread' => $menu->read($user, $payload['keys'] ?? [], (bool) ($payload['all'] ?? false))],
               'session.sign-out' => $this->signOut($request),
               default => ['answer' => 'unavailable', 'reason' => 'capability-not-provided'],
           });
       }

       private function signOut(Request $request): array
       {
           Auth::guard('web')->logout();
           $request->session()->invalidate();

           return ['answer' => 'applied', 'href' => route('login')];
       }
   }
   ```

3. В `AdminMenu::for()` оставьте в дереве только разделы, которые человеку
   разрешены (`Gate::allows`), и найдите текущую строку по адресу страницы.

4. Чтобы меню нарисовалось без заготовки, напечатайте тот же ответ в
   шаблоне страницы:

   ```blade
   <sf-admin-menu slot="menu" aria-label="Меню" current="{{ $current }}">
     <script type="application/json" data-sf-settings>@json(['first-answer' => $menu->for(auth()->user(), request()->path())])</script>
   </sf-admin-menu>
   ```

## Larena

В Larena — CMS SIMAI на Laravel — набор входит в её лицензию. Ответы порта
те же самые: контроллер выше показывает, что в них должно быть, а Larena
собирает их из своих разделов и прав.

## Результат

Меню и уведомления админки на Laravel работают через один маршрут, а первый
кадр приходит уже с разделами.

## См. также

- [REST](../rest/)
- [Первый кадр](../../concepts/first-paint/)
