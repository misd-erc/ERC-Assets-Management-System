import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types/auth';

export interface UploadProfilePictureResponse {
  fileStorageIdEncrypted: string;
}

export const uploadProfilePicture = async (
  file: File,
): Promise<string> => {
  const token = localStorage.getItem('sessionToken') || '';
  const systemUserId = localStorage.getItem('systemUserId') || '';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('ActionBySystemUserId', systemUserId);
  formData.append('SessionKey', token);

  const response = await axiosInstance.post(
    '/Storage/upload/user/profile-picture',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to upload profile picture');
  }

  return response.data.data.fileId as string;
};

export const retrieveFile = async (fileId: string): Promise<string> => {
  // Get session key from localStorage
  const token = localStorage.getItem('sessionToken') || '';
  const systemUserId = localStorage.getItem('systemUserId') || '';

  const response = await axiosInstance.get(
    `/Storage/retrieve/${fileId}?ActionBySystemUserId=${encodeURIComponent(systemUserId)}&SessionKey=${encodeURIComponent(token)}`,
    { responseType: 'blob' }
  );
  return URL.createObjectURL(response.data);
};

