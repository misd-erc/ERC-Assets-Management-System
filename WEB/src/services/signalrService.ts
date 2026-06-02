import * as signalR from "@microsoft/signalr";
import { useChatStore } from "../store/useChatStore";
import { ChatMessage, ChatGroup } from "../types/chat";

class SignalRService {
    private hubConnection: signalR.HubConnection | null = null;

    public async startConnection(systemUserId: number) {
        // Base API URL could come from env or config
        const apiUrl = process.env.REACT_APP_API_URL || "https://localhost:7118"; 

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${apiUrl}/hubs/chat`)
            .withAutomaticReconnect()
            .build();

        try {
            await this.hubConnection.start();
            console.log("SignalR Connected.");

            // Register user
            await this.hubConnection.invoke("RegisterUser", systemUserId);

            // Register event handlers
            this.hubConnection.on("ReceiveMessage", (message: ChatMessage) => {
                const store = useChatStore.getState();
                store.addMessage(message);
            });

            this.hubConnection.on("MessageUnsent", (messageId: number) => {
                const store = useChatStore.getState();
                store.updateMessageUnsent(messageId);
            });

            this.hubConnection.on("ReactionUpdated", (payload: { messageId: number, systemUserId: number, reactionType: string }) => {
                const store = useChatStore.getState();
                store.updateMessageReaction(payload);
            });

            this.hubConnection.on("ReactionRemoved", (payload: { messageId: number, systemUserId: number }) => {
                const store = useChatStore.getState();
                store.removeMessageReaction(payload);
            });

            this.hubConnection.on("GroupCreated", (group: ChatGroup) => {
                const store = useChatStore.getState();
                store.addGroup(group);
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

    public async joinGroup(groupId: number) {
        if (this.hubConnection && this.hubConnection.state === 'Connected') {
            await this.hubConnection.invoke("JoinChatGroup", groupId);
        }
    }

    public async leaveGroup(groupId: number) {
        if (this.hubConnection && this.hubConnection.state === 'Connected') {
            await this.hubConnection.invoke("LeaveChatGroup", groupId);
        }
    }

    public get connection() {
        return this.hubConnection;
    }

    public async sendTypingStarted(receiverId?: number, groupId?: number) {
        if (this.hubConnection && this.hubConnection.state === 'Connected') {
            await this.hubConnection.invoke("TypingStarted", receiverId || null, groupId || null);
        }
    }

    public async sendTypingStopped(receiverId?: number, groupId?: number) {
        if (this.hubConnection && this.hubConnection.state === 'Connected') {
            await this.hubConnection.invoke("TypingStopped", receiverId || null, groupId || null);
        }
    }
}

export const signalRService = new SignalRService();
