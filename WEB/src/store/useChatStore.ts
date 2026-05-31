import { create } from 'zustand';
import { ChatMessage, ChatGroup } from '../types/chat';

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
    
    setIsOpen: (isOpen: boolean) => void;
    setActiveChat: (id: number | null, isGroup: boolean) => void;
    setMessages: (messages: ChatMessage[]) => void;
    addMessage: (message: ChatMessage) => void;
    updateMessageUnsent: (messageId: number) => void;
    updateMessageReaction: (payload: { messageId: number, systemUserId: number, reactionType: string }) => void;
    removeMessageReaction: (payload: { messageId: number, systemUserId: number }) => void;
    setGroups: (groups: ChatGroup[]) => void;
    addGroup: (group: ChatGroup) => void;
    setOnlineUsers: (users: number[]) => void;
    addOnlineUser: (userId: number) => void;
    removeOnlineUser: (userId: number) => void;
    addTypingUser: (chatKey: string, userId: number) => void;
    removeTypingUser: (chatKey: string, userId: number) => void;
    setUnreadCounts: (direct: Record<number, number>, group: Record<number, number>) => void;
    setHasMoreHistory: (hasMore: boolean) => void;
    prependMessages: (messages: ChatMessage[]) => void;
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
    
    setIsOpen: (isOpen) => set({ isOpen }),
    setActiveChat: (id, isGroup) => set({ activeChatId: id, isGroupChat: isGroup }),
    setMessages: (messages) => set({ messages }),
    addMessage: (message: ChatMessage) => set((state) => ({ messages: [...state.messages, message] })),
    updateMessageUnsent: (messageId) => set((state) => ({
        messages: state.messages.map(m => m.id === messageId ? { ...m, isUnsent: true } : m)
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
    addGroup: (group) => set((state) => ({ groups: [...state.groups, group] })),
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
}));
