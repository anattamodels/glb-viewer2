import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { galleryService } from '../services/galleryService';
import { GLBThumbnail } from '../components/GLBThumbnail';
import './Gallery.css';

const Gallery = () => {
  const { id: galleryId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [gallery, setGallery] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadGallery();
    loadItems();
  }, [galleryId]);

  const loadGallery = async () => {
    try {
      
      const data = await galleryService.getGallery(galleryId);
      
      if (!data) {
        navigate('/dashboard');
        return;
      }
      setGallery(data);
    } catch (error) {
      console.error('Error loading gallery:', error);
    }
  };

  const loadItems = async () => {
    try {
      
      const data = await galleryService.getItems(galleryId);
      
      setItems(data || []);
    } catch (error) {
      console.error('Error loading items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        if (!file.name.toLowerCase().endsWith('.glb')) {
          alert(`Arquivo "${file.name}" não é um arquivo GLB válido`);
          continue;
        }
        
        const item = await galleryService.createItem(galleryId, file, null, user?.id);
        if (item) {
          setItems(prev => [item, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Erro ao fazer upload: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    
    try {
      await galleryService.deleteItem(itemId);
      setItems(items.filter(i => i.id !== itemId));
      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleRename = async (itemId) => {
    if (!editName.trim()) return;
    
    try {
      await galleryService.updateItem(itemId, { name: editName });
      setItems(items.map(i => i.id === itemId ? { ...i, name: editName } : i));
      if (selectedItem?.id === itemId) {
        setSelectedItem({ ...selectedItem, name: editName });
      }
      setEditingItem(null);
      setEditName('');
    } catch (error) {
      console.error('Error renaming item:', error);
    }
  };

  const handleUpdateGallery = async (e) => {
    e.preventDefault();
    if (!gallery.name.trim()) return;
    
    try {
      await galleryService.updateGallery(galleryId, {
        name: gallery.name,
        description: gallery.description
      });
    } catch (error) {
      console.error('Error updating gallery:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="gallery-loading">
        <div className="spinner"></div>
        <p>Carregando galeria...</p>
      </div>
    );
  }

  return (
    <div className="gallery-page">
      <header className="gallery-header">
        <div className="header-left">
          <button className="home-btn" onClick={() => navigate('/')} title="Home">
            🏠
          </button>
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Voltar
          </button>
          <div className="gallery-title">
            <input
              type="text"
              value={gallery?.name || ''}
              onChange={(e) => setGallery({ ...gallery, name: e.target.value })}
              onBlur={handleUpdateGallery}
              className="title-input"
            />
          </div>
        </div>
        <div className="header-right">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".glb"
            multiple
            style={{ display: 'none' }}
          />
          <button 
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Enviando...' : '+ Adicionar GLB'}
          </button>
        </div>
      </header>

      <div className="gallery-content">
        <div className="items-grid">
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>Nenhum modelo ainda</h3>
              <p>Adicione seus arquivos GLB para começar</p>
              <button 
                className="btn-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                Adicionar GLB
              </button>
            </div>
          ) : (
            items.map(item => (
              <div 
                key={item.id} 
                className={`item-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="item-thumbnail">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.name} />
                  ) : (
                    <GLBThumbnail url={item.glb_url} size={160} />
                  )}
                </div>
                <div className="item-info">
                  {editingItem === item.id ? (
                    <div className="edit-name" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(item.id)}
                        autoFocus
                      />
                      <button onClick={() => handleRename(item.id)}>✓</button>
                      <button onClick={() => setEditingItem(null)}>✕</button>
                    </div>
                  ) : (
                    <h4>{item.name}</h4>
                  )}
                  <span className="item-size">{formatFileSize(item.file_size)}</span>
                </div>
                <div className="item-actions" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => {
                      setEditingItem(item.id);
                      setEditName(item.name);
                    }}
                    title="Renomear"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDeleteItem(item.id)}
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedItem && (
          <div className={`viewer-panel ${isFullscreen ? 'fullscreen' : ''}`}>
            <div className="viewer-header">
              <h3>{selectedItem.name}</h3>
              <div className="viewer-actions">
                <button onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}>
                  {isFullscreen ? '⛶' : '⛶'}
                </button>
                <button onClick={() => setSelectedItem(null)}>✕</button>
              </div>
            </div>
            <div className="viewer-content">
              <GLBViewer url={selectedItem.glb_url} isFullscreen={isFullscreen} />
            </div>
            <div className="viewer-info">
              <p>Arquivo: {selectedItem.file_name}</p>
              <p>Tamanho: {formatFileSize(selectedItem.file_size)}</p>
              <a 
                href={selectedItem.glb_url} 
                download={selectedItem.file_name}
                className="download-btn"
              >
                Download
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const GLBViewer = ({ url, isFullscreen }) => {
  if (!url) {
    return (
      <div className="glb-viewer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
        Nenhum modelo carregado
      </div>
    );
  }

  return (
    <div className="glb-viewer" style={{ width: '100%', height: isFullscreen ? '100vh' : '100%', minHeight: isFullscreen ? '100vh' : '300px', background: '#1a1a2e' }}>
      <model-viewer
        src={url}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        tone-mapping="neutral"
        shadow-intensity="1"
        auto-rotate
        camera-orbit="45deg 55deg 2.5m"
        style={{ width: '100%', height: '100%' }}
      >
        <div className="progress-bar hide" slot="progress-bar">
          <div className="update-bar"></div>
        </div>
        <button slot="ar-button" id="ar-button">
          View in your space
        </button>
      </model-viewer>
    </div>
  );
};

export default Gallery;
