import { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Html } from '@react-three/drei';

const Model = ({ url, onLoad, onError }) => {
  const { scene } = useGLTF(url);
  const ref = useRef();
  
  useEffect(() => {
    if (onLoad) onLoad(scene);
  }, [scene, onLoad]);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta;
    }
  });

  return <primitive ref={ref} object={scene} scale={1} />;
};

const ThumbnailRenderer = ({ url, size, onCapture, onError }) => {
  const [ready, setReady] = useState(false);
  const capturedRef = useRef(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || capturedRef.current) return;
    
    const captureTimeout = setTimeout(() => {
      if (!capturedRef.current && canvasRef.current) {
        try {
          const canvas = canvasRef.current.querySelector('canvas');
          if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            if (dataUrl && dataUrl.length > 100) {
              capturedRef.current = true;
              onCapture(dataUrl);
            }
          }
        } catch (err) {
          console.error('Manual capture error:', err);
          onError(err);
        }
      }
    }, 2000);

    return () => clearTimeout(captureTimeout);
  }, [ready, onCapture, onError]);

  const canvasRef = useRef();

  if (!url) return null;

  return (
    <div ref={canvasRef} style={{ width: size, height: size, position: 'absolute', top: -9999, left: -9999 }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ preserveDrawingBuffer: true, alpha: true, antialias: true }}
        onCreated={async ({ gl, scene, camera }) => {
          if (!ready || capturedRef.current) return;
          
          try {
            await new Promise(resolve => setTimeout(resolve, 1200));
            gl.render(scene, camera);
            const dataUrl = gl.domElement.toDataURL('image/png');
            if (dataUrl && dataUrl.length > 100) {
              capturedRef.current = true;
              onCapture(dataUrl);
            }
          } catch (err) {
            console.error('Canvas capture error:', err);
          }
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <Suspense fallback={<Html center>...</Html>}>
          <Model url={url} />
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
      </Canvas>
    </div>
  );
};

export const GLBThumbnail = ({ url, size = 150, className }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (url) {
      setLoading(true);
      setError(false);
      setThumbnailUrl(null);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [url]);

  useEffect(() => {
    if (loading && !error) {
      timeoutRef.current = setTimeout(() => {
        setError(true);
        setLoading(false);
      }, 8000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [loading, error]);

  const handleCapture = (dataUrl) => {
    if (dataUrl && dataUrl.startsWith('data:image')) {
      setThumbnailUrl(dataUrl);
      setLoading(false);
    } else {
      setError(true);
      setLoading(false);
    }
  };

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  if (error) {
    return (
      <div 
        className={className}
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #12121a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          fontSize: 12,
          color: '#9d00ff',
          border: '1px solid #9d00ff',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontWeight: 'bold'
        }}
      >
        GLB
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {loading && (
        <div 
          className={className}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #12121a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            color: '#00ff88',
            fontSize: 12,
            border: '1px solid #00ff88',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          Carregando...
        </div>
      )}
      {thumbnailUrl ? (
        <img 
          src={thumbnailUrl} 
          alt="Thumbnail"
          className={className}
          style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover', border: '1px solid #9d00ff' }}
        />
      ) : !error && (
        <ThumbnailRenderer 
          url={url} 
          size={size} 
          onCapture={handleCapture}
          onError={handleError}
        />
      )}
    </div>
  );
};

export default GLBThumbnail;
