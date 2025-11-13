// utils/uploadAvatar.js
import { API } from '../api';

export async function uploadAvatar(uri) {
  const form = new FormData();
  form.append('file', { uri, name: 'avatar.jpg', type: 'image/jpeg' });

  const { data } = await API.post('/files/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url; // เช่น "/uploads/xxxx.jpg"
}
