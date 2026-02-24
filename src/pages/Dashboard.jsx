import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { galleryService } from '../services/galleryService';
import './Dashboard.css';

const Dashboard = () => {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newGallery, setNewGallery] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadGalleries();
  }, [user]);

  const loadGalleries = async () => {
    if (!user) return;
    try {
      const data = await galleryService.getGalleries(user.uid);
      setGalleries(data);
    } catch (error) {
      console.error('Error loading galleries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGallery = async (e) => {
    e.preventDefault();
    if (!newGallery.name.trim()) return;
    
    setSubmitting(true);
    try {
      const gallery = await galleryService.createGallery(user.uid, newGallery.name, newGallery.description);
      setGalleries([gallery, ...galleries]);
      setShowModal(false);
      setNewGallery({ name: '', description: '' });
      navigate(`/gallery/${gallery.id}`);
    } catch (error) {
      console.error('Error creating gallery:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGallery = async (e, galleryId) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir esta galeria?')) return;
    
    try {
      await galleryService.deleteGallery(galleryId);
      setGalleries(galleries.filter(g => g.id !== galleryId));
    } catch (error) {
      console.error('Error deleting gallery:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date.seconds * 1000).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Carregando galerias...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Minhas Galerias</h1>
          <span className="user-email">{user?.email}</span>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Nova Galeria
          </button>
          <button className="btn-secondary" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {galleries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h2>Nenhuma galeria ainda</h2>
            <p>Crie sua primeira galeria para organizar seus modelos 3D</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              Criar Galeria
            </button>
          </div>
        ) : (
          <div className="gallery-grid">
            {galleries.map(gallery => (
              <div 
                key={gallery.id} 
                className="gallery-card"
                onClick={() => navigate(`/gallery/${gallery.id}`)}
              >
                <div className="gallery-icon">🗂️</div>
                <div className="gallery-info">
                  <h3>{gallery.name}</h3>
                  {gallery.description && <p>{gallery.description}</p>}
                  <span className="gallery-date">
                    Atualizado em {formatDate(gallery.updatedAt)}
                  </span>
                </div>
                <button 
                  className="gallery-delete"
                  onClick={(e) => handleDeleteGallery(e, gallery.id)}
                  title="Excluir"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Nova Galeria</h2>
            <form onSubmit={handleCreateGallery}>
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  value={newGallery.name}
                  onChange={e => setNewGallery({...newGallery, name: e.target.value})}
                  placeholder="Minha Galeria"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Descrição (opcional)</label>
                <textarea
                  value={newGallery.description}
                  onChange={e => setNewGallery({...newGallery, description: e.target.value})}
                  placeholder="Descrição da galeria..."
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
