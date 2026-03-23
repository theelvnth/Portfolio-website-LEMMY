/**
 * 3D Jewelry Viewer V2 — Three.js + GLTFLoader
 * Loads .glb files with embedded PBR materials.
 * Supports: lightbox mode, card preview mode, display modes, fullscreen.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

class JewelryViewer {
    /**
     * @param {string} containerId - DOM element ID for the canvas
     * @param {string} modelPath - Path to .glb file
     * @param {object} options
     * @param {boolean} options.cardMode - If true, runs in preview-card mode (no controls, hover rotation)
     */
    constructor(containerId, modelPath, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.modelPath = modelPath;
        this.model = null;
        this.currentMode = 'shaded';
        this.cardMode = options.cardMode || false;
        this.originalMaterials = new Map();

        this.defaultCamera = {
            position: new THREE.Vector3(0, 0, 5),
            target: new THREE.Vector3(0, 0, 0)
        };

        this.init();
        this.loadModel();
        if (!this.cardMode) {
            this.animate();
        }
    }

    init() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        // Scene — light grey matching Sketchfab
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xe0e0e0);

        // Camera
        const fov = this.cardMode ? 40 : 35;
        this.camera = new THREE.PerspectiveCamera(fov, width / height, 0.01, 1000);
        this.camera.position.set(0, 4, 12);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.container.appendChild(this.renderer.domElement);

        // Studio environment for PBR metallic reflections
        // Background stays light grey — environment map is for reflections only
        this.envMap = this.createStudioEnvironment();
        this.scene.environment = this.envMap; // Global PBR environment lighting

        if (!this.cardMode) {
            // Orbit Controls
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.rotateSpeed = 0.6;
            this.controls.zoomSpeed = 0.8;
            this.controls.minDistance = 0.1;
            this.controls.maxDistance = 30;
            this.controls.enablePan = true;
            this.controls.autoRotate = false;
            this.controls.target.set(0, 0, 0);

            // Hide hint on first interaction
            this.controls.addEventListener('start', () => {
                const hint = document.getElementById('viewerHint');
                if (hint) hint.classList.add('hidden');
            });
        }

        // Lighting
        this.setupLighting();

        // Resize
        window.addEventListener('resize', () => this.onResize());
    }

    /**
     * Create a bright, neutral studio environment for clean metallic reflections.
     * No dark walls/floor — everything is bright so reflections reveal form, not black patches.
     */
    createStudioEnvironment() {
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        const roomEnv = new RoomEnvironment();
        const envMap = pmremGenerator.fromScene(roomEnv, 0.04).texture;
        roomEnv.dispose();
        pmremGenerator.dispose();
        return envMap;
    }

    setupLighting() {
        // Low ambient — let shadows exist to define form
        const ambient = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambient);

        // Strong key light — upper-front-right, creates main specular highlights
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
        keyLight.position.set(5, 8, 6);
        this.scene.add(keyLight);

        // Gentler fill — opens shadows without flattening
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.25);
        fillLight.position.set(-4, 3, 4);
        this.scene.add(fillLight);

        // Rim/back light — bright edge separation
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
        rimLight.position.set(-2, 4, -6);
        this.scene.add(rimLight);

        // Subtle bottom fill to prevent pure black undersides
        const bottomFill = new THREE.DirectionalLight(0xffffff, 0.1);
        bottomFill.position.set(0, -3, 2);
        this.scene.add(bottomFill);
    }

    loadModel() {
        const loader = new GLTFLoader();
        const loadingEl = document.getElementById('viewerLoading');

        loader.load(
            this.modelPath,
            (gltf) => {
                this.model = gltf.scene;

                // Calculate bounding box for centering + camera fit
                const box = new THREE.Box3().setFromObject(this.model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 3.0 / maxDim;

                this.model.position.sub(center);
                this.model.scale.setScalar(scale);

                // Store original materials and apply subtle env map
                this.model.traverse((child) => {
                    if (child.isMesh) {
                        // Store original material for mode switching
                        this.originalMaterials.set(child.uuid, child.material.clone());

                        // Apply subtle environment reflection
                        if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
                            child.material.envMap = this.envMap;
                            child.material.envMapIntensity = 0.5;
                            child.material.needsUpdate = true;
                        }
                    }
                });

                this.scene.add(this.model);

                // Recalculate after transform
                const newBox = new THREE.Box3().setFromObject(this.model);
                const newCenter = newBox.getCenter(new THREE.Vector3());

                if (!this.cardMode && this.controls) {
                    this.controls.target.copy(newCenter);
                    const distance = 8;
                    this.camera.position.set(
                        newCenter.x + distance * 0.3,
                        newCenter.y + distance * 0.25,
                        newCenter.z + distance * 0.65
                    );
                    this.controls.update();
                } else {
                    // Card mode — straight-on view
                    this.camera.position.set(0, 1, 6);
                    this.camera.lookAt(newCenter);
                }

                this.defaultCamera.position.copy(this.camera.position);
                this.defaultCamera.target.copy(newCenter);

                if (loadingEl) loadingEl.classList.add('hidden');

                // Render initial frame for card mode
                if (this.cardMode) {
                    this.renderer.render(this.scene, this.camera);
                }

                console.log(`Model loaded: ${this.modelPath} (${gltf.scene.children.length} root nodes)`);
            },
            (xhr) => {
                if (xhr.lengthComputable && loadingEl) {
                    const pct = Math.round((xhr.loaded / xhr.total) * 100);
                    const span = loadingEl.querySelector('span');
                    if (span) span.textContent = `Loading model... ${pct}%`;
                }
            },
            (error) => {
                console.error('Error loading model:', error);
                if (loadingEl) {
                    const span = loadingEl.querySelector('span');
                    if (span) span.textContent = 'Could not load 3D model';
                }
            }
        );
    }

    /**
     * Card mode: rotate model based on mouse position relative to card center
     */
    onCardHover(normalizedX, normalizedY) {
        if (!this.model || !this.cardMode) return;
        // Map -1..1 to rotation range (subtle)
        this.model.rotation.y = normalizedX * 0.4;
        this.model.rotation.x = normalizedY * 0.15;
        this.renderer.render(this.scene, this.camera);
    }

    onCardLeave() {
        if (!this.model || !this.cardMode) return;
        // Smoothly return to default (just snap for now, could TWEEN)
        this.model.rotation.y = 0;
        this.model.rotation.x = 0;
        this.renderer.render(this.scene, this.camera);
    }

    applyMode(mode) {
        if (!this.model) return;
        this.currentMode = mode;

        this.model.traverse((child) => {
            if (child.isMesh) {
                switch (mode) {
                    case 'shaded':
                        // Restore original glTF material
                        const original = this.originalMaterials.get(child.uuid);
                        if (original) {
                            child.material = original.clone();
                            child.material.envMap = this.envMap;
                            child.material.envMapIntensity = 0.5;
                            child.material.needsUpdate = true;
                        }
                        break;

                    case 'wireframe':
                        child.material = new THREE.MeshBasicMaterial({
                            color: 0x333333,
                            wireframe: true,
                            side: THREE.DoubleSide,
                        });
                        break;

                    case 'xray':
                        child.material = new THREE.MeshPhongMaterial({
                            color: 0x6699cc,
                            transparent: true,
                            opacity: 0.2,
                            side: THREE.DoubleSide,
                            depthWrite: false,
                        });
                        break;
                }
            }
        });
    }

    resetView() {
        if (this.controls) {
            this.camera.position.copy(this.defaultCamera.position);
            this.controls.target.copy(this.defaultCamera.target);
            this.controls.update();
        }
    }

    onResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (width === 0 || height === 0) return;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.controls) this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    show() {
        this.renderer.domElement.style.display = 'block';
        this.onResize();
    }

    hide() {
        this.renderer.domElement.style.display = 'none';
    }
}

// Export — initialization happens from jewelry.js
export { JewelryViewer };
