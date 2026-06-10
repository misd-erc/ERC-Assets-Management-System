import * as signalR from "@microsoft/signalr";
import { useChatStore } from "../store/useChatStore";
import { ChatMessage, ChatGroup } from "../types/chat";

class SignalRService {
    private hubConnection: signalR.HubConnection | null = null;
    private registeredUserId: number | null = null;

    /**
     * Derives the hub base URL from the API URL env var.
     * REACT_APP_API_URL typically ends with "/api" (e.g. "http://localhost:7702/api"),
     * but the SignalR hub is mapped at "/hubs/chat" (without "/api"), so we strip it.
     */
    private getHubBaseUrl(): string {
        const apiUrl = process.env.REACT_APP_API_URL || "https://localhost:7118/api";
        // Remove trailing "/api" if present so the hub URL resolves correctly
        return apiUrl.endsWith("/api") ? apiUrl.slice(0, -4) : apiUrl;
    }

    public async startConnection(systemUserId: number) {
        // Guard: if already connected for the same user, just re-register to be safe
        if (this.hubConnection) {
            if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
                if (this.registeredUserId !== systemUserId) {
                    await this.hubConnection.invoke("RegisterUser", systemUserId).catch(console.error);
                    this.registeredUserId = systemUserId;
                }
                return;
            }
            // If still connecting/reconnecting, do nothing and let it finish
            if (
                this.hubConnection.state === signalR.HubConnectionState.Connecting ||
                this.hubConnection.state === signalR.HubConnectionState.Reconnecting
            ) {
                return;
            }
            // Otherwise (disconnected/stopped), clean up before recreating
            await this.stopConnection();
        }

        const baseUrl = this.getHubBaseUrl();

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${baseUrl}/hubs/chat`)
            .withAutomaticReconnect()
            .build();

        // Re-register user after automatic reconnect so messages keep arriving
        this.hubConnection.onreconnected(async (connectionId) => {
            console.log("SignalR Reconnected:", connectionId);
            if (this.registeredUserId !== null) {
                await this.hubConnection?.invoke("RegisterUser", this.registeredUserId).catch(console.error);
            }
        });

        // Clear registration state when fully disconnected
        this.hubConnection.onclose(() => {
            console.log("SignalR connection closed.");
            this.registeredUserId = null;
        });

        try {
            await this.hubConnection.start();
            console.log("SignalR Connected.");

            // Register user
            await this.hubConnection.invoke("RegisterUser", systemUserId);
            this.registeredUserId = systemUserId;

            // --- Event Handlers ---

            this.hubConnection.on("ReceiveMessage", (message: ChatMessage) => {
                const store = useChatStore.getState();
                store.addMessage(message);
            });

            this.hubConnection.on("MessageUnsent", (messageId: number) => {
                const store = useChatStore.getState();
                store.updateMessageUnsent(messageId);
            });

            // Real-time read receipt updates (double-check ticks)
            this.hubConnection.on("MessageRead", (payload: { messageId: number, systemUserId: number }) => {
                const store = useChatStore.getState();
                store.updateMessageRead(payload);
            });

            this.hubConnection.on("ReactionUpdated", (payload: { messageId: number, systemUserId: number, reactionType: string }) => {
                const store = useChatStore.getState();
                store.updateMessageReaction(payload);
            });

            this.hubConnection.on("ReactionRemoved", (payload: { messageId: number, systemUserId: number }) => {
                const store = useChatStore.getState();
                store.removeMessageReaction(payload);
            });

            // When added to a group by someone else, also join the SignalR group channel
            this.hubConnection.on("GroupCreated", (group: ChatGroup) => {
                const store = useChatStore.getState();
                store.addGroup(group);
                this.joinGroup(group.id).catch(console.error);
            });

            // When kicked or self-left, leave the SignalR group channel and remove from store
            this.hubConnection.on("LeftGroup", (groupId: number) => {
                this.leaveGroup(groupId).catch(console.error);
                const store = useChatStore.getState();
                store.removeGroup(groupId);
            });

            this.hubConnection.on("UserOnline", (userId: number) => {
                const store = useChatStore.getState();
                store.addOnlineUser(userId);
            });

            this.hubConnection.on("UserOffline", (userId: number) => {
                const store = useChatStore.getState();
                store.removeOnlineUser(userId);
            });

            this.hubConnection.on("OnlineUsersList", (users: number[]) => {
                const store = useChatStore.getState();
                store.setOnlineUsers(users);
            });

            this.hubConnection.on("UserTyping", (payload: { senderId: number, groupId?: number }) => {
                const store = useChatStore.getState();
                const chatKey = payload.groupId ? `group_${payload.groupId}` : `user_${payload.senderId}`;
                store.addTypingUser(chatKey, payload.senderId);
            });

            this.hubConnection.on("UserStoppedTyping", (payload: { senderId: number, groupId?: number }) => {
                const store = useChatStore.getState();
                const chatKey = payload.groupId ? `group_${payload.groupId}` : `user_${payload.senderId}`;
                store.removeTypingUser(chatKey, payload.senderId);
            });

        } catch (err) {
            console.error("Error while starting SignalR connection: " + err);
        }
    }

    public async stopConnection() {
        if (this.hubConnection) {
            try {
                await this.hubConnection.stop();
            } catch (err) {
                console.warn("Error stopping SignalR connection:", err);
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
        return this.hubConnection;
    }

    public async sendTypingStarted(receiverId?: number, groupId?: number) {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke("TypingStarted", receiverId || null, groupId || null);
        }
    }

    public async sendTypingStopped(receiverId?: number, groupId?: number) {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke("TypingStopped", receiverId || null, groupId || null);
        }
    }
}

export const signalRService = new SignalRService();
