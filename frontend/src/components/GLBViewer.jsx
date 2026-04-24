import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// A lightweight wrapper that mounts a three.js scene and loads a glb model from
// the provided `url` prop. The camera is automatically positioned to fit the
// model in view. The component will only attempt to load after a valid URL is
// supplied; when the URL changes the previous model is removed and the new one
// is loaded.

function GLBViewer({ url }) {
  const mountRef = useRef(null);
  const modelRef = useRef(null);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!url || !mountNode) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    // use container dimensions so component can be sized via CSS
    const { clientWidth, clientHeight } = mountNode;
    renderer.setSize(clientWidth || window.innerWidth, clientHeight || window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // increase exposure for brighter overall result
    renderer.toneMappingExposure = 4.5; // 2.5
    renderer.setClearColor(0x000000, 0);
    mountNode.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    new RGBELoader()
      .setDataType(THREE.UnsignedByteType)
      .load(
        '/hdr/royal_esplanade_1k.hdr',
        (texture) => {
          const envMap = pmremGenerator.fromEquirectangular(texture).texture;
          scene.environment = envMap;
          scene.environmentIntensity = 3.5;
          texture.dispose();
          pmremGenerator.dispose();
        },
        undefined,
        (err) => console.error('HDR load error', err)
      );

    // lights
    // brighter ambient to lift shadows
    const ambient = new THREE.AmbientLight(0xffffff, 4.0);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 3.0);
    directional.position.set(5, 10, 7.5);
    scene.add(directional);
    const directional2 = new THREE.DirectionalLight(0xffffff, 3.0);
    directional2.position.set(-5, -10, -7.5);
    scene.add(directional2);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 2.0);
    scene.add(hemi);
    const point = new THREE.PointLight(0xffffff, 1.0);
    scene.add(point);
    const rearPoint = new THREE.PointLight(0xffffff, 0.8);
    scene.add(rearPoint);

    

    scene.background = null;

    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        if (modelRef.current) scene.remove(modelRef.current);
        modelRef.current = gltf.scene;

        // scale the model up slightly so it appears wider/larger
        const MODEL_SCALE = 6.0; // adjust as needed
        modelRef.current.scale.set(8.0, MODEL_SCALE, MODEL_SCALE);

        scene.add(modelRef.current);

        modelRef.current.traverse((child) => {
          if (child.isMesh && child.material) {
            const mat = child.material;
            if (Array.isArray(mat)) {
              mat.forEach((m) => {
                m.envMap = scene.environment;
                m.envMapIntensity = 1;
                m.needsUpdate = true;
              });
            } else {
              mat.envMap = scene.environment;
              mat.envMapIntensity = 1;
              mat.needsUpdate = true;
            }
          }
        });

        const box = new THREE.Box3().setFromObject(modelRef.current);
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const radius = sphere.radius;
        const fov = camera.fov * (Math.PI / 180);
        const distance = radius / Math.sin(fov / 2);
        camera.position.copy(
          sphere.center.clone().add(new THREE.Vector3(0, 0, distance * 1.2))
        );
        controls.target.copy(sphere.center);
        controls.update();
      },
      undefined,
      (err) => console.error('Error loading GLB:', err)
    );

    camera.position.z = 5;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.update();

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      point.position.copy(camera.position);
      const back = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      rearPoint.position.copy(camera.position).add(back.multiplyScalar(5));
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const { clientWidth: w, clientHeight: h } = mountNode;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountNode) {
        mountNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [url]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}

export default GLBViewer;
