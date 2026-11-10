import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Менеджер управления камерой
 * Управляет орбитальным управлением камерой (вращение, зум, панорама)
 */
export class ControlsManager {
  /**
   * Создает экземпляр ControlsManager
   * @param {THREE.Camera} camera - камера для управления
   * @param {HTMLElement} domElement - DOM элемент для обработки событий
   */
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.controls = null;

    this.init();
  }

  /**
   * Инициализирует орбитальное управление
   */
  init() {
    this.controls = new OrbitControls(this.camera, this.domElement);
    this.configureControls();
  }

  /**
   * Настраивает параметры управления
   */
  configureControls() {
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = 1000;
    this.controls.maxPolarAngle = Math.PI;
  }

  /**
   * Устанавливает точку фокуса управления
   * @param {THREE.Vector3} target - точка фокуса
   */
  setTarget(target) {
    this.controls.target.copy(target);
    this.controls.update();
  }

  /**
   * Обновляет управление (вызывается в цикле анимации)
   */
  update() {
    this.controls.update();
  }

  /**
   * Включает управление
   */
  enable() {
    this.controls.enabled = true;
  }

  /**
   * Выключает управление
   */
  disable() {
    this.controls.enabled = false;
  }

  /**
   * Возвращает контролы
   * @returns {OrbitControls} текущие контролы
   */
  getControls() {
    return this.controls;
  }
}
