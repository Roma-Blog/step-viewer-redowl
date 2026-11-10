import { BaseModule } from './BaseModule.js';

/**
 * Модуль базового просмотра
 * Управляет отображением модели и сетки поверхности
 */
export class ViewModule extends BaseModule {
  /**
   * Создает экземпляр ViewModule
   * @param {Viewer} viewer - экземпляр просмотрщика
   */
  constructor(viewer) {
    super(viewer);
    this.showWireframe = false;
  }

  /**
   * Активирует модуль просмотра
   */
  activate() {
    super.activate();
    this.updateWireframeVisibility();
  }

  /**
   * Сбрасывает состояние модуля
   */
  reset() {
    this.showWireframe = false;
    this.updateWireframeVisibility();
  }

  /**
   * Включает отображение сетки
   */
  enableWireframe() {
    this.showWireframe = true;
    this.updateWireframeVisibility();
  }

  /**
   * Выключает отображение сетки
   */
  disableWireframe() {
    this.showWireframe = false;
    this.updateWireframeVisibility();
  }

  /**
   * Переключает отображение сетки
   */
  toggleWireframe() {
    this.showWireframe = !this.showWireframe;
    this.updateWireframeVisibility();
  }

  /**
   * Обновляет видимость сетки на всех мешах модели
   */
  updateWireframeVisibility() {
    const model = this.viewer.sceneManager.model;
    if (!model) return;

    model.traverse((child) => {
      if (child.isLineSegments) {
        child.visible = this.showWireframe;
      }
    });
  }

  /**
   * Возвращает статус отображения сетки
   * @returns {boolean} true если сетка отображается
   */
  getShowWireframe() {
    return this.showWireframe;
  }
}
