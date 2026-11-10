import { BaseModule } from './BaseModule.js';
import * as THREE from 'three';

/**
 * Модуль просмотра размеров
 * Позволяет выделять детали и отображать их размеры в виде линеек с рисками
 */
export class DimensionsModule extends BaseModule {
  /**
   * Создает экземпляр DimensionsModule
   * @param {Viewer} viewer - экземпляр просмотрщика
   */
  constructor(viewer) {
    super(viewer);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.selectedMesh = null;
    this.originalMaterial = null;
    this.highlightColor = 0xffb380; // Бледно-оранжевый без прозрачности
    this.dimensionObjects = [];
    this.labelSprites = [];
    this.isShowingOverallDimensions = false;
    this.uiPanel = null;
    this.overallButton = null;
    this.panelHeader = null;
    this.panelArrow = null;
    this.panelContent = null;
    this.isPanelCollapsed = false;

    this.labelScreenSize = 32;

    this.init();
  }

  /**
   * Инициализирует модуль
   */
  init() {
    this.createUI();
    this.setupEventListeners();
  }

  /**
   * Вызывается на каждом кадре для обновления масштаба ярлыков
   */
  update() {
    if (this.labelSprites.length === 0) return;

    const camera = this.viewer.cameraManager.getCamera();
    const renderer = this.viewer.sceneManager.getRenderer();
    const canvasHeight = renderer.domElement.clientHeight;
    const fov = camera.fov * (Math.PI / 180);

    this.labelSprites.forEach(labelData => {
      const sprite = labelData.sprite;
      const desiredScreenPixels = labelData.screenSize;
      const distance = camera.position.distanceTo(sprite.position);
      const visibleHeight = 2 * distance * Math.tan(fov / 2);
      const worldHeight = (desiredScreenPixels / canvasHeight) * visibleHeight;
      const worldWidth = worldHeight * 2;

      sprite.scale.set(worldWidth, worldHeight, 1);
    });
  }

  /**
   * Создает UI модуля с возможностью сворачивания
   */
  createUI() {
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

    // Заголовок с кликабельной областью для сворачивания (Ваши правки применены)
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
    title.textContent = 'Размеры детали';
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

    const dimensionsInfo = document.createElement('div');
    dimensionsInfo.id = 'dimensions-info';
    dimensionsInfo.style.cssText = 'font-size: 14px; line-height: 1.6;';

    this.overallButton = document.createElement('button');
    this.overallButton.textContent = 'Показать общие габариты';
    this.overallButton.style.cssText = `
      margin-top: 10px;
      padding: 8px 12px;
      background: #3d3d3d;
      color: #e0e0e0;
      border: 1px solid #555;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      width: 100%;
      transition: background 0.2s;
    `;

    this.overallButton.addEventListener('mouseenter', () => {
      this.overallButton.style.background = '#4d4d4d';
    });

    this.overallButton.addEventListener('mouseleave', () => {
      this.overallButton.style.background = '#3d3d3d';
    });

    this.overallButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.toggleOverallDimensions();
    });

    content.appendChild(dimensionsInfo);
    content.appendChild(this.overallButton);

    this.uiPanel.appendChild(header);
    this.uiPanel.appendChild(content);

    this.panelHeader = header;
    this.panelArrow = arrow;
    this.panelContent = content;

    header.addEventListener('click', () => {
      this.togglePanelCollapse();
    });

    this.viewer.uiContainer.appendChild(this.uiPanel);

    // Инициализируем пустое состояние при создании
    this.showEmptyDimensions();
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
   * Показывает прочерки, когда ничего не выбрано
   */
  showEmptyDimensions() {
    const dimensionsInfo = document.getElementById('dimensions-info');
    if (dimensionsInfo) {
      dimensionsInfo.innerHTML = `
        <div style="color: #ff8c42;"><strong>Ширина (X):</strong> --- мм</div>
        <div style="color: #4a9eff;"><strong>Высота (Y):</strong> --- мм</div>
        <div style="color: #4caf50;"><strong>Глубина (Z):</strong> --- мм</div>
      `;
    }
  }

  /**
   * Настраивает обработчики событий
   */
  setupEventListeners() {
    this.clickHandler = (event) => this.onMouseClick(event);
    this.viewer.sceneManager.getRenderer().domElement.addEventListener('click', this.clickHandler);
  }

  /**
   * Активирует модуль
   */
  activate() {
    super.activate();
    if (this.uiPanel) {
      this.uiPanel.style.display = 'block';
    }
    this.showEmptyDimensions();
  }

  /**
   * Деактивирует модуль
   */
  deactivate() {
    super.deactivate();
    if (this.uiPanel) {
      this.uiPanel.style.display = 'none';
    }
  }

  /**
   * Сбрасывает состояние модуля
   */
  reset() {
    this.clearSelection();
    this.clearDimensionVisuals();
    this.isShowingOverallDimensions = false;
    if (this.overallButton) {
      this.overallButton.textContent = 'Показать общие габариты';
    }
    this.showEmptyDimensions();
  }

  /**
   * Обработчик клика мыши
   */
  onMouseClick(event) {
    if (!this.isActive) return;

    const rect = this.viewer.sceneManager.getRenderer().domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.viewer.cameraManager.getCamera());

    const model = this.viewer.sceneManager.model;
    if (!model) return;

    const intersects = this.raycaster.intersectObjects(model.children, true);

    if (intersects.length > 0) {
      const meshIntersect = intersects.find(hit => hit.object.isMesh);
      if (meshIntersect) {
        this.selectMesh(meshIntersect.object);
      }
    }
  }

  /**
   * Выделяет меш и отображает его размеры
   */
  selectMesh(mesh) {
    this.clearSelection();
    this.clearDimensionVisuals();
    this.isShowingOverallDimensions = false;
    if (this.overallButton) {
      this.overallButton.textContent = 'Показать общие габариты';
    }

    this.selectedMesh = mesh;
    this.originalMaterial = mesh.material;

    const highlightMaterial = new THREE.MeshStandardMaterial({
      color: this.highlightColor,
      roughness: 0.6,
      metalness: 0.1
    });

    mesh.material = highlightMaterial;
    this.showMeshDimensions(mesh);
  }

  /**
   * Очищает выделение
   */
  clearSelection() {
    if (this.selectedMesh && this.originalMaterial) {
      this.selectedMesh.material = this.originalMaterial;
      this.selectedMesh = null;
      this.originalMaterial = null;
    }
  }

  /**
   * Показывает размеры меша
   */
  showMeshDimensions(mesh) {
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    const size = boundingBox.getSize(new THREE.Vector3());

    const dimensionsInfo = document.getElementById('dimensions-info');
    if (dimensionsInfo) {
      dimensionsInfo.innerHTML = `
        <div style="color: #ff8c42;"><strong>Ширина (X):</strong> ${size.x.toFixed(2)} мм</div>
        <div style="color: #4a9eff;"><strong>Высота (Y):</strong> ${size.y.toFixed(2)} мм</div>
        <div style="color: #4caf50;"><strong>Глубина (Z):</strong> ${size.z.toFixed(2)} мм</div>
      `;
    }

    this.createRulers(boundingBox);
  }

  /**
   * Создает визуальные линейки с рисками для габаритов
   */
  createRulers(boundingBox) {
    const min = boundingBox.min;
    const max = boundingBox.max;
    const size = boundingBox.getSize(new THREE.Vector3());

    const offset = Math.max(size.x, size.y, size.z, 10) * 0.15;

    const xStart = new THREE.Vector3(min.x, min.y - offset, min.z - offset);
    const xEnd = new THREE.Vector3(max.x, min.y - offset, min.z - offset);
    this.drawRuler(xStart, xEnd, `${size.x.toFixed(1)} мм`, 0xff8c42, 'x');

    const yStart = new THREE.Vector3(min.x - offset, min.y, min.z - offset);
    const yEnd = new THREE.Vector3(min.x - offset, max.y, min.z - offset);
    this.drawRuler(yStart, yEnd, `${size.y.toFixed(1)} мм`, 0x4a9eff, 'y');

    const zStart = new THREE.Vector3(min.x - offset, min.y - offset, min.z);
    const zEnd = new THREE.Vector3(min.x - offset, min.y - offset, max.z);
    this.drawRuler(zStart, zEnd, `${size.z.toFixed(1)} мм`, 0x4caf50, 'z');
  }

  /**
   * Рисует одну размерную линию с рисками и текстом
   */
  drawRuler(start, end, text, colorHex, axis) {
    const points = [];
    const length = end.distanceTo(start);
    const tickSize = Math.max(length * 0.05, 0.5);

    let perp = new THREE.Vector3();
    if (axis === 'x') perp.set(0, 1, 0);
    else if (axis === 'y') perp.set(1, 0, 0);
    else perp.set(1, 0, 0);

    points.push(start.clone());
    points.push(end.clone());

    points.push(start.clone().add(perp.clone().multiplyScalar(tickSize)));
    points.push(start.clone().sub(perp.clone().multiplyScalar(tickSize)));

    points.push(end.clone().add(perp.clone().multiplyScalar(tickSize)));
    points.push(end.clone().sub(perp.clone().multiplyScalar(tickSize)));

    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    points.push(mid.clone().add(perp.clone().multiplyScalar(tickSize * 0.6)));
    points.push(mid.clone().sub(perp.clone().multiplyScalar(tickSize * 0.6)));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: colorHex, linewidth: 2 });
    const line = new THREE.LineSegments(geometry, material);
    this.viewer.sceneManager.getScene().add(line);
    this.dimensionObjects.push(line);

    const sprite = this.createTextSprite(text, colorHex);
    const spritePos = mid.clone().add(perp.clone().multiplyScalar(tickSize * 1.8));
    sprite.position.copy(spritePos);
    sprite.scale.set(1, 0.5, 1);

    this.viewer.sceneManager.getScene().add(sprite);
    this.dimensionObjects.push(sprite);

    this.labelSprites.push({
      sprite: sprite,
      screenSize: this.labelScreenSize
    });
  }

  /**
   * Создает текстовый спрайт для отображения размера
   */
  createTextSprite(message, colorHex) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 96;
    canvas.width = 512;
    canvas.height = 256;

    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(message);
    const textWidth = metrics.width;

    ctx.fillStyle = 'rgba(30, 30, 30, 0.85)';
    ctx.fillRect((512 - textWidth) / 2 - 15, (256 - fontSize) / 2 - 15, textWidth + 30, fontSize + 30);

    ctx.strokeStyle = '#' + new THREE.Color(colorHex).getHexString();
    ctx.lineWidth = 4;
    ctx.strokeRect((512 - textWidth) / 2 - 15, (256 - fontSize) / 2 - 15, textWidth + 30, fontSize + 30);

    ctx.fillStyle = '#' + new THREE.Color(colorHex).getHexString();
    ctx.fillText(message, 256, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const material = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      transparent: true
    });

    return new THREE.Sprite(material);
  }

  /**
   * Очищает все визуальные элементы размеров
   */
  clearDimensionVisuals() {
    this.dimensionObjects.forEach(obj => {
      this.viewer.sceneManager.getScene().remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (obj.material.map) obj.material.map.dispose();
        obj.material.dispose();
      }
    });
    this.dimensionObjects = [];
    this.labelSprites = [];
  }

  /**
   * Переключает отображение общих габаритов
   */
  toggleOverallDimensions() {
    this.isShowingOverallDimensions = !this.isShowingOverallDimensions;

    if (this.isShowingOverallDimensions) {
      this.overallButton.textContent = 'Скрыть общие габариты';
      this.clearSelection();
      this.showOverallDimensions();
    } else {
      this.overallButton.textContent = 'Показать общие габариты';
      this.clearDimensionVisuals();
      this.showEmptyDimensions(); // <-- Возвращаем прочерки при сбросе
    }
  }

  /**
   * Показывает общие габариты модели
   */
  showOverallDimensions() {
    const model = this.viewer.sceneManager.model;
    if (!model) return;

    this.clearDimensionVisuals();

    const boundingBox = new THREE.Box3().setFromObject(model);
    const size = boundingBox.getSize(new THREE.Vector3());

    const dimensionsInfo = document.getElementById('dimensions-info');
    if (dimensionsInfo) {
      dimensionsInfo.innerHTML = `
        <div style="margin-bottom: 10px; color: #fff; border-bottom: 1px solid #555; padding-bottom: 5px;"><strong>Общие габариты:</strong></div>
        <div style="color: #ff8c42;"><strong>Ширина (X):</strong> ${size.x.toFixed(2)} мм</div>
        <div style="color: #4a9eff;"><strong>Высота (Y):</strong> ${size.y.toFixed(2)} мм</div>
        <div style="color: #4caf50;"><strong>Глубина (Z):</strong> ${size.z.toFixed(2)} мм</div>
      `;
    }

    this.createRulers(boundingBox);
  }
}
