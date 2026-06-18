import { create } from 'zustand';
import { ChatMessage, ChatGroup } from '../types/chat';
import { secureStorage } from '../utils/secureStorage';

interface ChatState {
    isOpen: boolean;
    activeChatId: number | null; // null if no active chat, otherwise SystemUserId or GroupId
    isGroupChat: boolean;
    messages: ChatMessage[];
    groups: ChatGroup[];
    onlineUsers: number[];
    typingUsers: Record<string, number[]>; // key: "user_X" or "group_Y"
    unreadCounts: { direct: Record<number, number>, group: Record<number, number> };
    hasMoreHistory: boolean;
    conversationsUpdatedNonce: number;
    
    setIsOpen: (isOpen: boolean) => void;
    setActiveChat: (id: number | null, isGroup: boolean) => void;
    setMessages: (messages: ChatMessage[]) => void;
    addMessage: (message: ChatMessage) => void;
    updateMessageUnsent: (messageId: number) => void;
    updateMessageRead: (payload: { messageId: number, systemUserId: number }) => void;
    updateMessageReaction: (payload: { messageId: number, systemUserId: number, reactionType: string }) => void;
    removeMessageReaction: (payload: { messageId: number, systemUserId: number }) => void;
    setGroups: (groups: ChatGroup[]) => void;
    addGroup: (group: ChatGroup) => void;
    removeGroup: (groupId: number) => void;
    removeConversation: (partnerUserId: number) => void;
    setOnlineUsers: (users: number[]) => void;
    addOnlineUser: (userId: number) => void;
    removeOnlineUser: (userId: number) => void;
    addTypingUser: (chatKey: string, userId: number) => void;
    removeTypingUser: (chatKey: string, userId: number) => void;
    setUnreadCounts: (direct: Record<number, number>, group: Record<number, number>) => void;
    setHasMoreHistory: (hasMore: boolean) => void;
    prependMessages: (messages: ChatMessage[]) => void;
    clearUnreadCount: (chatId: number, isGroup: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    isOpen: false,
    activeChatId: null,
    isGroupChat: false,
    messages: [],
    groups: [],
    onlineUsers: [],
    typingUsers: {},
    unreadCounts: { direct: {}, group: {} },
    hasMoreHistory: true,
    conversationsUpdatedNonce: 0,
    
    setIsOpen: (isOpen) => set({ isOpen }),
    setActiveChat: (id, isGroup) => set({ activeChatId: id, isGroupChat: isGroup, messages: [], hasMoreHistory: true }),
    setMessages: (messages) => set({ messages }),
    addMessage: (message: ChatMessage) => set((state) => {
        if (state.messages.some(m => m.id === message.id)) {
            return {};
        }

        let updatedUnreadCounts = { ...state.unreadCounts };
        let currentUserId = 1;
        try {
            const systemUserIdStr = secureStorage.getItem('systemUserId') || '';
            currentUserId = systemUserIdStr ? parseInt(String(systemUserIdStr).replace(/"/g, ''), 10) : 1;
        } catch (err) {
            console.warn("Failed to resolve currentUserId", err);
        }

        // Play notification sound if message is from another user
        try {
            if (message.senderId !== currentUserId) {
                // Determine if we need to increment unread count
                const isMessageForGroup = message.groupId != null;
                const chatId = isMessageForGroup ? message.groupId! : message.senderId;
                
                const isChatActive = state.isOpen && state.activeChatId === chatId && state.isGroupChat === isMessageForGroup;
                
                if (!isChatActive) {
                    if (isMessageForGroup) {
                        updatedUnreadCounts.group = { 
                            ...updatedUnreadCounts.group, 
                            [chatId]: (updatedUnreadCounts.group[chatId] || 0) + 1 
                        };
                    } else {
                        updatedUnreadCounts.direct = { 
                            ...updatedUnreadCounts.direct, 
                            [chatId]: (updatedUnreadCounts.direct[chatId] || 0) + 1 
                        };
                    }
                }

                const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav");
                audio.volume = 0.4;
                audio.play().catch(() => {});
            }
        } catch (err) {
            console.warn("Failed to play sound or update unread counts", err);
        }

        const isMessageForGroup = message.groupId != null;
        const isRelevant = isMessageForGroup 
            ? (state.isGroupChat && state.activeChatId === message.groupId)
            : (!state.isGroupChat && (
                (message.senderId === state.activeChatId) ||
                (message.senderId === currentUserId && message.receiverId === state.activeChatId)
              ));

        let updatedMessages = [...state.messages];
        if (isRelevant) {
            if (message.id > 0) {
                // Replace any temp message (id < 0) from the same sender for the same conversation
                const tempIndex = state.messages.findIndex(m => {
                    if (m.id >= 0) return false;
                    if (m.senderId !== message.senderId) return false;
                    if (isMessageForGroup) {
                        return m.groupId === message.groupId;
                    }
                    return m.receiverId === message.receiverId;
                });
                if (tempIndex !== -1) {
                    updatedMessages[tempIndex] = message;
                } else {
                    updatedMessages.push(message);
                }
            } else {
                updatedMessages.push(message);
            }
        }
        
        return { 
            messages: updatedMessages, 
            unreadCounts: updatedUnreadCounts,
            conversationsUpdatedNonce: state.conversationsUpdatedNonce + 1
        };
    }),
    updateMessageUnsent: (messageId) => set((state) => ({
        messages: state.messages.map(m => m.id === messageId ? { ...m, isUnsent: true } : m),
        conversationsUpdatedNonce: state.conversationsUpdatedNonce + 1
    })),
    updateMessageRead: (payload) => set((state) => ({
        messages: state.messages.map(m => {
            if (m.id === payload.messageId) {
                const alreadyRecorded = m.readReceipts?.some(r => r.systemUserId === payload.systemUserId);
                if (alreadyRecorded) return m;
                return { ...m, readReceipts: [...(m.readReceipts || []), { systemUserId: payload.systemUserId, readAt: new Date().toISOString() }] };
            }
            return m;
        })
    })),
    updateMessageReaction: (payload) => set((state) => ({
        messages: state.messages.map(m => {
            if (m.id === payload.messageId) {
                const newReactions = m.reactions?.filter(r => r.systemUserId !== payload.systemUserId) || [];
                return { ...m, reactions: [...newReactions, { systemUserId: payload.systemUserId, reactionType: payload.reactionType, createdAt: new Date().toISOString() }] };
            }
            return m;
        })
    })),
    removeMessageReaction: (payload) => set((state) => ({
        messages: state.messages.map(m => {
            if (m.id === payload.messageId) {
                return { ...m, reactions: m.reactions?.filter(r => r.systemUserId !== payload.systemUserId) || [] };
            }
            return m;
        })
    })),
    setGroups: (groups) => set({ groups }),
    addGroup: (group) => set((state) => ({
        // Avoid duplicate groups (e.g. GroupCreated fired twice)
        groups: state.groups.some(g => g.id === group.id) ? state.groups : [...state.groups, group]
    })),
    removeGroup: (groupId) => set((state) => ({ groups: state.groups.filter(g => g.id !== groupId) })),
    removeConversation: (partnerUserId) => set((state) => ({
        conversationsUpdatedNonce: state.conversationsUpdatedNonce + 1
    })),
    setOnlineUsers: (users) => set({ onlineUsers: users }),
    addOnlineUser: (userId) => set((state) => ({ onlineUsers: [...new Set([...state.onlineUsers, userId])] })),
    removeOnlineUser: (userId) => set((state) => ({ onlineUsers: state.onlineUsers.filter(u => u !== userId) })),
    addTypingUser: (chatKey, userId) => set((state) => {
        const current = state.typingUsers[chatKey] || [];
        return { typingUsers: { ...state.typingUsers, [chatKey]: [...new Set([...current, userId])] } };
    }),
    removeTypingUser: (chatKey, userId) => set((state) => {
        const current = state.typingUsers[chatKey] || [];
        return { typingUsers: { ...state.typingUsers, [chatKey]: current.filter(u => u !== userId) } };
    }),
    setUnreadCounts: (direct, group) => set({ unreadCounts: { direct, group } }),
    setHasMoreHistory: (hasMore) => set({ hasMoreHistory: hasMore }),
    prependMessages: (messages) => set((state) => ({ messages: [...messages, ...state.messages] })),
    clearUnreadCount: (chatId, isGroup) => set((state) => {
        let updatedCounts = { ...state.unreadCounts };
        if (isGroup) {
            updatedCounts.group = { ...updatedCounts.group };
            delete updatedCounts.group[chatId];
        } else {
            updatedCounts.direct = { ...updatedCounts.direct };
            delete updatedCounts.direct[chatId];
        }
        return { unreadCounts: updatedCounts };
    }),
}));
