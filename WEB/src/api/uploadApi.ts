import axiosInstance from '../lib/axios';
import { ApiResponse } from '../types/auth';

export interface UploadProfilePictureResponse {
  fileStorageIdEncrypted: string;
}

export const uploadProfilePicture = async (
  file: File,
  systemUserIdEncrypted: string,
  actionBySystemUserIdEncrypted: string
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('systemUserIdEncrypted', systemUserIdEncrypted);
  formData.append('actionBySystemUserIdEncrypted', actionBySystemUserIdEncrypted);

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

export const retrieveFile = async (fileStorageIdEncrypted: string): Promise<string> => {
  const response = await axiosInstance.get(
    `/Storage/retrieve/${encodeURIComponent(fileStorageIdEncrypted)}`,
    {
      responseType: 'blob', // Assuming the response is a blob for the image
    }
  );

  // Convert blob to object URL
  const blob = new Blob([response.data], { type: response.headers['content-type'] });
  return URL.createObjectURL(blob);
};
