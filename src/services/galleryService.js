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
import { db, storage } from '../firebase/config';

const COLLECTIONS = {
  GALLERIES: 'galleries',
  ITEMS: 'items'
};

export const galleryService = {
  async createGallery(userId, name, description = '') {
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
    const q = query(
      collection(db, COLLECTIONS.GALLERIES),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getGallery(galleryId) {
    const docRef = doc(db, COLLECTIONS.GALLERIES, galleryId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  },

  async updateGallery(galleryId, data) {
    const docRef = doc(db, COLLECTIONS.GALLERIES, galleryId);
    await updateDoc(docRef, { ...data, updatedAt: new Date() });
  },

  async deleteGallery(galleryId) {
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
    const userId = file.uid || 'anonymous';
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
    const q = query(
      collection(db, COLLECTIONS.ITEMS),
      where('galleryId', '==', galleryId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async updateItem(itemId, data) {
    const docRef = doc(db, COLLECTIONS.ITEMS, itemId);
    await updateDoc(docRef, { ...data, updatedAt: new Date() });
  },

  async deleteItem(itemId) {
    const docRef = doc(db, COLLECTIONS.ITEMS, itemId);
    await deleteDoc(docRef);
  },

  async uploadThumbnail(itemId, thumbnailBlob) {
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
