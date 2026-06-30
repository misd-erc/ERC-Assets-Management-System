import * as signalR from "@microsoft/signalr";
import { useChatStore } from "../store/useChatStore";
import { useNotificationStore } from "../store/notification";
import { ChatMessage, ChatGroup } from "../types/chat";
import { SystemNotification } from "../types/notification";

class SignalRService {
    private chatConnection: signalR.HubConnection | null = null;
    private notificationConnection: signalR.HubConnection | null = null;
    private registeredUserId: number | null = null;
    private joinedGroupIds = new Set<number>();

    private getHubBaseUrl(): string {
        const apiUrl = process.env.REACT_APP_API_URL || "https://localhost:7118/api";
        return apiUrl.endsWith("/api") ? apiUrl.slice(0, -4) : apiUrl;
    }

    public async startConnection(systemUserId: number) {
        await Promise.all([
            this.startChatConnection(systemUserId),
            this.startNotificationConnection(systemUserId),
        ]);
    }

    private async startChatConnection(systemUserId: number) {
        if (this.chatConnection) {
            if (this.chatConnection.state === signalR.HubConnectionState.Connected) {
                if (this.registeredUserId !== systemUserId) {
                    await this.chatConnection.invoke("RegisterUser", systemUserId).catch(console.error);
                    this.registeredUserId = systemUserId;
                }
                return;
            }
            if (
                this.chatConnection.state === signalR.HubConnectionState.Connecting ||
                this.chatConnection.state === signalR.HubConnectionState.Reconnecting
            ) {
                return;
            }
            await this.stopChatConnection();
        }

        const baseUrl = this.getHubBaseUrl();

        this.chatConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${baseUrl}/hubs/chat`)
            .withAutomaticReconnect()
            .build();

        this.chatConnection.onreconnected(async () => {
            if (this.registeredUserId !== null) {
                await this.chatConnection?.invoke("RegisterUser", this.registeredUserId).catch(console.error);
            }
            await Promise.all([...this.joinedGroupIds].map(groupId => this.joinGroup(groupId).catch(console.error)));
        });

        this.chatConnection.onclose(() => {
            this.registeredUserId = null;
        });

        try {
            await this.chatConnection.start();
            console.log("SignalR Chat Connected.");

            await this.chatConnection.invoke("RegisterUser", systemUserId);
            this.registeredUserId = systemUserId;

            this.chatConnection.on("ReceiveMessage", (message: ChatMessage) => {
                const store = useChatStore.getState();
                store.addMessage(message);
            });

            this.chatConnection.on("MessageUnsent", (messageId: number) => {
                const store = useChatStore.getState();
                store.updateMessageUnsent(messageId);
            });

            this.chatConnection.on("MessageRead", (payload: { messageId: number, systemUserId: number }) => {
                const store = useChatStore.getState();
                store.updateMessageRead(payload);
            });

            this.chatConnection.on("ReactionUpdated", (payload: { messageId: number, systemUserId: number, reactionType: string }) => {
                const store = useChatStore.getState();
                store.updateMessageReaction(payload);
            });

            this.chatConnection.on("ReactionRemoved", (payload: { messageId: number, systemUserId: number }) => {
                const store = useChatStore.getState();
                store.removeMessageReaction(payload);
            });

            this.chatConnection.on("GroupCreated", (group: ChatGroup) => {
                const store = useChatStore.getState();
                store.addGroup(group);
                this.joinGroup(group.id).catch(console.error);
            });

            this.chatConnection.on("LeftGroup", (groupId: number) => {
                this.leaveGroup(groupId).catch(console.error);
                const store = useChatStore.getState();
                store.removeGroup(groupId);
            });

            this.chatConnection.on("UserOnline", (userId: number) => {
                const store = useChatStore.getState();
                store.addOnlineUser(userId);
            });

            this.chatConnection.on("UserOffline", (userId: number) => {
                const store = useChatStore.getState();
                store.removeOnlineUser(userId);
            });

            this.chatConnection.on("OnlineUsersList", (users: number[]) => {
                const store = useChatStore.getState();
                store.setOnlineUsers(users);
            });

            this.chatConnection.on("UserTyping", (payload: { senderId: number, groupId?: number }) => {
                const store = useChatStore.getState();
                const chatKey = payload.groupId ? `group_${payload.groupId}` : `user_${payload.senderId}`;
                store.addTypingUser(chatKey, payload.senderId);
            });

            this.chatConnection.on("UserStoppedTyping", (payload: { senderId: number, groupId?: number }) => {
                const store = useChatStore.getState();
                const chatKey = payload.groupId ? `group_${payload.groupId}` : `user_${payload.senderId}`;
                store.removeTypingUser(chatKey, payload.senderId);
            });

            this.chatConnection.on("GroupDeleted", (groupId: number) => {
                const store = useChatStore.getState();
                store.removeGroup(groupId);
            });

            this.chatConnection.on("ConversationDeleted", (partnerUserId: number) => {
                const store = useChatStore.getState();
                store.removeConversation(partnerUserId);
            });

        } catch (err) {
            console.error("Error while starting SignalR Chat connection: " + err);
        }
    }

    private async startNotificationConnection(systemUserId: number) {
        if (this.notificationConnection) {
            if (this.notificationConnection.state === signalR.HubConnectionState.Connected) {
                return;
            }
            if (
                this.notificationConnection.state === signalR.HubConnectionState.Connecting ||
                this.notificationConnection.state === signalR.HubConnectionState.Reconnecting
            ) {
                return;
            }
            await this.stopNotificationConnection();
        }

        const baseUrl = this.getHubBaseUrl();

        this.notificationConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${baseUrl}/hubs/notification`)
            .withAutomaticReconnect()
            .build();

        this.notificationConnection.onreconnected(async () => {
            if (this.registeredUserId !== null) {
                await this.notificationConnection?.invoke("RegisterUser", this.registeredUserId).catch(console.error);
            }
        });

        try {
            await this.notificationConnection.start();
            console.log("SignalR Notification Connected.");

            await this.notificationConnection.invoke("RegisterUser", systemUserId);

            this.notificationConnection.on("ReceiveNotification", (notification: SystemNotification) => {
                const store = useNotificationStore.getState();
                store.addNotification(notification);
            });

        } catch (err) {
            console.error("Error while starting SignalR Notification connection: " + err);
        }
    }

    private async stopChatConnection() {
        if (this.chatConnection) {
            try {
                await this.chatConnection.stop();
            } catch (err) {
                console.warn("Error stopping SignalR Chat connection:", err);
            } finally {
                this.chatConnection = null;
            }
        }
    }

    private async stopNotificationConnection() {
        if (this.notificationConnection) {
            try {
                await this.notificationConnection.stop();
            } catch (err) {
                console.warn("Error stopping SignalR Notification connection:", err);
            } finally {
                this.hubConnection = null;
                this.registeredUserId = null;
            }
        }
    }

    public async joinGroup(groupId: number) {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke("JoinChatGroup", groupId);
        }
    }

    public async leaveGroup(groupId: number) {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke("LeaveChatGroup", groupId);
        }
    }

    public get connection() {
        return this.chatConnection;
    }

    public get notifConnection() {
        return this.notificationConnection;
    }

    public async sendTypingStarted(receiverId?: number, groupId?: number) {
        if (this.chatConnection && this.chatConnection.state === signalR.HubConnectionState.Connected) {
            await this.chatConnection.invoke("TypingStarted", receiverId || null, groupId || null);
        }
    }

    public async sendTypingStopped(receiverId?: number, groupId?: number) {
        if (this.chatConnection && this.chatConnection.state === signalR.HubConnectionState.Connected) {
            await this.chatConnection.invoke("TypingStopped", receiverId || null, groupId || null);
        }
    }
}

export const signalRService = new SignalRService();
