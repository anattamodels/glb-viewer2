import { useRef, useState, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Center, useGLTF } from '@react-three/drei';
import { useAuth } from '../context/AuthContext';

function Model({ url, color, wireframe }) {
  const { scene } = useGLTF(url);
  
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.wireframe = wireframe;
        if (color) child.material.color.set(color);
      }
    });
  }, [scene, color, wireframe]);

  return <primitive object={scene} scale={1} />;
}

const Landing = () => {
  const [modelUrl, setModelUrl] = useState(null);
  const [editColor, setEditColor] = useState('#ffffff');
  const [wireframe, setWireframe] = useState(false);
  const containerRef = useRef(null);
  const { user, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setModelUrl(url);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div ref={containerRef} style={styles.container}>
      <header style={styles.header}>
        <h3 style={{ margin: 0 }}>🛠️ GLB Viewer</h3>
        <div style={styles.headerButtons}>
          {user ? (
            <button style={styles.btnPrimary} onClick={() => navigate('/dashboard')}>
              Minhas Galerias
            </button>
          ) : (
            <button style={styles.btnPrimary} onClick={() => navigate('/login')}>
              Entrar / Cadastrar
            </button>
          )}
          {isDemoMode && <span style={styles.demoBadge}>DEMO</span>}
        </div>
      </header>

      <aside style={styles.sidebar}>
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
              <input 
                type="color" 
                value={editColor} 
                onChange={(e) => setEditColor(e.target.value)} 
                style={styles.colorPicker} 
              />
            </div>

            <div style={styles.section}>
              <label style={styles.labelCheckbox}>
                <input 
                  type="checkbox" 
                  checked={wireframe} 
                  onChange={(e) => setWireframe(e.target.checked)} 
                />
                Modo Wireframe
              </label>
            </div>

            <hr style={{ border: '1px solid #444', width: '100%' }} />

            <div style={styles.section}>
              <button onClick={toggleFullscreen} style={styles.btnAction}>
                ⛶ Tela Cheia
              </button>
            </div>
          </>
        )}
      </aside>

      <div style={styles.canvasArea}>
        <Canvas camera={{ position: [0, 1, 4], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} />
          <Suspense fallback={null}>
            {modelUrl && (
              <Center>
                <Model url={modelUrl} color={editColor} wireframe={wireframe} />
              </Center>
            )}
          </Suspense>
          <OrbitControls makeDefault />
          <Environment preset="sunset" background={false} />
        </Canvas>
        {!modelUrl && (
          <div style={styles.placeholder}>
            <h2>Selecione um arquivo GLB</h2>
            <p>Use o botão "Carregar GLB" para começar</p>
            {!user && (
              <button 
                style={{...styles.btnPrimary, marginTop: 20}}
                onClick={() => navigate('/login')}
              >
                Entrar para criar galerias
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    background: '#0a0a0f',
    color: 'white',
    fontFamily: 'sans-serif',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    background: 'linear-gradient(180deg, #12121a 0%, #0a0a0f 100%)',
    borderBottom: '2px solid #9d00ff',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    boxShadow: '0 2px 20px rgba(157, 0, 255, 0.2)',
  },
  headerButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  btnPrimary: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #9d00ff 0%, #7b00c9 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    boxShadow: '0 0 15px rgba(157, 0, 255, 0.4)',
  },
  demoBadge: {
    background: '#00ff88',
    color: '#000',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  sidebar: {
    position: 'fixed',
    top: '52px',
    left: 0,
    bottom: 0,
    width: '220px',
    background: 'linear-gradient(180deg, #1a1a2e 0%, #12121a 100%)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    borderRight: '2px solid #9d00ff',
    zIndex: 10,
    overflowY: 'auto',
    boxShadow: '5px 0 30px rgba(157, 0, 255, 0.1)',
  },
  canvasArea: {
    flex: 1,
    position: 'relative',
    height: 'calc(100vh - 52px)',
    marginTop: '52px',
    marginLeft: '220px',
  },
  section: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.9rem', color: '#00ff88', textTransform: 'uppercase', letterSpacing: '1px' },
  labelCheckbox: { fontSize: '0.9rem', color: '#ccc', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  btnAdd: { background: 'linear-gradient(135deg, #9d00ff 0%, #7b00c9 100%)', padding: '12px', borderRadius: '5px', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', color: 'white', display: 'block', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 0 15px rgba(157, 0, 255, 0.4)' },
  btnAction: { background: 'transparent', border: '2px solid #00ff88', color: '#00ff88', padding: '10px', borderRadius: '5px', cursor: 'pointer', textAlign: 'left', transition: '0.2s', fontSize: '1rem', width: '100%', textTransform: 'uppercase', letterSpacing: '1px' },
  colorPicker: { width: '100%', height: '40px', border: 'none', cursor: 'pointer', background: 'none' },
  placeholder: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }
};

export default Landing;
