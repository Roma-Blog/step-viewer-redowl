import * as THREE from 'three';

/**
 * Менеджер камеры
 * Управляет созданием, позиционированием и обновлением камеры
 */
export class CameraManager {
  /**
   * Создает экземпляр CameraManager
   * @param {HTMLElement} container - DOM элемент для расчета пропорций
   */
  constructor(container) {
    this.container = container;
    this.camera = null;

    this.init();
  }

  /**
   * Инициализирует камеру
   */
  init() {
    this.createCamera();
    this.setInitialPosition();
  }

  /**
   * Создает перспективную камеру
   */
  createCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
  }

  /**
   * Устанавливает начальную позицию камеры
   */
  setInitialPosition() {
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Обновляет пропорции камеры при изменении размера контейнера
   * @param {number} width - новая ширина
   * @param {number} height - новая высота
   */
  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Позиционирует камеру для просмотра модели
   * @param {THREE.Box3} boundingBox - ограничивающий бокс модели
   */
  fitToModel(boundingBox) {
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.5;

    this.camera.position.set(center.x + cameraZ, center.y + cameraZ, center.z + cameraZ);
    this.camera.lookAt(center);
    this.camera.updateProjectionMatrix();
  }

  /**
   * Возвращает камеру
   * @returns {THREE.PerspectiveCamera} текущая камера
   */
  getCamera() {
    return this.camera;
  }
}
