import { supabase } from '../supabase/config';

const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || 
                   import.meta.env.VITE_SUPABASE_URL === '';

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
    return isDemoMode;
  },

  async createGallery(userId, name, description = '') {
    
    
    if (this.isDemoMode()) {
      loadDemoData();
      const gallery = {
        id: 'demo_' + Date.now(),
        userId,
        name,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      demoGalleries.unshift(gallery);
      saveDemoGalleries();
      return gallery;
    }

    try {
      const { data, error } = await supabase
        .from('galleries')
        .insert([{
          user_id: userId,
          name,
          description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating gallery:', error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Error in createGallery:', err);
      throw err;
    }
  },

  async getGalleries(userId) {
    
    
    if (this.isDemoMode()) {
      loadDemoData();
      return demoGalleries.filter(g => g.userId === userId);
    }

    try {
      const { data, error } = await supabase
        .from('galleries')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Supabase error getting galleries:', error);
        throw error;
      }
      
      return data || [];
    } catch (err) {
      console.error('Error in getGalleries:', err);
      return [];
    }
  },

  async getGallery(galleryId) {
    
    
    if (this.isDemoMode()) {
      loadDemoData();
      return demoGalleries.find(g => g.id === galleryId) || null;
    }

    try {
      const { data, error } = await supabase
        .from('galleries')
        .select('*')
        .eq('id', galleryId)
        .single();

      if (error) {
        console.error('Supabase error getting gallery:', error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('Error in getGallery:', err);
      return null;
    }
  },

  async updateGallery(galleryId, data) {
    if (this.isDemoMode()) {
      loadDemoData();
      const index = demoGalleries.findIndex(g => g.id === galleryId);
      if (index !== -1) {
        demoGalleries[index] = { ...demoGalleries[index], ...data, updated_at: new Date().toISOString() };
        saveDemoGalleries();
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('galleries')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', galleryId);

      if (error) throw error;
    } catch (err) {
      console.error('Error in updateGallery:', err);
    }
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

    try {
      const { data: items } = await this.getItems(galleryId);
      for (const item of items || []) {
        if (item.glb_url) {
          try {
            const path = item.glb_url.split('/storage/v1/object/public/glb-files/')[1];
            if (path) await supabase.storage.from('glb-files').remove([path]);
          } catch (e) {}
        }
        if (item.thumbnail_url) {
          try {
            const path = item.thumbnail_url.split('/storage/v1/object/public/glb-files/')[1];
            if (path) await supabase.storage.from('glb-files').remove([path]);
          } catch (e) {}
        }
        await this.deleteItem(item.id);
      }

      const { error } = await supabase
        .from('galleries')
        .delete()
        .eq('id', galleryId);

      if (error) throw error;
    } catch (err) {
      console.error('Error in deleteGallery:', err);
    }
  },

  async createItem(galleryId, file, thumbnailBlob, userId = 'anonymous') {
    
    
    if (this.isDemoMode()) {
      loadDemoData();
      const timestamp = Date.now();
      const item = {
        id: 'demo_item_' + timestamp,
        gallery_id: galleryId,
        name: file.name.replace('.glb', ''),
        file_name: file.name,
        glb_url: URL.createObjectURL(file),
        thumbnail_url: null,
        file_size: file.size,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      demoItems.unshift(item);
      saveDemoItems();
      return item;
    }

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `glb/${userId}/${galleryId}/${fileName}`;
      
      
      
      const { error: uploadError } = await supabase.storage
        .from('glb-files')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('glb-files')
        .getPublicUrl(filePath);
      const glbUrl = urlData?.publicUrl || `https://ngnjgjyxqiufiqgwdixf.supabase.co/storage/v1/object/public/glb-files/${filePath}`;

      

      let thumbnailUrl = null;
      if (thumbnailBlob) {
        const thumbName = `thumb_${fileName.replace('.glb', '.png')}`;
        const thumbPath = `thumbnails/${userId}/${galleryId}/${thumbName}`;
        
        const { error: thumbError } = await supabase.storage
          .from('glb-files')
          .upload(thumbPath, thumbnailBlob);

        if (!thumbError) {
          const { data: thumbUrlData } = supabase.storage.from('glb-files').getPublicUrl(thumbPath);
          thumbnailUrl = thumbUrlData?.publicUrl || `https://ngnjgjyxqiufiqgwdixf.supabase.co/storage/v1/object/public/glb-files/${thumbPath}`;
        }
      }

      const item = {
        gallery_id: galleryId,
        name: file.name.replace('.glb', ''),
        file_name: file.name,
        glb_url: glbUrl,
        thumbnail_url: thumbnailUrl,
        file_size: file.size,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      

      const { data, error } = await supabase
        .from('items')
        .insert([item])
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }
      
      
      return data;
    } catch (err) {
      console.error('Error in createItem:', err);
      throw err;
    }
  },

  async getItems(galleryId) {
    
    
    if (this.isDemoMode()) {
      loadDemoData();
      return demoItems.filter(i => i.gallery_id === galleryId);
    }

    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('gallery_id', galleryId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error getting items:', error);
        throw error;
      }
      
      return data || [];
    } catch (err) {
      console.error('Error in getItems:', err);
      return [];
    }
  },

  async updateItem(itemId, data) {
    if (this.isDemoMode()) {
      loadDemoData();
      const index = demoItems.findIndex(i => i.id === itemId);
      if (index !== -1) {
        demoItems[index] = { ...demoItems[index], ...data, updated_at: new Date().toISOString() };
        saveDemoItems();
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('items')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', itemId);

      if (error) throw error;
    } catch (err) {
      console.error('Error in updateItem:', err);
    }
  },

  async deleteItem(itemId) {
    if (this.isDemoMode()) {
      loadDemoData();
      demoItems = demoItems.filter(i => i.id !== itemId);
      saveDemoItems();
      return;
    }

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    } catch (err) {
      console.error('Error in deleteItem:', err);
    }
  },

  async uploadThumbnail(itemId, thumbnailBlob) {
    if (this.isDemoMode()) {
      return null;
    }

    try {
      const { data: item, error: getError } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (getError || !item) return null;

      const timestamp = Date.now();
      const thumbName = `thumb_${timestamp}.png`;
      const userId = item.gallery_id?.split('_')[0] || 'anonymous';
      const thumbPath = `thumbnails/${userId}/${item.gallery_id}/${thumbName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('glb-files')
        .upload(thumbPath, thumbnailBlob);

      if (uploadError) return null;

      const { data: thumbUrlData } = supabase.storage.from('glb-files').getPublicUrl(thumbPath);
      const thumbnailUrl = thumbUrlData?.publicUrl || `https://ngnjgjyxqiufiqgwdixf.supabase.co/storage/v1/object/public/glb-files/${thumbPath}`;

      await this.updateItem(itemId, { thumbnail_url: thumbnailUrl });
      return thumbnailUrl;
    } catch (err) {
      console.error('Error in uploadThumbnail:', err);
      return null;
    }
  }
};
