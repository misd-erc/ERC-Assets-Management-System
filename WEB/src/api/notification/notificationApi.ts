import axiosInstance from "@/lib/axios";
import { getAuthParams } from "@/utils/auth";
import {
  SystemNotification,
  SendNotificationPayload,
} from "@/types/notification";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const getMyNotifications = async (): Promise<SystemNotification[]> => {
  const { systemUserId, sessionKey } = getAuthParams();
  const response = await axiosInstance.get<ApiResponse<SystemNotification[]>>(
    `/Users/system-notification/my/${systemUserId}`,
    {
      params: {
        ActionBySystemUserId: systemUserId,
        SessionKey: sessionKey,
      },
    }
  );
  return response.data.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const { systemUserId, sessionKey } = getAuthParams();
  const response = await axiosInstance.get<
    ApiResponse<{ unreadCount: number }>
  >(`/Users/system-notification/unread-count/${systemUserId}`, {
    params: {
      ActionBySystemUserId: systemUserId,
      SessionKey: sessionKey,
    },
  });
  return response.data.data.unreadCount;
};

export const markNotificationAsRead = async (
  notificationId: number
): Promise<void> => {
  const { systemUserId, sessionKey } = getAuthParams();
  await axiosInstance.post("/Users/system-notification/mark-read", {
    actionBySystemUserId: systemUserId,
    sessionKey,
    notificationId,
  });
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  const { systemUserId, sessionKey } = getAuthParams();
  await axiosInstance.post("/Users/system-notification/mark-all-read", {
    actionBySystemUserId: systemUserId,
    sessionKey,
  });
};

export const deleteNotification = async (
  notificationId: number
): Promise<void> => {
  const { systemUserId, sessionKey } = getAuthParams();
  await axiosInstance.delete(
    `/Users/system-notification/${notificationId}/${systemUserId}`,
    {
      params: {
        ActionBySystemUserId: systemUserId,
        SessionKey: sessionKey,
      },
    }
  );
};

export const sendNotification = async (
  payload: Omit<SendNotificationPayload, "actionBySystemUserId" | "sessionKey">
): Promise<void> => {
  const { systemUserId, sessionKey } = getAuthParams();
  await axiosInstance.post("/Users/system-notification/send", {
    actionBySystemUserId: systemUserId,
    sessionKey,
    ...payload,
  });
};
