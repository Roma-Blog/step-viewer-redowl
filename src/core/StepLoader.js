import * as THREE from 'three';
import occt from 'occt-import-js';
import wasmUrl from 'occt-import-js/dist/occt-import-js.wasm?url';

/**
 * Загрузчик STEP файлов
 * Парсит STEP файлы и конвертирует их в Three.js объекты
 */
export class StepLoader {
  /**
   * Создает экземпляр StepLoader
   */
  constructor() {
    this.occtModule = null;
    this.isLoading = false;
  }

  /**
   * Инициализирует occt-import-js модуль
   * @returns {Promise<void>}
   */
  async init() {
    if (this.occtModule) return;

    try {
      this.occtModule = await occt({
        locateFile: (path) => {
          if (path.endsWith('.wasm')) {
            return wasmUrl;
          }
          return path;
        }
      });
      console.log('OCCT module initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCCT module:', error);
      throw error;
    }
  }

  /**
   * Загружает STEP файл из File объекта
   * @param {File} file - файл для загрузки
   * @returns {Promise<THREE.Group>} Three.js группа с моделью
   */
  async loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const model = await this.parseStepData(arrayBuffer);
          resolve(model);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Загружает STEP файл по URL
   * @param {string} url - URL файла
   * @returns {Promise<THREE.Group>} Three.js группа с моделью
   */
  async loadFromUrl(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return await this.parseStepData(arrayBuffer);
    } catch (error) {
      console.error('Failed to load from URL:', error);
      throw error;
    }
  }

  /**
   * Парсит STEP данные и создает Three.js модель
   * @param {ArrayBuffer} arrayBuffer - бинарные данные STEP файла
   * @returns {Promise<THREE.Group>} Three.js группа с моделью
   */
  async parseStepData(arrayBuffer) {
    if (!this.occtModule) {
      throw new Error('OCCT module not initialized');
    }

    this.isLoading = true;

    try {
      // Параметры для качественной триангуляции (гладкие поверхности)
      const triangulationParams = {
        linearUnit: 'millimeter',
        linearDeflectionType: 'bounding_box_ratio',
        linearDeflection: 0.005, // Оптимальный баланс: достаточно гладко, но не перегружает память
        angularDeflection: 0.2
      };

      const result = this.occtModule.ReadStepFile(new Uint8Array(arrayBuffer), triangulationParams);

      if (!result || !result.meshes || result.meshes.length === 0) {
        throw new Error('No geometry found in STEP file');
      }

      const group = this.createModelFromMeshes(result.meshes);
      this.isLoading = false;
      return group;
    } catch (error) {
      this.isLoading = false;
      console.error('Failed to parse STEP data:', error);
      throw error;
    }
  }

  /**
   * Создает Three.js модель из массива мешей с НАСТОЯЩИМИ CAD-контурами
   * @param {Array} meshes - массив мешей из occt-import-js
   * @returns {THREE.Group} группа с Three.js объектами
   */
  createModelFromMeshes(meshes) {
    const group = new THREE.Group();

    meshes.forEach((mesh, index) => {
      const geometry = this.createGeometry(mesh);
      const material = this.createMaterial(mesh);
      const threeMesh = new THREE.Mesh(geometry, material);
      threeMesh.name = `mesh_${index}`;

      // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: thresholdAngle = 15 (градусов)
      // Это заставляет Three.js рисовать линии ТОЛЬКО на острых углах и границах,
      // полностью игнорируя мелкую внутреннюю сетку триангуляции.
      const edges = new THREE.EdgesGeometry(geometry, 15);

      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x000000, // Черный цвет, как в классических CAD-системах
        transparent: true,
        opacity: 0.9     // Высокая непрозрачность для четкости
      });

      const wireframe = new THREE.LineSegments(edges, lineMaterial);

      // Гарантируем, что линии рендерятся поверх полигонов модели
      wireframe.renderOrder = 1;
      threeMesh.add(wireframe);

      group.add(threeMesh);
    });

    return group;
  }

  /**
   * Создает Three.js геометрию из данных меша
   * @param {Object} meshData - данные меша из occt-import-js
   * @returns {THREE.BufferGeometry} Three.js геометрия
   */
  createGeometry(meshData) {
    const geometry = new THREE.BufferGeometry();

    if (meshData.attributes && meshData.attributes.position) {
      const positions = new Float32Array(meshData.attributes.position.array);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    }

    if (meshData.index) {
      const indices = new Uint32Array(meshData.index.array);
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    }

    geometry.computeVertexNormals();
    return geometry;
  }

  /**
   * Создает Three.js материал серого цвета
   * @param {Object} meshData - данные меша из occt-import-js
   * @returns {THREE.Material} Three.js материал
   */
  createMaterial(meshData) {
    const material = new THREE.MeshStandardMaterial({
      color: 0xbcbcbc,
      roughness: 0.6,
      metalness: 0.1,
      flatShading: false
    });

    return material;
  }

  /**
   * Возвращает статус загрузки
   * @returns {boolean} true если идет загрузка
   */
  getIsLoading() {
    return this.isLoading;
  }
}
