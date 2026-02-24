import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const COLLECTIONS = {
  GALLERIES: 'galleries',
  ITEMS: 'items'
};

let demoGalleries = [];
let demoItems = [];

const loadDemoData = () => {
  if (typeof window !== 'undefined') {
    const g = localStorage.getItem('demo_galleries');
    const i = localStorage.getItem('demo_items');
    demoGalleries = g ? JSON.parse(g) : [];
    demoItems = i ? JSON.parse(i) : [];
  }
};

const saveDemoGalleries = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('demo_galleries', JSON.stringify(demoGalleries));
  }
};

const saveDemoItems = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('demo_items', JSON.stringify(demoItems));
  }
};

export const galleryService = {
  isDemoMode() {
    return !import.meta.env.VITE_FIREBASE_API_KEY || 
           import.meta.env.VITE_FIREBASE_API_KEY === 'your_api_key';
  },

  async createGallery(userId, name, description = '') {
    if (this.isDemoMode()) {
      loadDemoData();
      const gallery = {
        id: 'demo_' + Date.now(),
        userId,
        name,
        description,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      demoGalleries.unshift(gallery);
      saveDemoGalleries();
      return gallery;
    }

    const gallery = {
      userId,
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.GALLERIES), gallery);
    return { id: docRef.id, ...gallery };
  },

  async getGalleries(userId) {
    if (this.isDemoMode()) {
      loadDemoData();
      return demoGalleries.filter(g => g.userId === userId);
    }

    const q = query(
      collection(db, COLLECTIONS.GALLERIES),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getGallery(galleryId) {
    if (this.isDemoMode()) {
      loadDemoData();
      return demoGalleries.find(g => g.id === galleryId) || null;
    }

    const docRef = doc(db, COLLECTIONS.GALLERIES, galleryId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  },

  async updateGallery(galleryId, data) {
    if (this.isDemoMode()) {
      loadDemoData();
      const index = demoGalleries.findIndex(g => g.id === galleryId);
      if (index !== -1) {
        demoGalleries[index] = { ...demoGalleries[index], ...data, updatedAt: new Date() };
        saveDemoGalleries();
      }
      return;
    }

    const docRef = doc(db, COLLECTIONS.GALLERIES, galleryId);
    await updateDoc(docRef, { ...data, updatedAt: new Date() });
  },

  async deleteGallery(galleryId) {
    if (this.isDemoMode()) {
      loadDemoData();
      demoItems = demoItems.filter(i => i.galleryId !== galleryId);
      demoGalleries = demoGalleries.filter(g => g.id !== galleryId);
      saveDemoGalleries();
      saveDemoItems();
      return;
    }

    const items = await this.getItems(galleryId);
    for (const item of items) {
      if (item.thumbnailUrl) {
        try {
          const thumbRef = ref(storage, item.thumbnailUrl);
          await deleteObject(thumbRef);
        } catch (e) {}
      }
      if (item.glbUrl) {
        try {
          const fileRef = ref(storage, item.glbUrl);
          await deleteObject(fileRef);
        } catch (e) {}
      }
      await this.deleteItem(item.id);
    }
    const docRef = doc(db, COLLECTIONS.GALLERIES, galleryId);
    await deleteDoc(docRef);
  },

  async createItem(galleryId, file, thumbnailBlob) {
    if (this.isDemoMode()) {
      loadDemoData();
      const timestamp = Date.now();
      const item = {
        id: 'demo_item_' + timestamp,
        galleryId,
        name: file.name.replace('.glb', ''),
        fileName: file.name,
        glbUrl: URL.createObjectURL(file),
        thumbnailUrl: null,
        fileSize: file.size,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      demoItems.unshift(item);
      saveDemoItems();
      return item;
    }

    const userId = 'anonymous';
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    
    const fileRef = ref(storage, `glb/${userId}/${galleryId}/${fileName}`);
    await uploadBytes(fileRef, file);
    const glbUrl = await getDownloadURL(fileRef);

    let thumbnailUrl = null;
    if (thumbnailBlob) {
      const thumbName = `thumb_${fileName.replace('.glb', '.png')}`;
      const thumbRef = ref(storage, `thumbnails/${userId}/${galleryId}/${thumbName}`);
      await uploadBytes(thumbRef, thumbnailBlob);
      thumbnailUrl = await getDownloadURL(thumbRef);
    }

    const item = {
      galleryId,
      name: file.name.replace('.glb', ''),
      fileName: file.name,
      glbUrl,
      thumbnailUrl,
      fileSize: file.size,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.ITEMS), item);
    return { id: docRef.id, ...item };
  },

  async getItems(galleryId) {
    if (this.isDemoMode()) {
      loadDemoData();
      return demoItems.filter(i => i.galleryId === galleryId);
    }

    const q = query(
      collection(db, COLLECTIONS.ITEMS),
      where('galleryId', '==', galleryId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async updateItem(itemId, data) {
    if (this.isDemoMode()) {
      loadDemoData();
      const index = demoItems.findIndex(i => i.id === itemId);
      if (index !== -1) {
        demoItems[index] = { ...demoItems[index], ...data, updatedAt: new Date() };
        saveDemoItems();
      }
      return;
    }

    const docRef = doc(db, COLLECTIONS.ITEMS, itemId);
    await updateDoc(docRef, { ...data, updatedAt: new Date() });
  },

  async deleteItem(itemId) {
    if (this.isDemoMode()) {
      loadDemoData();
      demoItems = demoItems.filter(i => i.id !== itemId);
      saveDemoItems();
      return;
    }

    const docRef = doc(db, COLLECTIONS.ITEMS, itemId);
    await deleteDoc(docRef);
  },

  async uploadThumbnail(itemId, thumbnailBlob) {
    if (this.isDemoMode()) {
      return null;
    }

    const docRef = doc(db, COLLECTIONS.ITEMS, itemId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const item = docSnap.data();
    const timestamp = Date.now();
    const thumbName = `thumb_${timestamp}.png`;
    const userId = item.galleryId?.split('_')[0] || 'anonymous';
    
    const thumbRef = ref(storage, `thumbnails/${userId}/${item.galleryId}/${thumbName}`);
    await uploadBytes(thumbRef, thumbnailBlob);
    const thumbnailUrl = await getDownloadURL(thumbRef);

    await updateDoc(docRef, { thumbnailUrl, updatedAt: new Date() });
    return thumbnailUrl;
  }
};
