import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

const Model = ({ url, onLoad }) => {
  const { scene } = useGLTF(url);
  const ref = useRef();
  
  useEffect(() => {
    if (onLoad) onLoad(scene);
  }, [scene, onLoad]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.005;
    }
  });

  return <primitive ref={ref} object={scene} scale={1} />;
};

const ThumbnailRenderer = ({ url, width = 200, height = 200, onCapture }) => {
  const [ready, setReady] = useState(false);
  
  useEffect(() => {
    if (url && onCapture) {
      const timer = setTimeout(() => setReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [url, onCapture]);

  if (!url) return null;

  return (
    <div style={{ width, height, position: 'absolute', top: -9999, left: -9999 }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ preserveDrawingBuffer: true, alpha: true }}
        onCreated={async ({ gl, scene, camera }) => {
          if (!ready) return;
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          gl.render(scene, camera);
          const dataUrl = gl.domElement.toDataURL('image/png');
          if (onCapture) onCapture(dataUrl);
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <Model url={url} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
        <Environment preset="studio" />
      </Canvas>
    </div>
  );
};

export const GLBThumbnail = ({ url, size = 150, className }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleCapture = (dataUrl) => {
    setThumbnailUrl(dataUrl);
    setLoading(false);
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
          background: '#2d2d44',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          fontSize: 12,
          color: '#666'
        }}
      >
        GLB
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width, height: size }}>
      {loading && (
        <div 
          className={className}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            background: '#2d2d44',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            color: '#666',
            fontSize: 12
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
          style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover' }}
        />
      ) : (
        <ThumbnailRenderer 
          url={url} 
          width={size} 
          height={size} 
          onCapture={handleCapture} 
        />
      )}
    </div>
  );
};

export default GLBThumbnail;
