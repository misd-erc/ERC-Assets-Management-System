export interface ChatMessage {
    id: number;
    senderId: number;
    receiverId?: number;
    groupId?: number;
    replyToMessageId?: number;
    message?: string;
    fileStorageId?: number;
    attachmentName?: string;
    attachmentType?: string;
    isUnsent: boolean;
    isSystemMessage?: boolean;
    createdAt: string;
    readReceipts: ReadReceipt[];
    reactions: ChatReaction[];
}

export interface ChatReaction {
    systemUserId: number;
    reactionType: string;
    createdAt: string;
}

export interface ReadReceipt {
    systemUserId: number;
    readAt: string;
}

export interface ChatGroup {
    id: number;
    name: string;
    description?: string;
    createdBySystemUserId: number;
    createdAt: string;
}
