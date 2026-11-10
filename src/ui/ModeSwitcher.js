/**
 * Переключатель режимов просмотрщика
 * Управляет UI для выбора активного модуля через выпадающий список (select)
 */
export class ModeSwitcher {
  /**
   * Создает экземпляр ModeSwitcher
   * @param {HTMLElement} container - контейнер для размещения переключателя
   * @param {Function} onModeChange - callback при изменении режима
   */
  constructor(container, onModeChange) {
    this.container = container;
    this.onModeChange = onModeChange;
    this.selectElement = null;
    this.activeMode = null;
  }

  /**
   * Инициализирует переключатель режимов
   * @param {Array} modes - массив объектов режимов {id, label}
   */
  init(modes) {
    this.createUI(modes);
    this.hide();
  }

  /**
   * Создает UI переключателя в виде выпадающего списка
   * @param {Array} modes - массив объектов режимов
   */
  createUI(modes) {
    this.selectElement = document.createElement('select');
    this.selectElement.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: #2d2d2d;
      color: #e0e0e0;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 14px;
      cursor: pointer;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      outline: none;
      transition: border-color 0.2s, background 0.2s;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Стилизация при наведении
    this.selectElement.addEventListener('mouseenter', () => {
      this.selectElement.style.borderColor = '#555';
      this.selectElement.style.background = '#3d3d3d';
    });

    this.selectElement.addEventListener('mouseleave', () => {
      this.selectElement.style.borderColor = '#444';
      this.selectElement.style.background = '#2d2d2d';
    });

    // Стилизация при фокусе
    this.selectElement.addEventListener('focus', () => {
      this.selectElement.style.borderColor = '#4a9eff';
    });

    this.selectElement.addEventListener('blur', () => {
      this.selectElement.style.borderColor = '#444';
    });

    // Создание опций
    modes.forEach(mode => {
      const option = document.createElement('option');
      option.value = mode.id;
      option.textContent = mode.label;
      option.style.cssText = `
        background: #2d2d2d;
        color: #e0e0e0;
        padding: 8px;
      `;
      this.selectElement.appendChild(option);
    });

    // Обработчик изменения выбора
    this.selectElement.addEventListener('change', (event) => {
      this.setActiveMode(event.target.value);
      if (this.onModeChange) {
        this.onModeChange(event.target.value);
      }
    });

    this.container.appendChild(this.selectElement);
  }

  /**
   * Устанавливает активный режим
   * @param {string} modeId - идентификатор режима
   */
  setActiveMode(modeId) {
    if (this.selectElement) {
      this.selectElement.value = modeId;
    }
    this.activeMode = modeId;
  }

  /**
   * Показывает переключатель режимов
   */
  show() {
    if (this.selectElement) {
      this.selectElement.style.display = 'block';
    }
  }

  /**
   * Скрывает переключатель режимов
   */
  hide() {
    if (this.selectElement) {
      this.selectElement.style.display = 'none';
    }
  }
}
