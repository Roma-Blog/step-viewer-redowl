import { BaseModule } from './BaseModule.js';
import * as THREE from 'three';

/**
 * Модуль слайсирования модели с использованием Stencil Buffer
 * Обеспечивает идеальное заполнение среза без z-fighting и рисует контур сечения
 */
export class SliceModule extends BaseModule {
  constructor(viewer) {
    super(viewer);
    this.clippingPlane = null;
    this.slicePlaneMesh = null;
    this.sliceContourLines = null; // Линии контура сечения
    this.stencilGroup = null;
    this.currentAxis = 'x';
    this.slicePercent = 50;
    this.uiPanel = null;
    this.axisSelect = null;
    this.sliceSlider = null;
    this.originalMaterials = new Map();
    this.isPanelCollapsed = false;
    this.panelHeader = null;
    this.panelArrow = null;
    this.panelContent = null;
    this.panelSliderValue = null;

    this.init();
  }

  init() {
    this.createClippingPlane();
    this.createUI();
  }

  createClippingPlane() {
    this.clippingPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
  }

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
      min-width: 220px;
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
    header.addEventListener('mouseenter', () => { header.style.background = '#3d3d3d'; });
    header.addEventListener('mouseleave', () => { header.style.background = 'transparent'; });

    const title = document.createElement('h3');
    title.textContent = 'Разрез модели';
    title.style.cssText = 'margin: 0; font-size: 12px; font-weight: 700; color: #fff';

    const arrow = document.createElement('span');
    arrow.innerHTML = '&#9660;';
    arrow.style.cssText = `color: #a0a0a0; font-size: 12px; transition: transform 0.3s ease; display: inline-block;`;

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

    const axisLabel = document.createElement('label');
    axisLabel.textContent = 'Ось разреза:';
    axisLabel.style.cssText = 'display: block; margin-bottom: 5px; font-size: 13px; color: #a0a0a0;';

    this.axisSelect = document.createElement('select');
    this.axisSelect.style.cssText = `
      width: 100%;
      padding: 6px 10px;
      background: #3d3d3d;
      color: #e0e0e0;
      border: 1px solid #555;
      border-radius: 4px;
      font-size: 13px;
      cursor: pointer;
      margin-bottom: 15px;
    `;

    ['x', 'y', 'z'].forEach(axis => {
      const option = document.createElement('option');
      option.value = axis;
      option.textContent = `Ось ${axis.toUpperCase()}`;
      this.axisSelect.appendChild(option);
    });

    this.axisSelect.addEventListener('change', (event) => {
      this.currentAxis = event.target.value;
      this.updateClippingPlane();
    });

    const sliderLabel = document.createElement('label');
    sliderLabel.textContent = 'Позиция среза:';
    sliderLabel.style.cssText = 'display: block; margin-bottom: 5px; font-size: 13px; color: #a0a0a0;';

    this.sliceSlider = document.createElement('input');
    this.sliceSlider.type = 'range';
    this.sliceSlider.min = '2';
    this.sliceSlider.max = '98';
    this.sliceSlider.value = '50';
    this.sliceSlider.style.cssText = `width: 100%; cursor: pointer; accent-color: #4a9eff;`;

    const sliderValue = document.createElement('div');
    sliderValue.style.cssText = 'text-align: center; font-size: 12px; color: #a0a0a0; margin-top: 5px;';
    sliderValue.textContent = `${this.slicePercent}%`;

    this.sliceSlider.addEventListener('input', (event) => {
      this.slicePercent = parseInt(event.target.value);
      sliderValue.textContent = `${this.slicePercent}%`;
      this.updateClippingPlane();
    });

    content.appendChild(axisLabel);
    content.appendChild(this.axisSelect);
    content.appendChild(sliderLabel);
    content.appendChild(this.sliceSlider);
    content.appendChild(sliderValue);

    this.uiPanel.appendChild(header);
    this.uiPanel.appendChild(content);

    this.panelHeader = header;
    this.panelArrow = arrow;
    this.panelContent = content;
    this.panelSliderValue = sliderValue;

    header.addEventListener('click', () => { this.togglePanelCollapse(); });
    this.viewer.uiContainer.appendChild(this.uiPanel);
  }

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

  activate() {
    super.activate();
    if (this.uiPanel) this.uiPanel.style.display = 'block';
    this.applyClippingToModel();
    this.createStencilGroup();
    this.updateClippingPlane();
  }

  deactivate() {
    super.deactivate();
    if (this.uiPanel) this.uiPanel.style.display = 'none';
    this.removeClippingFromModel();
    this.removeStencilGroup();
    this.removeSlicePlaneVisualization();
  }

  reset() {
    this.currentAxis = 'x';
    this.slicePercent = 50;
    if (this.axisSelect) this.axisSelect.value = 'x';
    if (this.sliceSlider) {
      this.sliceSlider.value = '50';
      this.panelSliderValue.textContent = '50%';
    }
    this.updateClippingPlane();
  }

  applyClippingToModel() {
    const model = this.viewer.sceneManager.model;
    if (!model) return;

    model.traverse((child) => {
      // Применяем ко всем объектам с материалом (включая LineSegments для контуров)
      if (child.material) {
        if (!this.originalMaterials.has(child.uuid)) {
          this.originalMaterials.set(child.uuid, child.material);
        }
        const material = child.material.clone();
        material.clippingPlanes = [this.clippingPlane];
        if (child.isMesh) {
          material.clipShadows = true;
          material.side = THREE.DoubleSide;
        }
        child.material = material;
      }
    });
  }

  removeClippingFromModel() {
    const model = this.viewer.sceneManager.model;
    if (!model) return;

    model.traverse((child) => {
      if (child.material && this.originalMaterials.has(child.uuid)) {
        child.material = this.originalMaterials.get(child.uuid);
      }
    });
    this.originalMaterials.clear();
  }

  createStencilGroup() {
    this.removeStencilGroup();
    this.stencilGroup = new THREE.Group();
    const model = this.viewer.sceneManager.model;
    if (!model) return;

    const baseMat = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: false,
      depthTest: false,
      stencilWrite: true,
      stencilFunc: THREE.AlwaysStencilFunc,
      clippingPlanes: [this.clippingPlane]
    });

    model.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const mat0 = baseMat.clone();
        mat0.side = THREE.BackSide;
        mat0.stencilFail = THREE.IncrementWrapStencilOp;
        mat0.stencilZFail = THREE.IncrementWrapStencilOp;
        mat0.stencilZPass = THREE.IncrementWrapStencilOp;
        const mesh0 = new THREE.Mesh(child.geometry, mat0);
        mesh0.renderOrder = 1;
        this.stencilGroup.add(mesh0);

        const mat1 = baseMat.clone();
        mat1.side = THREE.FrontSide;
        mat1.stencilFail = THREE.DecrementWrapStencilOp;
        mat1.stencilZFail = THREE.DecrementWrapStencilOp;
        mat1.stencilZPass = THREE.DecrementWrapStencilOp;
        const mesh1 = new THREE.Mesh(child.geometry, mat1);
        mesh1.renderOrder = 1;
        this.stencilGroup.add(mesh1);
      }
    });

    this.viewer.sceneManager.getScene().add(this.stencilGroup);
  }

  removeStencilGroup() {
    if (this.stencilGroup) {
      this.viewer.sceneManager.getScene().remove(this.stencilGroup);
      this.stencilGroup.traverse((child) => {
        if (child.material) child.material.dispose();
      });
      this.stencilGroup = null;
    }
  }

  updateClippingPlane() {
    const model = this.viewer.sceneManager.model;
    if (!model) return;

    const boundingBox = new THREE.Box3().setFromObject(model);
    const min = boundingBox.min;
    const size = boundingBox.getSize(new THREE.Vector3());

    let position = 0;
    const normal = new THREE.Vector3();

    switch (this.currentAxis) {
      case 'x':
        position = min.x + (size.x * this.slicePercent / 100);
        normal.set(-1, 0, 0);
        break;
      case 'y':
        position = min.y + (size.y * this.slicePercent / 100);
        normal.set(0, -1, 0);
        break;
      case 'z':
        position = min.z + (size.z * this.slicePercent / 100);
        normal.set(0, 0, -1);
        break;
    }

    this.clippingPlane.normal.copy(normal);
    this.clippingPlane.constant = position;

    if (this.stencilGroup) {
      this.stencilGroup.traverse((child) => {
        if (child.material && child.material.clippingPlanes) {
          child.material.clippingPlanes = [this.clippingPlane];
        }
      });
    }

    this.updateSlicePlaneVisualization(boundingBox, position);
  }

  removeSlicePlaneVisualization() {
    if (this.slicePlaneMesh) {
      this.viewer.sceneManager.getScene().remove(this.slicePlaneMesh);
      this.slicePlaneMesh.geometry.dispose();
      this.slicePlaneMesh.material.dispose();
      this.slicePlaneMesh = null;
    }
    if (this.sliceContourLines) {
      this.viewer.sceneManager.getScene().remove(this.sliceContourLines);
      this.sliceContourLines.geometry.dispose();
      this.sliceContourLines.material.dispose();
      this.sliceContourLines = null;
    }
  }

  /**
   * Вычисляет и рисует контур сечения модели на плоскости среза
   * Исправлено: точки теперь группируются попарно для каждого треугольника,
   * что исключает появление случайных "лишних" линий.
   */
  updateSliceContour(boundingBox, position) {
    if (this.sliceContourLines) {
      this.viewer.sceneManager.getScene().remove(this.sliceContourLines);
      this.sliceContourLines.geometry.dispose();
      this.sliceContourLines.material.dispose();
      this.sliceContourLines = null;
    }

    const model = this.viewer.sceneManager.model;
    if (!model) return;

    const points = [];
    const plane = this.clippingPlane;
    const eps = 1e-5; // Допуск для борьбы с ошибками плавающей запятой

    // Вспомогательная функция для расчета точки пересечения
    const getIntersection = (v1, v2, d1, d2) => {
      const t = d1 / (d1 - d2);
      return new THREE.Vector3().lerpVectors(v1, v2, t);
    };

    model.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const geometry = child.geometry;
        const positionAttr = geometry.attributes.position;
        const indexAttr = geometry.index;

        // Функция обработки одного треугольника
        const processTriangle = (a, b, c) => {
          const v1 = new THREE.Vector3().fromBufferAttribute(positionAttr, a).applyMatrix4(child.matrixWorld);
          const v2 = new THREE.Vector3().fromBufferAttribute(positionAttr, b).applyMatrix4(child.matrixWorld);
          const v3 = new THREE.Vector3().fromBufferAttribute(positionAttr, c).applyMatrix4(child.matrixWorld);

          const d1 = plane.distanceToPoint(v1);
          const d2 = plane.distanceToPoint(v2);
          const d3 = plane.distanceToPoint(v3);

          // Проверяем, пересекает ли плоскость ребра треугольника (с учетом допуска eps)
          const cuts12 = (d1 > eps && d2 < -eps) || (d1 < -eps && d2 > eps);
          const cuts23 = (d2 > eps && d3 < -eps) || (d2 < -eps && d3 > eps);
          const cuts31 = (d3 > eps && d1 < -eps) || (d3 < -eps && d1 > eps);

          let pA = null, pB = null;

          // Плоскость может пересекать треугольник только по двум ребрам
          if (cuts12 && cuts23) {
            pA = getIntersection(v1, v2, d1, d2);
            pB = getIntersection(v2, v3, d2, d3);
          } else if (cuts23 && cuts31) {
            pA = getIntersection(v2, v3, d2, d3);
            pB = getIntersection(v3, v1, d3, d1);
          } else if (cuts31 && cuts12) {
            pA = getIntersection(v3, v1, d3, d1);
            pB = getIntersection(v1, v2, d1, d2);
          }

          // Если нашли два пересечения, добавляем их как ПАРУ точек для LineSegments
          if (pA && pB) {
            points.push(pA.x, pA.y, pA.z, pB.x, pB.y, pB.z);
          }
        };

        if (indexAttr) {
          // Обработка индексированной геометрии (стандарт для occt-import-js)
          for (let i = 0; i < indexAttr.count; i += 3) {
            processTriangle(indexAttr.getX(i), indexAttr.getX(i + 1), indexAttr.getX(i + 2));
          }
        } else {
          // Обработка неиндексированной геометрии
          for (let i = 0; i < positionAttr.count; i += 3) {
            processTriangle(i, i + 1, i + 2);
          }
        }
      }
    });

    // Если нашли точки пересечения, рисуем линии
    if (points.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

      const material = new THREE.LineBasicMaterial({
        color: 0x000000,
        linewidth: 2
      });

      this.sliceContourLines = new THREE.LineSegments(geometry, material);
      this.sliceContourLines.renderOrder = 2; // Рисуем поверх крышки

      this.viewer.sceneManager.getScene().add(this.sliceContourLines);
    }
  }

  updateSlicePlaneVisualization(boundingBox, position) {
    this.removeSlicePlaneVisualization();

    const min = boundingBox.min;
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const planeSize = maxDim * 2;

    let geometry;
    const meshPosition = new THREE.Vector3();
    const rotation = new THREE.Euler();

    switch (this.currentAxis) {
      case 'x':
        geometry = new THREE.PlaneGeometry(planeSize, planeSize);
        meshPosition.set(position, min.y + size.y / 2, min.z + size.z / 2);
        rotation.set(0, Math.PI / 2, 0);
        break;
      case 'y':
        geometry = new THREE.PlaneGeometry(planeSize, planeSize);
        meshPosition.set(min.x + size.x / 2, position, min.z + size.z / 2);
        rotation.set(-Math.PI / 2, 0, 0);
        break;
      case 'z':
        geometry = new THREE.PlaneGeometry(planeSize, planeSize);
        meshPosition.set(min.x + size.x / 2, min.y + size.y / 2, position);
        rotation.set(0, 0, 0);
        break;
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.DoubleSide,
      stencilWrite: true,
      stencilRef: 0,
      stencilFunc: THREE.NotEqualStencilFunc,
      stencilFail: THREE.ReplaceStencilOp,
      stencilZFail: THREE.ReplaceStencilOp,
      stencilZPass: THREE.ReplaceStencilOp
    });

    this.slicePlaneMesh = new THREE.Mesh(geometry, material);
    this.slicePlaneMesh.position.copy(meshPosition);
    this.slicePlaneMesh.rotation.copy(rotation);
    this.slicePlaneMesh.renderOrder = 1.1;

    this.slicePlaneMesh.onAfterRender = (renderer) => {
      renderer.clearStencil();
    };

    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x4a9eff, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    this.slicePlaneMesh.add(wireframe);

    this.viewer.sceneManager.getScene().add(this.slicePlaneMesh);

    // Рисуем контур сечения
    this.updateSliceContour(boundingBox, position);
  }
}
