# Справка по использованию STEP Viewer

## Структура HTML вьюера

Каждый вьюер представляет собой блок с классом `step-viewer` и обязательной внутренней структурой:

```html
<div class="step-viewer" 
     data-model-url="" 
     data-auto-load="false"
     id="unique-viewer-id">
  <div class="viewer-container"></div>
  <div class="ui-container">
    <div class="loading-overlay">
      <div class="spinner"></div>
      <div class="loading-text">Загрузка модели...</div>
      <div class="loading-progress">Пожалуйста, подождите</div>
    </div>
  </div>
</div>
```

## Data-атрибуты

| Атрибут | Тип | Обязательный | Описание |
|---------|-----|--------------|----------|
| `data-model-url` | string | Нет | URL STEP файла для автоматической загрузки |
| `data-auto-load` | "true" / "false" | Нет | Режим загрузки. По умолчанию "false" |
| `id` | string | Нет | Уникальный идентификатор вьюера |

## Режимы загрузки

### Автоматическая загрузка

Модель загружается сразу при открытии страницы. Ручная загрузка блокируется.

```html
<div class="step-viewer" 
     data-model-url="/models/sample.step" 
     data-auto-load="true"
     id="viewer-auto">
  <div class="viewer-container"></div>
  <div class="ui-container">
    <div class="loading-overlay">
      <div class="spinner"></div>
      <div class="loading-text">Загрузка модели...</div>
      <div class="loading-progress">Пожалуйста, подождите</div>
    </div>
  </div>
</div>
```

**Поведение:**
- Модель загружается автоматически по указанному URL
- Input для выбора файла заблокирован (полупрозрачный, курсор not-allowed)
- При ошибке загрузки разблокируется ручная загрузка

### Ручная загрузка

Пользователь самостоятельно выбирает STEP файл для загрузки. Может менять модели.

```html
<div class="step-viewer" 
     data-auto-load="false"
     id="viewer-manual">
  <div class="viewer-container"></div>
  <div class="ui-container">
    <div class="loading-overlay">
      <div class="spinner"></div>
      <div class="loading-text">Загрузка модели...</div>
      <div class="loading-progress">Пожалуйста, подождите</div>
    </div>
  </div>
</div>
```

**Поведение:**
- Пользователь выбирает файл через input
- Можно загружать разные модели последовательно
- Каждая новая модель заменяет предыдущую

## Множественные вьюеры на одной странице

### Два вьюера рядом

```html
<div style="display: flex; height: 100vh;">
  <div class="step-viewer" 
       data-model-url="/models/model1.step" 
       data-auto-load="true"
       id="viewer-1"
       style="width: 50%; height: 100%;">
    <div class="viewer-container"></div>
    <div class="ui-container">
      <div class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text">Загрузка модели...</div>
        <div class="loading-progress">Пожалуйста, подождите</div>
      </div>
    </div>
  </div>

  <div class="step-viewer" 
       data-model-url="/models/model2.step" 
       data-auto-load="true"
       id="viewer-2"
       style="width: 50%; height: 100%;">
    <div class="viewer-container"></div>
    <div class="ui-container">
      <div class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text">Загрузка модели...</div>
        <div class="loading-progress">Пожалуйста, подождите</div>
      </div>
    </div>
  </div>
</div>
```

### Вьюер с автозагрузкой и вьюер с ручной загрузкой

```html
<div style="display: flex; flex-direction: column; height: 100vh;">
  <div class="step-viewer" 
       data-model-url="/models/preview.step" 
       data-auto-load="true"
       id="viewer-preview"
       style="width: 100%; height: 60%;">
    <div class="viewer-container"></div>
    <div class="ui-container">
      <div class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text">Загрузка модели...</div>
        <div class="loading-progress">Пожалуйста, подождите</div>
      </div>
    </div>
  </div>

  <div class="step-viewer" 
       data-auto-load="false"
       id="viewer-compare"
       style="width: 100%; height: 40%;">
    <div class="viewer-container"></div>
    <div class="ui-container">
      <div class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text">Загрузка модели...</div>
        <div class="loading-progress">Пожалуйста, подождите</div>
      </div>
    </div>
  </div>
</div>
```

### Сетка из четырех вьюеров

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; height: 100vh;">
  <div class="step-viewer" data-model-url="/models/m1.step" data-auto-load="true" id="v1">
    <div class="viewer-container"></div>
    <div class="ui-container">
      <div class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text">Загрузка модели...</div>
        <div class="loading-progress">Пожалуйста, подождите</div>
      </div>
    </div>
  </div>

  <div class="step-viewer" data-model-url="/models/m2.step" data-auto-load="true" id="v2">
    <div class="viewer-container"></div>
    <div class="ui-container">
      <div class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text">Загрузка модели...</div>
        <div class="loading-progress">Пожалуйста, подождите</div>
      </div>
    </div>
  </div>

  <div class="step-viewer" data-model-url="/models/m3.step" data-auto-load="true" id="v3">
    <div class="viewer-container"></div>
    <div class="ui-container">
      <div class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text">Загрузка модели...</div>
        <div class="loading-progress">Пожалуйста, подождите</div>
      </div>
    </div>
  </div>

  <div class="step-viewer" data-auto-load="false" id="v4">
    <div class="viewer-container"></div>
    <div class="ui-container">
      <div class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text">Загрузка модели...</div>
        <div class="loading-progress">Пожалуйста, подождите</div>
      </div>
    </div>
  </div>
</div>
```

## Интеграция в существующий сайт

### Встраивание в страницу сайта

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Мой сайт с 3D моделями</title>
  <link rel="stylesheet" href="path/to/step-viewer/styles.css">
</head>
<body>
  <header>
    <h1>Каталог деталей</h1>
  </header>

  <main>
    <section>
      <h2>Деталь №1</h2>
      <div class="step-viewer" 
           data-model-url="/catalog/part1.step" 
           data-auto-load="true"
           id="part-1"
           style="width: 100%; height: 500px;">
        <div class="viewer-container"></div>
        <div class="ui-container">
          <div class="loading-overlay">
            <div class="spinner"></div>
            <div class="loading-text">Загрузка модели...</div>
            <div class="loading-progress">Пожалуйста, подождите</div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h2>Деталь №2</h2>
      <div class="step-viewer" 
           data-model-url="/catalog/part2.step" 
           data-auto-load="true"
           id="part-2"
           style="width: 100%; height: 500px;">
        <div class="viewer-container"></div>
        <div class="ui-container">
          <div class="loading-overlay">
            <div class="spinner"></div>
            <div class="loading-text">Загрузка модели...</div>
            <div class="loading-progress">Пожалуйста, подождите</div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <script type="module" src="path/to/step-viewer/main.js"></script>
</body>
</html>
```

### Динамическое создание вьюеров через JavaScript

```javascript
function createViewer(containerId, modelUrl, autoLoad = false) {
  const container = document.getElementById(containerId);
  
  const viewerDiv = document.createElement('div');
  viewerDiv.className = 'step-viewer';
  viewerDiv.dataset.modelUrl = modelUrl;
  viewerDiv.dataset.autoLoad = autoLoad.toString();
  viewerDiv.id = `viewer-${Date.now()}`;
  
  viewerDiv.innerHTML = `
    <div class="viewer-container"></div>
    <div class="ui-container">
      <div class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text">Загрузка модели...</div>
        <div class="loading-progress">Пожалуйста, подождите</div>
      </div>
    </div>
  `;
  
  container.appendChild(viewerDiv);
  
  // После добавления в DOM вьюер автоматически инициализируется
  // через ViewerManager при следующей проверке
}

// Пример использования
createViewer('viewer-wrapper', '/models/dynamic.step', true);
```

## Поддерживаемые форматы

- `.step` - стандартный формат STEP
- `.stp` - альтернативное расширение STEP

## Важные замечания

1. Каждый вьюер работает независимо от других
2. URL модели может быть как локальным (`/models/file.step`), так и удаленным (`https://example.com/file.step`)
3. При автозагрузке ручная загрузка блокируется до успешной загрузки модели
4. При ошибке автозагрузки ручная загрузка разблокируется автоматически
5. Все вьюеры инициализируются автоматически после загрузки DOM
6. Уникальные `id` для вьюеров рекомендуются, но не обязательны
```
