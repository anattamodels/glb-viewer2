import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Center, useAnimations } from '@react-three/drei';
import { GLTFExporter } from 'three-stdlib';
import * as THREE from 'three';

// --- Componente do Modelo ---
function Model({ url, color, wireframe, setCurrentAnim, currentAnim }) {
  const group = useRef();
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    if (names.length > 0 && names[0] !== currentAnim) {
      setCurrentAnim(names[0]);
    }
  }, [names]);

  useEffect(() => {
    if (currentAnim && actions && actions[currentAnim]) {
      actions[currentAnim].reset().fadeIn(0.5).play();
      return () => {
        if (actions[currentAnim]) actions[currentAnim].fadeOut(0.5);
      };
    }
  }, [currentAnim, actions]);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.wireframe = wireframe;
        if (color) child.material.color = new THREE.Color(color);
      }
    });
  }, [scene, color, wireframe]);

  return <primitive ref={group} object={scene} scale={1} />;
}

// --- Ações da Cena ---
function SceneController({ triggerSnapshot, triggerExport }) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    if (triggerSnapshot > 0) {
      gl.render(scene, camera);
      const link = document.createElement('a');
      link.download = 'snapshot.png';
      link.href = gl.domElement.toDataURL('image/png');
      link.click();
    }
  }, [triggerSnapshot, gl, scene, camera]);

  useEffect(() => {
    if (triggerExport > 0) {
      const exporter = new GLTFExporter();
      exporter.parse(
        scene,
        (result) => {
          const blob = new Blob([result], { type: 'application/octet-stream' });
          const link = document.createElement('a');
          link.download = 'modelo_editado.glb';
          link.href = URL.createObjectURL(blob);
          link.click();
        },
        (error) => console.error(error),
        { binary: true }
      );
    }
  }, [triggerExport, scene]);

  return null;
}

// --- App Principal ---
export default function App() {
  const [modelUrl, setModelUrl] = useState(null);
  const [animList, setAnimList] = useState([]);
  const [currentAnim, setCurrentAnim] = useState(null);
  const [editColor, setEditColor] = useState('#ffffff');
  const [wireframe, setWireframe] = useState(false);
  const [exportSignal, setExportSignal] = useState(0);
  const [snapshotSignal, setSnapshotSignal] = useState(0);

  // Referência agora aponta para o CONTAINER PRINCIPAL
  const containerRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setModelUrl(url);
      setAnimList([]);
      setCurrentAnim(null);
    }
  };

  // Função dedicada para Tela Cheia
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        if (containerRef.current) {
            containerRef.current.requestFullscreen();
        }
    } else {
        document.exitFullscreen();
    }
  };

  return (
    // REF MOVIDO PARA AQUI: Engloba Sidebar + Canvas
    <div ref={containerRef} style={styles.container}>

      <aside style={styles.sidebar}>
        <h3>🛠️ GLB Viewer</h3>
        <div style={styles.section}>
          <label style={styles.btnAdd}>
            ➕ Carregar GLB
            <input type="file" accept=".glb,.gltf" hidden onChange={handleFileChange} />
          </label>
        </div>

        {modelUrl && (
          <>
            <div style={styles.section}>
              <label style={styles.label}>Cor/Tonalidade:</label>
              <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} style={styles.colorPicker} />
            </div>

            <div style={styles.section}>
              <label style={styles.labelCheckbox}>
                <input type="checkbox" checked={wireframe} onChange={(e) => setWireframe(e.target.checked)} />
                Modo Wireframe
              </label>
            </div>

            {animList.length > 0 && (
              <div style={styles.section}>
                <label style={styles.label}>Animações:</label>
                <div style={styles.animBtnGroup}>
                  {animList.map((name) => (
                    <button key={name} onClick={() => setCurrentAnim(name)} style={{...styles.animBtn, backgroundColor: currentAnim === name ? '#4CAF50' : '#555'}}>
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <hr style={{ border: '1px solid #444', width: '100%' }} />

            <div style={styles.section}>
              <button onClick={() => setSnapshotSignal(s => s + 1)} style={styles.btnAction}>📷 Snapshot</button>
              <button onClick={() => setExportSignal(s => s + 1)} style={styles.btnAction}>💾 Exportar GLB</button>
              <button onClick={toggleFullscreen} style={styles.btnAction}>⛶ Tela Cheia</button>
            </div>
          </>
        )}
      </aside>

      <div style={styles.canvasArea}>
        <Canvas camera={{ position: [0, 1, 4], fov: 50 }} gl={{ preserveDrawingBuffer: true }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} />
          <Suspense fallback={null}>
            {modelUrl && (
              <Center>
                <Model url={modelUrl} color={editColor} wireframe={wireframe} setCurrentAnim={(name) => { if(!animList.includes(name)) setAnimList(prev => [...prev, name]); setCurrentAnim(name); }} currentAnim={currentAnim} />
              </Center>
            )}
          </Suspense>
          <OrbitControls makeDefault />
          <Environment preset="sunset" background={false} />
          <SceneController triggerSnapshot={snapshotSignal} triggerExport={exportSignal} />
        </Canvas>
        {!modelUrl && <div style={styles.placeholder}><h2>Selecione um arquivo GLB</h2></div>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    background: '#202020',
    color: 'white',
    fontFamily: 'sans-serif',
  },
  sidebar: {
    width: '260px',
    minWidth: '260px', // Garante que não encolha
    background: '#2c2c2c',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    borderRight: '1px solid #444',
    zIndex: 10,
    overflowY: 'auto',
  },
  canvasArea: {
    flex: 1,
    position: 'relative',
    height: '100%', // Garante altura total
  },
  section: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.9rem', color: '#aaa' },
  labelCheckbox: { fontSize: '0.9rem', color: '#ccc', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  btnAdd: { background: '#4CAF50', padding: '12px', borderRadius: '5px', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', color: 'white' },
  btnAction: { background: '#333', border: '1px solid #444', color: 'white', padding: '10px', borderRadius: '5px', cursor: 'pointer', textAlign: 'left', transition: '0.2s', fontSize: '1rem' },
  colorPicker: { width: '100%', height: '40px', border: 'none', cursor: 'pointer', background: 'none' },
  animBtnGroup: { display: 'flex', flexWrap: 'wrap', gap: '5px' },
  animBtn: { fontSize: '0.8rem', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white', transition: '0.2s' },
  placeholder: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', color: '#666' }
};
