import * as THREE from 'three';

/**
 * Менеджер сцены Three.js
 * Управляет созданием, очисткой и обновлением 3D сцены
 */
export class SceneManager {
  /**
   * Создает экземпляр SceneManager
   * @param {HTMLElement} container - DOM элемент для рендеринга
   */
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.renderer = null;
    this.model = null;
    this.grid = null;
    this.axesHelper = null;

    this.init();
  }

  /**
   * Инициализирует сцену и рендерер
   */
  init() {
    this.createScene();
    this.createRenderer();
    this.createLights();
    this.createGrid();
    this.createAxesHelper();
  }

  /**
   * Создает Three.js сцену с темным фоном
   */
  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e1e1e);
  }

  /**
   * Создает WebGL рендерер
   */
  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * Создает освещение сцены для корректного отображения серых моделей
   */
  createLights() {
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    this.scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-5, -5, -5);
    this.scene.add(directionalLight2);
  }

  /**
   * Создает сетку пола как визуальный ориентир плоскости координат
   */
  createGrid() {
    this.grid = new THREE.GridHelper(500, 20, 0x444444, 0x333333);
    this.grid.material.opacity = 0.5;
    this.grid.material.transparent = true;
    this.scene.add(this.grid);
  }

  /**
   * Создает помощник осей координат (X - красный, Y - зеленый, Z - синий)
   */
  createAxesHelper() {
    this.axesHelper = new THREE.AxesHelper(5);
    this.scene.add(this.axesHelper);
  }

  /**
   * Включает отображение сетки
   */
  showGrid() {
    if (this.grid) this.grid.visible = true;
    if (this.axesHelper) this.axesHelper.visible = true;
  }

  /**
   * Выключает отображение сетки
   */
  hideGrid() {
    if (this.grid) this.grid.visible = false;
    if (this.axesHelper) this.axesHelper.visible = false;
  }

  /**
   * Переключает видимость сетки
   * @returns {boolean} текущее состояние видимости
   */
  toggleGrid() {
    if (this.grid) {
      this.grid.visible = !this.grid.visible;
      if (this.axesHelper) this.axesHelper.visible = this.grid.visible;
      return this.grid.visible;
    }
    return false;
  }

  /**
   * Добавляет модель на сцену
   * @param {THREE.Object3D} modelObject - 3D объект модели
   */
  addModel(modelObject) {
    this.clearModel();
    this.model = modelObject;
    this.scene.add(this.model);
  }

  /**
   * Удаляет текущую модель со сцены
   */
  clearModel() {
    if (this.model) {
      this.scene.remove(this.model);
      this.model = null;
    }
  }

  /**
   * Рендерит сцену
   * @param {THREE.Camera} camera - камера для рендеринга
   */
  render(camera) {
    this.renderer.render(this.scene, camera);
  }

  /**
   * Обновляет размеры рендерера
   * @param {number} width - новая ширина
   * @param {number} height - новая высота
   */
  resize(width, height) {
    this.renderer.setSize(width, height);
  }

  /**
   * Возвращает сцену
   * @returns {THREE.Scene} текущая сцена
   */
  getScene() {
    return this.scene;
  }

  /**
   * Возвращает рендерер
   * @returns {THREE.WebGLRenderer} текущий рендерер
   */
  getRenderer() {
    return this.renderer;
  }
}
