import { Viewer } from './core/Viewer.js';

/**
 * Точка входа приложения STEP Viewer
 * Инициализирует все вьюеры на странице
 */

console.log('STEP Viewer initialized');

/**
 * Класс приложения для одного экземпляра вьюера
 * Управляет жизненным циклом и инициализацией компонентов
 */
class App {
  /**
   * Создает экземпляр приложения
   * @param {HTMLElement} viewerElement - корневой элемент вьюера с data-атрибутами
   */
  constructor(viewerElement) {
    this.viewerElement = viewerElement;
    this.viewerContainer = viewerElement.querySelector('.viewer-container');
    this.uiContainer = viewerElement.querySelector('.ui-container');
    this.loadingOverlay = viewerElement.querySelector('.loading-overlay');
    this.loadingText = viewerElement.querySelector('.loading-text');
    this.loadingProgress = viewerElement.querySelector('.loading-progress');

    this.viewer = null;
    this.fileInput = null;
    this.fileInputInfo = null;
    this.wireframeCheckbox = null;
    this.wireframeLabel = null;
    this.isAutoLoadMode = false;

    this.modelUrl = viewerElement.dataset.modelUrl || '';
    this.autoLoad = viewerElement.dataset.autoLoad === 'true';
    this.viewerId = viewerElement.id || `viewer-${Date.now()}`;
  }

  /**
   * Инициализирует приложение и ожидает полной готовности Viewer
   */
  async init() {
    console.log(`[DEBUG] Initializing viewer: ${this.viewerId}`);

    try {
      this.viewer = new Viewer(this.viewerContainer);
      this.createFileLoaderUI();
      this.setupEventListeners();
      this.hideModuleUI();

      await this.viewer.waitForReady();
      console.log(`[DEBUG] Viewer ${this.viewerId} is ready`);

      if (this.autoLoad && this.modelUrl && this.modelUrl.trim() !== '') {
        console.log(`[DEBUG] Auto-load mode enabled for ${this.viewerId}, URL: ${this.modelUrl}`);
        await this.loadAutoModel();
      } else {
        console.log(`[DEBUG] Manual load mode enabled for ${this.viewerId}`);
      }

      console.log(`[DEBUG] Viewer ${this.viewerId} initialized successfully`);
    } catch (error) {
      console.error(`[DEBUG] Failed to initialize viewer ${this.viewerId}:`, error);
    }
  }

  /**
   * Автоматически загружает модель по URL и блокирует ручную загрузку
   */
  async loadAutoModel() {
    this.isAutoLoadMode = true;
    this.disableManualLoad();

    await this.showLoading('Автоматическая загрузка модели...');
    this.updateLoadingProgress(`URL: ${this.modelUrl}`);

    try {
      console.log(`[DEBUG] Starting auto model load for ${this.viewerId}...`);
      await this.viewer.loadModelFromUrl(this.modelUrl);
      console.log(`[DEBUG] Auto model loaded successfully for ${this.viewerId}`);
      this.updateModuleUIVisibility();
    } catch (error) {
      console.error(`[DEBUG] Failed to auto load model for ${this.viewerId}:`, error);
      alert('Ошибка автоматической загрузки модели: ' + error.message);
      this.enableManualLoad();
      this.isAutoLoadMode = false;
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Скрывает интерфейс ручной загрузки модели
   */
  disableManualLoad() {
    if (this.fileInput) {
      this.fileInput.style.display = 'none';
    }
    if (this.fileInputInfo) {
      this.fileInputInfo.style.display = 'none';
    }
  }

  /**
   * Показывает интерфейс ручной загрузки модели
   */
  enableManualLoad() {
    if (this.fileInput) {
      this.fileInput.style.display = 'block';
    }
    if (this.fileInputInfo) {
      this.fileInputInfo.style.display = 'block';
    }
  }

  /**
   * Создает UI для загрузки файлов и управления сеткой
   */
  createFileLoaderUI() {
    const loaderDiv = document.createElement('div');
    loaderDiv.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      background: #2d2d2d;
      color: #e0e0e0;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #444;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const title = document.createElement('h3');
    title.textContent = 'STEP Viewer';
    title.style.cssText = 'margin: 0 0 10px 0; font-size: 16px; font-weight: 500;color:#fff';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.step,.stp';
    fileInput.style.cssText = 'margin-bottom: 10px; color: #e0e0e0; display: block;';

    const info = document.createElement('p');
    info.textContent = 'Загрузите STEP файл для просмотра';
    info.style.cssText = 'margin: 0 0 15px 0; font-size: 12px; color: #a0a0a0;';
    this.fileInputInfo = info;

    const wireframeLabel = document.createElement('label');
    wireframeLabel.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
      padding: 8px;
      border-radius: 4px;
      transition: background 0.2s;
      display: none;
    `;
    wireframeLabel.addEventListener('mouseenter', () => {
      wireframeLabel.style.background = '#3d3d3d';
    });
    wireframeLabel.addEventListener('mouseleave', () => {
      wireframeLabel.style.background = 'transparent';
    });

    const wireframeCheckbox = document.createElement('input');
    wireframeCheckbox.type = 'checkbox';
    wireframeCheckbox.id = `wireframe-toggle-${this.viewerId}`;
    wireframeCheckbox.style.cssText = `
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: #4a9eff;
    `;

    const wireframeText = document.createElement('span');
    wireframeText.textContent = 'Показать сетку';

    wireframeLabel.appendChild(wireframeCheckbox);
    wireframeLabel.appendChild(wireframeText);

    loaderDiv.appendChild(title);
    loaderDiv.appendChild(fileInput);
    loaderDiv.appendChild(info);
    loaderDiv.appendChild(wireframeLabel);

    this.uiContainer.appendChild(loaderDiv);
    this.fileInput = fileInput;
    this.wireframeCheckbox = wireframeCheckbox;
    this.wireframeLabel = wireframeLabel;
  }

  /**
   * Скрывает интерфейс модулей
   */
  hideModuleUI() {
    if (this.wireframeLabel) {
      this.wireframeLabel.style.display = 'none';
    }
  }

  /**
   * Показывает интерфейс модулей
   */
  showModuleUI() {
    if (this.wireframeLabel) {
      this.wireframeLabel.style.display = 'flex';
    }
  }

  /**
   * Обновляет видимость интерфейса модулей в зависимости от наличия модели
   */
  updateModuleUIVisibility() {
    if (this.viewer.hasModel()) {
      this.showModuleUI();
    } else {
      this.hideModuleUI();
    }
  }

  /**
   * Показывает индикатор загрузки с задержкой для отрисовки DOM
   * @param {string} text - текст загрузки
   * @returns {Promise<void>}
   */
  async showLoading(text = 'Загрузка модели...') {
    if (this.loadingOverlay) {
      this.loadingText.textContent = text;
      this.loadingProgress.textContent = 'Пожалуйста, подождите';
      this.loadingOverlay.classList.add('active');

      await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      }));
    }
  }

  /**
   * Скрывает индикатор загрузки
   */
  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.remove('active');
    }
  }

  /**
   * Обновляет текст прогресса загрузки
   * @param {string} text - текст прогресса
   */
  updateLoadingProgress(text) {
    if (this.loadingProgress) {
      this.loadingProgress.textContent = text;
    }
  }

  /**
   * Настраивает обработчики событий
   */
  setupEventListeners() {
    window.addEventListener('resize', () => this.onResize());

    if (this.fileInput) {
      this.fileInput.addEventListener('change', (event) => this.onFileSelect(event));
    }

    if (this.wireframeCheckbox) {
      this.wireframeCheckbox.addEventListener('change', (event) => this.onWireframeToggle(event));
    }
  }

  /**
   * Обработчик изменения размера окна
   */
  onResize() {
    if (this.viewer) {
      this.viewer.resize(
        this.viewerContainer.clientWidth,
        this.viewerContainer.clientHeight
      );
    }
  }

  /**
   * Обработчик выбора файла
   * @param {Event} event - событие изменения input
   */
  async onFileSelect(event) {
    if (this.isAutoLoadMode) {
      console.log(`[DEBUG] Manual load blocked in auto-load mode for ${this.viewerId}`);
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    console.log(`[DEBUG] File selected for ${this.viewerId}:`, file.name);

    await this.showLoading('Загрузка модели...');
    this.updateLoadingProgress(`Файл: ${file.name}`);

    try {
      console.log(`[DEBUG] Starting model load for ${this.viewerId}...`);
      await this.viewer.loadModelFromFile(file);
      console.log(`[DEBUG] Model loaded successfully for ${this.viewerId}`);
      this.updateModuleUIVisibility();
    } catch (error) {
      console.error(`[DEBUG] Failed to load model for ${this.viewerId}:`, error);
      alert('Ошибка загрузки файла: ' + error.message);
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Обработчик переключения сетки
   * @param {Event} event - событие изменения чекбокса
   */
  onWireframeToggle(event) {
    const activeModule = this.viewer.getActiveModule();
    if (activeModule && activeModule.constructor.name === 'ViewModule') {
      if (event.target.checked) {
        activeModule.enableWireframe();
      } else {
        activeModule.disableWireframe();
      }
    }
  }
}

/**
 * Менеджер вьюеров
 * Управляет инициализацией всех вьюеров на странице
 */
class ViewerManager {
  /**
   * Создает экземпляр ViewerManager
   */
  constructor() {
    this.viewers = [];
  }

  /**
   * Инициализирует все вьюеры на странице
   */
  async initAll() {
    const viewerElements = document.querySelectorAll('.step-viewer');
    console.log(`[DEBUG] Found ${viewerElements.length} viewer(s) on page`);

    const initPromises = Array.from(viewerElements).map(async (element) => {
      const app = new App(element);
      this.viewers.push(app);
      await app.init();
    });

    await Promise.all(initPromises);
    console.log(`[DEBUG] All viewers initialized`);
  }
}

/**
 * Инициализация приложения после загрузки DOM
 */
document.addEventListener('DOMContentLoaded', async () => {
  const manager = new ViewerManager();
  await manager.initAll();
});
