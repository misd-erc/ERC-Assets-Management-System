import axiosInstance from '../lib/axios';
import { ApiResponse } from '../types/auth';

export interface UploadProfilePictureResponse {
  fileStorageIdEncrypted: string;
}

export const uploadProfilePicture = async (
  file: File,
  userId: string,
  token: string
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('ActionBySystemUserId ', userId);
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

  return response.data.data.fileIdEncrypted as string;
};

export const retrieveFile = async (fileStorageId: string, token: string): Promise<string> => {
  // Get session key from localStorage
  const sessionKey = localStorage.getItem('sessionToken') || '';

  const response = await axiosInstance.get(
    `/Storage/retrieve/${fileStorageId}?ActionBySystemUserId=${encodeURIComponent(token)}&SessionKey=${encodeURIComponent(sessionKey)}`,
    {
      responseType: 'blob', // Assuming the response is a blob for the image
    }
  );

  // Convert blob to object URL
  const blob = new Blob([response.data], { type: response.headers['content-type'] });
  return URL.createObjectURL(blob);
};
