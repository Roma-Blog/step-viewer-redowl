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
    this.uiPanel = null;
    this.wireframeCheckbox = null;
    this.panelHeader = null;
    this.panelArrow = null;
    this.panelContent = null;
    this.isPanelCollapsed = false;
  }

  /**
   * Активирует модуль просмотра
   */
  activate() {
    super.activate();
    this.createUI();
    this.updateWireframeVisibility();
  }

  /**
   * Деактивирует модуль
   */
  deactivate() {
    super.deactivate();
    this.destroyUI();
  }

  /**
   * Сбрасывает состояние модуля
   */
  reset() {
    this.showWireframe = false;
    if (this.wireframeCheckbox) {
      this.wireframeCheckbox.checked = false;
    }
    this.updateWireframeVisibility();
  }

  /**
   * Создает UI панель инструментов
   */
  createUI() {
    if (this.uiPanel) return;

    this.uiPanel = document.createElement('div');
    this.uiPanel.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      background: #2d2d2d;
      color: #e0e0e0;
      padding: 0;
      border-radius: 8px;
      border: 1px solid #444;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-width: 200px;
      display: none;
      overflow: hidden;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px;
      cursor: pointer;
      user-select: none;
      transition: background 0.2s;
      border-bottom: 1px solid #444;
    `;
    header.addEventListener('mouseenter', () => {
      header.style.background = '#3d3d3d';
    });
    header.addEventListener('mouseleave', () => {
      header.style.background = 'transparent';
    });

    const title = document.createElement('h3');
    title.textContent = 'Инструменты';
    title.style.cssText = 'margin: 0; font-size: 12px; font-weight: 700; color: #fff';

    const arrow = document.createElement('span');
    arrow.innerHTML = '&#9660;';
    arrow.style.cssText = `
      color: #a0a0a0;
      font-size: 12px;
      transition: transform 0.3s ease;
      display: inline-block;
    `;

    header.appendChild(title);
    header.appendChild(arrow);

    const content = document.createElement('div');
    content.style.cssText = `
      padding: 15px;
      transition: max-height 0.3s ease, padding 0.3s ease, opacity 0.3s ease;
      max-height: 300px;
      opacity: 1;
      overflow: hidden;
    `;

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
    `;
    wireframeLabel.addEventListener('mouseenter', () => {
      wireframeLabel.style.background = '#3d3d3d';
    });
    wireframeLabel.addEventListener('mouseleave', () => {
      wireframeLabel.style.background = 'transparent';
    });

    const wireframeCheckbox = document.createElement('input');
    wireframeCheckbox.type = 'checkbox';
    wireframeCheckbox.style.cssText = `
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: #4a9eff;
    `;
    wireframeCheckbox.checked = this.showWireframe;

    const wireframeText = document.createElement('span');
    wireframeText.textContent = 'Показать сетку';

    wireframeLabel.appendChild(wireframeCheckbox);
    wireframeLabel.appendChild(wireframeText);

    wireframeCheckbox.addEventListener('change', (event) => {
      this.showWireframe = event.target.checked;
      this.updateWireframeVisibility();
    });

    content.appendChild(wireframeLabel);

    this.uiPanel.appendChild(header);
    this.uiPanel.appendChild(content);

    this.panelHeader = header;
    this.panelArrow = arrow;
    this.panelContent = content;
    this.wireframeCheckbox = wireframeCheckbox;

    header.addEventListener('click', () => {
      this.togglePanelCollapse();
    });

    this.viewer.uiContainer.appendChild(this.uiPanel);
    this.uiPanel.style.display = 'block';
  }

  /**
   * Уничтожает UI панель при деактивации модуля
   */
  destroyUI() {
    if (this.uiPanel && this.uiPanel.parentNode) {
      this.uiPanel.parentNode.removeChild(this.uiPanel);
      this.uiPanel = null;
    }
  }

  /**
   * Переключает состояние сворачивания панели
   */
  togglePanelCollapse() {
    this.isPanelCollapsed = !this.isPanelCollapsed;

    if (this.isPanelCollapsed) {
      this.panelContent.style.maxHeight = '0';
      this.panelContent.style.padding = '0 15px';
      this.panelContent.style.opacity = '0';
      this.panelArrow.style.transform = 'rotate(-90deg)';
      this.panelHeader.style.borderBottom = 'none';
    } else {
      this.panelContent.style.maxHeight = '300px';
      this.panelContent.style.padding = '15px';
      this.panelContent.style.opacity = '1';
      this.panelArrow.style.transform = 'rotate(0deg)';
      this.panelHeader.style.borderBottom = '1px solid #444';
    }
  }

  /**
   * Включает отображение сетки
   */
  enableWireframe() {
    this.showWireframe = true;
    if (this.wireframeCheckbox) {
      this.wireframeCheckbox.checked = true;
    }
    this.updateWireframeVisibility();
  }

  /**
   * Выключает отображение сетки
   */
  disableWireframe() {
    this.showWireframe = false;
    if (this.wireframeCheckbox) {
      this.wireframeCheckbox.checked = false;
    }
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
