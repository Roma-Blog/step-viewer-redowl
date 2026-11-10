import { SceneManager } from './SceneManager.js';
import { CameraManager } from './CameraManager.js';
import { ControlsManager } from './ControlsManager.js';
import { StepLoader } from './StepLoader.js';
import { ViewModule } from '../modules/ViewModule.js';
import { DimensionsModule } from '../modules/DimensionsModule.js';
import * as THREE from 'three';

/**
 * Главный класс просмотрщика
 * Управляет всеми компонентами и жизненным циклом приложения
 */
export class Viewer {
  /**
   * Создает экземпляр Viewer
   * @param {HTMLElement} container - DOM элемент для рендеринга
   * @param {HTMLElement} uiContainer - DOM элемент для интерфейса
   */
  constructor(container, uiContainer) {
    this.container = container;
    this.uiContainer = uiContainer;
    this.sceneManager = null;
    this.cameraManager = null;
    this.controlsManager = null;
    this.stepLoader = null;
    this.isAnimating = false;
    this.animationFrameId = null;
    this.modules = {};
    this.activeModule = null;
    this.isReady = false;
    this.initPromise = null;

    this.initPromise = this.init();
  }

  /**
   * Инициализирует все компоненты просмотрщика
   * @returns {Promise<void>}
   */
  async init() {
    this.sceneManager = new SceneManager(this.container);
    this.cameraManager = new CameraManager(this.container);
    this.controlsManager = new ControlsManager(
      this.cameraManager.getCamera(),
      this.sceneManager.getRenderer().domElement
    );
    this.stepLoader = new StepLoader();

    await this.stepLoader.init();
    this.initModules();
    this.startAnimation();
    this.isReady = true;
    console.log('Viewer fully initialized');
  }

  /**
   * Ожидает полной инициализации просмотрщика
   * @returns {Promise<void>}
   */
  async waitForReady() {
    if (this.isReady) return;
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  /**
   * Проверяет готовность просмотрщика
   * @returns {boolean} true если просмотрщик полностью инициализирован
   */
  getIsReady() {
    return this.isReady;
  }

  /**
   * Инициализирует модули
   */
  initModules() {
    this.modules.view = new ViewModule(this);
    this.modules.dimensions = new DimensionsModule(this);
    this.setActiveModule('view');
  }

  /**
   * Устанавливает активный модуль
   * @param {string} moduleName - имя модуля
   */
  setActiveModule(moduleName) {
    if (this.activeModule) {
      this.activeModule.deactivate();
    }

    if (this.modules[moduleName]) {
      this.activeModule = this.modules[moduleName];
      this.activeModule.activate();
    }
  }

  /**
   * Возвращает активный модуль
   * @returns {BaseModule} текущий активный модуль
   */
  getActiveModule() {
    return this.activeModule;
  }

  /**
   * Проверяет наличие модели на сцене
   * @returns {boolean} true если модель загружена
   */
  hasModel() {
    return this.sceneManager.model !== null;
  }

  /**
   * Загружает модель из файла
   * @param {File} file - STEP файл
   * @returns {Promise<void>}
   */
  async loadModelFromFile(file) {
    await this.waitForReady();

    try {
      const model = await this.stepLoader.loadFromFile(file);
      this.addModelToScene(model);
    } catch (error) {
      console.error('Failed to load model from file:', error);
      throw error;
    }
  }

  /**
   * Загружает модель по URL
   * @param {string} url - URL STEP файла
   * @returns {Promise<void>}
   */
  async loadModelFromUrl(url) {
    await this.waitForReady();

    try {
      const model = await this.stepLoader.loadFromUrl(url);
      this.addModelToScene(model);
    } catch (error) {
      console.error('Failed to load model from URL:', error);
      throw error;
    }
  }

  /**
   * Добавляет модель на сцену и настраивает камеру
   * @param {THREE.Object3D} model - 3D модель
   */
  addModelToScene(model) {
    this.sceneManager.addModel(model);
    this.fitCameraToModel(model);

    if (this.activeModule) {
      this.activeModule.updateWireframeVisibility?.();
    }
  }

  /**
   * Настраивает камеру для просмотра модели
   * @param {THREE.Object3D} model - 3D модель
   */
  fitCameraToModel(model) {
    const boundingBox = new THREE.Box3().setFromObject(model);
    this.cameraManager.fitToModel(boundingBox);

    const center = boundingBox.getCenter(new THREE.Vector3());
    this.controlsManager.setTarget(center);
  }

  /**
   * Запускает цикл анимации
   */
  startAnimation() {
    if (this.isAnimating) return;

    this.isAnimating = true;
    this.animate();
  }

  /**
   * Останавливает цикл анимации
   */
  stopAnimation() {
    this.isAnimating = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Цикл анимации
   */
  animate() {
    if (!this.isAnimating) return;

    this.animationFrameId = requestAnimationFrame(() => this.animate());
    this.controlsManager.update();
    if (this.activeModule) {
      this.activeModule.update();
    }
    this.sceneManager.render(this.cameraManager.getCamera());
  }

  /**
   * Обработчик изменения размера окна
   * @param {number} width - новая ширина
   * @param {number} height - новая высота
   */
  resize(width, height) {
    this.cameraManager.resize(width, height);
    this.sceneManager.resize(width, height);
  }

  /**
   * Возвращает сцену
   * @returns {THREE.Scene} текущая сцена
   */
  getScene() {
    return this.sceneManager.getScene();
  }

  /**
   * Возвращает камеру
   * @returns {THREE.Camera} текущая камера
   */
  getCamera() {
    return this.cameraManager.getCamera();
  }

  /**
   * Возвращает загрузчик
   * @returns {StepLoader} загрузчик STEP файлов
   */
  getStepLoader() {
    return this.stepLoader;
  }
}
