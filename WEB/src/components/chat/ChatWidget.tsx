import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { signalRService } from '../../services/signalrService';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MessageCircle, X, Send, Paperclip, ArrowLeft, Users, User as UserIcon, Plus, Check, Maximize2, Minimize2, Smile, Trash2, CornerUpLeft, Settings, Info, Download } from 'lucide-react';
import { ChatMessage, ChatGroup } from '../../types/chat';
import { getUsers, getUserPhoto } from '../../api/user-management/userApi';
import { User } from '../../types';
import { secureStorage } from '../../utils/secureStorage';
import axiosInstance from '../../lib/axios';

const ChatUserAvatar: React.FC<{ user: User; size?: 'sm' | 'md' | 'lg' }> = ({ user, size = 'md' }) => {
    const [imageUrl, setImageUrl] = useState<string | undefined>();

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base'
    };

    useEffect(() => {
        let isMounted = true;
        const loadProfilePicture = async () => {
            if (!user?.profilePictureStorageFile?.id) return;
            try {
                const systemUserId = (secureStorage.getItem('systemUserId') || '').replace(/"/g, '');
                const fileId = String(user.profilePictureStorageFile.id);
                const photoResponse = await getUserPhoto(fileId, systemUserId);
                if (isMounted) {
                    const url = URL.createObjectURL(photoResponse.data);
                    setImageUrl(url);
                }
            } catch (error) {
                console.warn('Failed to load profile picture:', error);
            }
        };
        loadProfilePicture();
        return () => {
            isMounted = false;
            if (imageUrl) URL.revokeObjectURL(imageUrl);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    if (imageUrl) {
        return (
            <img 
                src={imageUrl} 
                alt={user.firstName} 
                className={`${sizeClasses[size]} rounded-full object-cover border border-slate-200/80 shadow-sm shrink-0`} 
            />
        );
    }

    return (
        <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold border border-blue-200 shadow-sm shrink-0 select-none`}>
            {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
        </div>
    );
};

export const ChatWidget: React.FC = () => {
    const { 
        isOpen, 
        setIsOpen, 
        messages, 
        activeChatId, 
        setActiveChat, 
        isGroupChat, 
        onlineUsers, 
        typingUsers, 
        unreadCounts, 
        setMessages, 
        prependMessages, 
        hasMoreHistory, 
        setHasMoreHistory, 
        groups, 
        setGroups, 
        addGroup,
        clearUnreadCount,
        updateMessageReaction,
        removeMessageReaction,
        updateMessageUnsent,
        replaceMessage,
        markMessageFailed,
        conversationsUpdatedNonce
    } = useChatStore();

    const [messageInput, setMessageInput] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [view, setView] = useState<'list' | 'chat' | 'createGroup'>('list');
    const [listTab, setListTab] = useState<'users' | 'groups'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [selectedDirectUser, setSelectedDirectUser] = useState<User | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [conversationUserIds, setConversationUserIds] = useState<number[]>([]);
    
    // UI layout state
    const [isExpanded, setIsExpanded] = useState(true);
    const [showGroupSettings, setShowGroupSettings] = useState(false);
    
    // Create group state
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [reactionMenuId, setReactionMenuId] = useState<number | null>(null);
    const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
    const [messageDetails, setMessageDetails] = useState<ChatMessage | null>(null);
    const [maximizedMedia, setMaximizedMedia] = useState<{url: string, type: 'image' | 'video', name: string} | null>(null);

    // Group Management state
    const [groupMembers, setGroupMembers] = useState<any[]>([]);
    const [groupSettingsName, setGroupSettingsName] = useState('');
    const [groupSettingsDesc, setGroupSettingsDesc] = useState('');
    const [groupSearchQuery, setGroupSearchQuery] = useState('');
    const [groupSearchUsers, setGroupSearchUsers] = useState<User[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const hasScrolledToBottomRef = useRef(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const desktopMessageInputRef = useRef<HTMLInputElement>(null);
    const mobileMessageInputRef = useRef<HTMLInputElement>(null);
    const systemUserIdStr = secureStorage.getItem('systemUserId');
    const currentUserId = systemUserIdStr ? parseInt(String(systemUserIdStr).replace(/"/g, ''), 10) : 1;

    useEffect(() => {
        signalRService.startConnection(currentUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (replyToMessage) {
            const timer = setTimeout(() => {
                const isMobileScreen = window.innerWidth < 768;
                if (isMobileScreen) {
                    mobileMessageInputRef.current?.focus();
                } else {
                    desktopMessageInputRef.current?.focus();
                }
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [replyToMessage]);

    useEffect(() => {
        if (isOpen) {
            const fetchGroups = async () => {
                try {
                    const response = await axiosInstance.get(`/chat/groups/${currentUserId}`);
                    const data = response.data;
                    if (data.success) {
                        setGroups(data.data);
                        data.data.forEach((g: ChatGroup) => {
                            signalRService.joinGroup(g.id);
                        });
                    }
                } catch (err) { console.error("Failed to fetch groups", err); }
            };
            fetchGroups();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, setGroups]);

    // Fetch initial unread counts
    useEffect(() => {
        const fetchUnreadCounts = async () => {
            try {
                const response = await axiosInstance.get(`/chat/unread-counts/${currentUserId}`);
                const data = response.data;
                if (data.success && data.data) {
                    const directMap: Record<number, number> = {};
                    const groupMap: Record<number, number> = {};
                    
                    data.data.direct?.forEach((item: any) => {
                        if (item.senderId) directMap[item.senderId] = item.unreadCount;
                    });
                    
                    data.data.group?.forEach((item: any) => {
                        if (item.groupId) groupMap[item.groupId] = item.unreadCount;
                    });
                    
                    useChatStore.getState().setUnreadCounts(directMap, groupMap);
                }
            } catch (err) {
                console.error("Failed to fetch initial unread counts", err);
            }
        };
        fetchUnreadCounts();
    }, [currentUserId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen && (view === 'list' || isExpanded)) {
                fetchContacts(searchQuery);
            }
        }, 300);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, isOpen, view, isExpanded, conversationsUpdatedNonce]);

    const fetchContacts = async (search?: string) => {
        setIsSearching(true);
        try {
            if (search && search.trim() !== '') {
                const response = await getUsers({ page: 1, pageSize: 50, searchString: search });
                if (response?.data?.items) {
                    let searchResults = response.data.items.filter(u => u.id !== currentUserId);
                    // Keep the currently active direct chat user in the list so header doesn't break
                    if (activeChatId && !isGroupChat && selectedDirectUser) {
                        const alreadyInResults = searchResults.some(u => u.id === activeChatId);
                        if (!alreadyInResults) {
                            searchResults = [selectedDirectUser, ...searchResults];
                        }
                    }
                    setUsers(searchResults);
                } else {
                    setUsers(selectedDirectUser && activeChatId && !isGroupChat ? [selectedDirectUser] : []);
                }
            } else {
                const response = await axiosInstance.get(`/chat/conversations/${currentUserId}?t=${Date.now()}`);
                let activeUsers: any[] = [];
                if (response.data.success && response.data.data) {
                    activeUsers = response.data.data.map((item: any) => ({
                        id: item.id,
                        firstName: item.firstName,
                        lastName: item.lastName,
                        email: item.email,
                        employeeId: item.employeeId,
                        isActive: item.isActive,
                        systemRole: item.systemRole || [],
                        systemUserStatus: item.systemUserStatus || { id: 1, name: 'Active', isActive: true, isDeleted: false, createdAt: '' },
                        office: item.office || null,
                        division: item.division || null,
                        employmentType: item.employmentType || null,
                        position: item.position || null,
                        profilePictureStorageFile: item.profilePictureStorageFile || null,
                        createdAt: item.createdAt,
                        lastLoginAt: item.lastLoginAt,
                        lastMessage: item.lastMessage || null,
                        lastMessageAt: item.lastMessageAt || null,
                        lastMessageSenderId: item.lastMessageSenderId || null
                    })).filter((u: any) => u.id !== currentUserId);
                }

                // Track which users have active conversations
                setConversationUserIds(activeUsers.map(u => u.id));

                let filtered = [...activeUsers];

                // Retain the actively selected direct chat user in the sidebar
                if (activeChatId && !isGroupChat) {
                    const activeUserInList = filtered.some((u: any) => u.id === activeChatId);
                    if (!activeUserInList) {
                        const currentActiveUser = users.find(u => u.id === activeChatId);
                        if (currentActiveUser) {
                            filtered = [currentActiveUser, ...filtered];
                        } else if (selectedDirectUser) {
                            filtered = [selectedDirectUser, ...filtered];
                        }
                    }
                }

                setUsers(filtered);
            }
        } catch (err) {
            console.error("Failed to load users", err);
            // Preserve the active user so chat header doesn't break
            if (selectedDirectUser && activeChatId && !isGroupChat) {
                setUsers([selectedDirectUser]);
            } else {
                setUsers([]);
            }
        } finally {
            setIsSearching(false);
        }
    };

    // Sync selectedDirectUser when activeChatId changes (so the header always has a name)
    useEffect(() => {
        if (activeChatId && !isGroupChat) {
            const found = users.find(u => u.id === activeChatId);
            if (found) setSelectedDirectUser(found);
        } else if (!activeChatId) {
            setSelectedDirectUser(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChatId, isGroupChat]);

    // Re-fetch when tab changes
    useEffect(() => {
        if (isOpen && (view === 'list' || isExpanded)) {
            fetchContacts(searchQuery);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listTab]);

    useEffect(() => {
        if (isOpen && activeChatId && (view === 'chat' || isExpanded)) {
            fetchHistory(true);
            clearUnreadCount(activeChatId, isGroupChat);
            axiosInstance.post('/chat/read-conversation', {
                systemUserId: currentUserId,
                targetId: activeChatId,
                isGroup: isGroupChat
            }).catch(err => console.error('Failed to mark conversation as read', err));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, activeChatId, view, isExpanded, isGroupChat, clearUnreadCount]);

    const fetchHistory = async (initial = false) => {
        if (!activeChatId || isLoadingHistory || (!initial && !hasMoreHistory)) return;

        setIsLoadingHistory(true);
        try {
            let url = isGroupChat 
                ? `/chat/history/group/${activeChatId}?currentUserId=${currentUserId}&limit=20`
                : `/chat/history/direct/${activeChatId}?currentUserId=${currentUserId}`;

            if (!initial && messages.length > 0) {
                const realOldest = messages.find(m => m.id > 0)?.id;
                if (realOldest) {
                    url += `&beforeMessageId=${realOldest}`;
                }
            }

            const response = await axiosInstance.get(url);
            const data = response.data;
            
            if (data.success) {
                const fetchedMessages = data.data as ChatMessage[];
                if (fetchedMessages.length < 20) {
                    setHasMoreHistory(false);
                }
                
                if (initial) {
                    setMessages(fetchedMessages);
                    setTimeout(scrollToBottom, 100);
                } else {
                    prependMessages(fetchedMessages);
                }
            }
        } catch (err) {
            console.error("Failed to load history", err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const [userIsNearBottom, setUserIsNearBottom] = useState(true);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        if (container.scrollTop === 0 && hasScrolledToBottomRef.current) {
            fetchHistory();
        }
        const threshold = 150;
        const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
        setUserIsNearBottom(nearBottom);
    };

    const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
        if (messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            container.scrollTo({
                top: container.scrollHeight,
                behavior
            });
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior });
        }
    };

    const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;
    const prevActiveChatIdRef = useRef<number | null>(null);
    const prevIsOpenRef = useRef(false);

    useEffect(() => {
        if (!isOpen || !activeChatId || messages.length === 0 || view !== 'chat' || isLoadingHistory) {
            prevIsOpenRef.current = isOpen;
            if (activeChatId && messages.length === 0) {
                hasScrolledToBottomRef.current = false;
            }
            return;
        }

        const openedWidget = !prevIsOpenRef.current && isOpen;
        const switchedChat = prevActiveChatIdRef.current !== activeChatId;
        const shouldScrollInstant = openedWidget || switchedChat;

        prevIsOpenRef.current = isOpen;
        prevActiveChatIdRef.current = activeChatId;

        const timer1 = setTimeout(() => {
            const lastMsg = messages[messages.length - 1];
            const isSelf = lastMsg?.senderId === currentUserId;
            
            if (shouldScrollInstant || isSelf || userIsNearBottom) {
                scrollToBottom(shouldScrollInstant ? 'auto' : 'smooth');
                hasScrolledToBottomRef.current = true;
            }
        }, 50);

        const timer2 = setTimeout(() => {
            const lastMsg = messages[messages.length - 1];
            const isSelf = lastMsg?.senderId === currentUserId;
            
            if (shouldScrollInstant || isSelf || userIsNearBottom) {
                scrollToBottom(shouldScrollInstant ? 'auto' : 'smooth');
                hasScrolledToBottomRef.current = true;
            }
        }, 150);

        const timer3 = setTimeout(() => {
            const lastMsg = messages[messages.length - 1];
            const isSelf = lastMsg?.senderId === currentUserId;
            
            if (shouldScrollInstant || isSelf || userIsNearBottom) {
                scrollToBottom(shouldScrollInstant ? 'auto' : 'smooth');
                hasScrolledToBottomRef.current = true;
            }
        }, 350);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, activeChatId, lastMessageId, view, currentUserId, isLoadingHistory, userIsNearBottom]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessageInput(e.target.value);
        
        if (activeChatId) {
            if (!typingTimeoutRef.current) {
                signalRService.sendTypingStarted(isGroupChat ? undefined : (activeChatId ?? undefined), isGroupChat ? (activeChatId ?? undefined) : undefined);
            } else {
                clearTimeout(typingTimeoutRef.current);
            }
            
            typingTimeoutRef.current = setTimeout(() => {
                signalRService.sendTypingStopped(isGroupChat ? undefined : (activeChatId ?? undefined), isGroupChat ? (activeChatId ?? undefined) : undefined);
                typingTimeoutRef.current = null;
            }, 2000);
        }
    };

    const sendMessage = async () => {
        if (!messageInput.trim() && !file) return;

        const originalMessageInput = messageInput.trim();

        // Optimistic UI Update: Create a temporary message
        const tempId = -Date.now();
        const tempMessage: ChatMessage = {
            id: tempId,
            senderId: currentUserId,
            receiverId: isGroupChat ? undefined : (activeChatId ?? undefined),
            groupId: isGroupChat ? (activeChatId ?? undefined) : undefined,
            message: originalMessageInput || undefined,
            isUnsent: false,
            createdAt: new Date().toISOString(),
            readReceipts: [],
            reactions: [],
            clientTempId: tempId
        };
        
        // Add to store immediately to make the UI lively and instant
        const store = useChatStore.getState();
        store.addMessage(tempMessage);
        setTimeout(scrollToBottom, 50);

        const formData = new FormData();
        formData.append('senderId', currentUserId.toString());
        if (isGroupChat && activeChatId) formData.append('groupId', activeChatId.toString());
        else if (activeChatId) formData.append('receiverId', activeChatId.toString());
        
        if (replyToMessage) formData.append('replyToMessageId', replyToMessage.id.toString());
        if (originalMessageInput) formData.append('message', originalMessageInput);
        if (file) formData.append('file', file);

        setMessageInput('');
        setFile(null);
        setReplyToMessage(null);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
            signalRService.sendTypingStopped(isGroupChat ? undefined : (activeChatId ?? undefined), isGroupChat ? (activeChatId ?? undefined) : undefined);
        }

        try {
            const response = await axiosInstance.post('/chat/send', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const data = response.data;
            if (data.success) {
                replaceMessage(tempId, data.data);
            }
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            markMessageFailed(tempId);
            console.error('Failed to send message', error);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) return;
        try {
            const response = await axiosInstance.post('/chat/group/create', { 
                name: groupName.trim(), 
                systemUserId: currentUserId, 
                memberIds: selectedMembers 
            });
            const data = response.data;
            if (data.success) {
                addGroup(data.data);
                signalRService.joinGroup(data.data.id);
                setGroupName('');
                setSelectedMembers([]);
                setActiveChat(data.data.id, true);
                setView('chat');
            }
        } catch (err) {
            console.error("Failed to create group", err);
        }
    };

    const toggleMemberSelection = (userId: number) => {
        setSelectedMembers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const handleReaction = async (messageId: number, reactionType: string) => {
        setReactionMenuId(null);
        const msg = messages.find(m => m.id === messageId);
        if (!msg) return;

        const hasReacted = msg.reactions?.some(r => r.reactionType === reactionType && r.systemUserId === currentUserId);
        const endpoint = hasReacted ? '/chat/unreact' : '/chat/react';
        
        // Optimistic UI update
        if (hasReacted) {
            removeMessageReaction({ messageId, systemUserId: currentUserId });
        } else {
            updateMessageReaction({ messageId, systemUserId: currentUserId, reactionType });
        }

        try {
            await axiosInstance.post(endpoint, {
                messageId,
                systemUserId: currentUserId,
                reactionType
            });
        } catch (err) {
            console.error("Failed to toggle reaction", err);
            // Revert optimistic update on failure
            if (hasReacted) {
                updateMessageReaction({ messageId, systemUserId: currentUserId, reactionType });
            } else {
                removeMessageReaction({ messageId, systemUserId: currentUserId });
            }
        }
    };

    const handleUnsend = async (messageId: number) => {
        // Optimistic UI update
        updateMessageUnsent(messageId);
        try {
            await axiosInstance.post(`/chat/unsend/${messageId}?systemUserId=${currentUserId}`);
        } catch (err) {
            console.error("Failed to unsend message", err);
        }
    };

    // Group Management API calls
    const fetchGroupMembers = async (groupId: number) => {
        try {
            const response = await axiosInstance.get(`/chat/group/${groupId}/members`);
            if (response.data.success) {
                setGroupMembers(response.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch group members", err);
        }
    };

    const handleAssignAdmin = async (targetUserId: number, makeAdmin: boolean) => {
        if (!activeChatId) return;
        try {
            const response = await axiosInstance.post('/chat/group/assign-admin', {
                requesterUserId: currentUserId,
                targetUserId,
                groupId: activeChatId,
                isAdmin: makeAdmin
            });
            if (response.data.success) {
                fetchGroupMembers(activeChatId);
            }
        } catch (err) {
            console.error("Failed to assign admin", err);
        }
    };

    const handleKickMember = async (targetUserId: number) => {
        if (!activeChatId) return;
        try {
            const response = await axiosInstance.post('/chat/group/remove-member', {
                requesterUserId: currentUserId,
                targetUserId,
                groupId: activeChatId
            });
            if (response.data.success) {
                fetchGroupMembers(activeChatId);
            }
        } catch (err) {
            console.error("Failed to kick member", err);
        }
    };

    const handleLeaveGroup = async () => {
        if (!activeChatId) return;
        try {
            const response = await axiosInstance.post('/chat/group/remove-member', {
                requesterUserId: currentUserId,
                targetUserId: currentUserId,
                groupId: activeChatId
            });
            if (response.data.success) {
                setActiveChat(null, false);
                setShowGroupSettings(false);
                setView('list');
                const fetchGroups = async () => {
                    const response = await axiosInstance.get(`/chat/groups/${currentUserId}`);
                    if (response.data.success) setGroups(response.data.data);
                };
                fetchGroups();
            }
        } catch (err) {
            console.error("Failed to leave group", err);
        }
    };

    const handleDeleteGroup = async () => {
        if (!activeChatId) return;
        if (!window.confirm("Are you sure you want to delete this entire group? This will permanently delete the group, all its messages, and files for everyone.")) return;

        try {
            const response = await axiosInstance.delete(`/chat/group/${activeChatId}/${currentUserId}`);
            if (response.data.success) {
                setActiveChat(null, false);
                setShowGroupSettings(false);
                setView('list');
                const fetchGroups = async () => {
                    const response = await axiosInstance.get(`/chat/groups/${currentUserId}`);
                    if (response.data.success) setGroups(response.data.data);
                };
                fetchGroups();
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to delete group");
            console.error("Failed to delete group", err);
        }
    };

    const handleAddMemberToGroup = async (targetUserId: number) => {
        if (!activeChatId) return;
        try {
            const response = await axiosInstance.post('/chat/group/add-member', {
                requesterUserId: currentUserId,
                targetUserId,
                groupId: activeChatId
            });
            if (response.data.success) {
                fetchGroupMembers(activeChatId);
            }
        } catch (err) {
            console.error("Failed to add member to group", err);
        }
    };

    const handleUpdateSettings = async (name: string, desc: string, logoFile?: File | null) => {
        if (!activeChatId) return;
        try {
            const formData = new FormData();
            formData.append('requesterUserId', currentUserId.toString());
            formData.append('groupId', activeChatId.toString());
            formData.append('name', name);
            if (desc) formData.append('description', desc);
            if (logoFile) formData.append('logoFile', logoFile);

            const response = await axiosInstance.post('/chat/group/update-settings', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.success) {
                const fetchGroups = async () => {
                    const response = await axiosInstance.get(`/chat/groups/${currentUserId}`);
                    if (response.data.success) setGroups(response.data.data);
                };
                fetchGroups();
            }
        } catch (err) {
            console.error("Failed to update settings", err);
        }
    };

    // Trigger member fetch and settings state sync when active group changes
    const activeGroup = groups.find(g => g.id === activeChatId);

    const handleDeleteDirectConversation = async () => {
        if (!activeChatId || isGroupChat) return;
        if (!window.confirm("Are you sure you want to delete this conversation? This will clear the message history for you.")) return;

        try {
            const response = await axiosInstance.delete(`/chat/conversations/${currentUserId}/${activeChatId}`);
            if (response.data.success) {
                // Clear active chat to return to list
                setActiveChat(null, false);
                setView('list');
                fetchContacts(searchQuery);
            }
        } catch (err) {
            console.error("Failed to delete conversation", err);
        }
    };

    useEffect(() => {
        if (isOpen && activeChatId && isGroupChat) {
            fetchGroupMembers(activeChatId);
            if (activeGroup) {
                setGroupSettingsName(activeGroup.name);
                setGroupSettingsDesc(activeGroup.description || '');
            }
        } else {
            setShowGroupSettings(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, activeChatId, isGroupChat]);

    // Live SignalR Event listeners for real-time Group updates
    useEffect(() => {
        if (signalRService.connection) {
            const conn = signalRService.connection;

            const onAdminStatusUpdated = (payload: { groupId: number, targetUserId: number, isAdmin: boolean }) => {
                if (activeChatId === payload.groupId && isGroupChat) {
                    fetchGroupMembers(payload.groupId);
                }
            };

            const onMemberAdded = (payload: { groupId: number, targetUserId: number }) => {
                if (activeChatId === payload.groupId && isGroupChat) {
                    fetchGroupMembers(payload.groupId);
                }
            };

            const onMemberRemoved = (payload: { groupId: number, targetUserId: number }) => {
                if (activeChatId === payload.groupId && isGroupChat) {
                    fetchGroupMembers(payload.groupId);
                }
                if (payload.targetUserId === currentUserId && activeChatId === payload.groupId) {
                    setActiveChat(null, false);
                    setShowGroupSettings(false);
                    setView('list');
                }
            };

            const onLeftGroup = (groupId: number) => {
                if (activeChatId === groupId) {
                    setActiveChat(null, false);
                    setShowGroupSettings(false);
                    setView('list');
                }
            };

            const onGroupSettingsUpdated = (updatedGroup: ChatGroup) => {
                setGroups(groups.map(g => g.id === updatedGroup.id ? updatedGroup : g));
            };

            const onGroupDeleted = (groupId: number) => {
                if (activeChatId === groupId) {
                    setActiveChat(null, false);
                    setShowGroupSettings(false);
                    setView('list');
                }
            };

            conn.on("AdminStatusUpdated", onAdminStatusUpdated);
            conn.on("MemberAdded", onMemberAdded);
            conn.on("MemberRemoved", onMemberRemoved);
            conn.on("LeftGroup", onLeftGroup);
            conn.on("GroupSettingsUpdated", onGroupSettingsUpdated);
            conn.on("GroupDeleted", onGroupDeleted);

            return () => {
                conn.off("AdminStatusUpdated", onAdminStatusUpdated);
                conn.off("MemberAdded", onMemberAdded);
                conn.off("MemberRemoved", onMemberRemoved);
                conn.off("LeftGroup", onLeftGroup);
                conn.off("GroupSettingsUpdated", onGroupSettingsUpdated);
                conn.off("GroupDeleted", onGroupDeleted);
            };
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChatId, isGroupChat, groups]);

    const formatTimestamp = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMins / 60);

        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHrs < 24) return `${diffHrs}h`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };
    const attachmentUrl = (messageId: number) => `${axiosInstance.defaults.baseURL}/chat/message/${messageId}/attachment?systemUserId=${currentUserId}`;

    if (!isOpen) {
        const directCount = Object.values(unreadCounts.direct || {}).reduce((a, b) => a + b, 0);
        const groupCount = Object.values(unreadCounts.group || {}).reduce((a, b) => a + b, 0);
        const totalUnread = directCount + groupCount;

        return (
            <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999]">
                <button
                    onClick={() => setIsOpen(true)}
                    className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-16 h-16 rounded-full shadow-xl shadow-blue-500/30 hover:scale-110 hover:shadow-blue-500/40 active:scale-95 transition-all duration-200 flex items-center justify-center group cursor-pointer border border-white/10"
                >
                    <MessageCircle size={30} className="group-hover:rotate-12 transition-transform duration-300" />
                    {totalUnread > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                            {totalUnread}
                        </span>
                    )}
                </button>
            </div>
        );
    }

    const activeUser = users.find(u => u.id === activeChatId) || selectedDirectUser;
    const isOnline = !isGroupChat && activeChatId && onlineUsers.includes(activeChatId);
    const chatKey = isGroupChat ? `group_${activeChatId}` : `user_${activeChatId}`;
    const typingList = typingUsers[chatKey] || [];
    const isSomeoneTyping = typingList.length > 0 && !(typingList.length === 1 && typingList[0] === currentUserId);

    // Sidebar rendering
    const renderSidebar = () => (
        <div className={`flex flex-col bg-white h-full ${isExpanded ? 'w-[280px] border-r border-slate-100 shrink-0' : 'w-full'}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center rounded-tl-2xl">
                <div className="flex items-center space-x-2">
                    <MessageCircle size={20} />
                    <span className="font-semibold text-base tracking-wide">Chats</span>
                </div>
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)} 
                        className="hover:bg-white/20 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title={isExpanded ? 'Minimize Window' : 'Expand Window'}
                    >
                        {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors cursor-pointer">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-100 bg-white text-xs font-semibold">
                <button 
                    onClick={() => { setListTab('users'); setSearchQuery(''); }}
                    className={`flex-1 py-3 flex items-center justify-center transition-colors ${listTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'}`}
                >
                    <UserIcon size={14} className="mr-1.5" /> Directs
                </button>
                <button 
                    onClick={() => { setListTab('groups'); setSearchQuery(''); }}
                    className={`flex-1 py-3 flex items-center justify-center transition-colors ${listTab === 'groups' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/20' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'}`}
                >
                    <Users size={14} className="mr-1.5" /> Groups
                </button>
            </div>

            {/* Search Bar / Action Bar */}
            {listTab === 'users' ? (
                <div className="p-3 bg-white border-b border-slate-50">
                    <input
                        type="text"
                        placeholder="Search for new users or conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200/80 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-slate-50/80 placeholder-slate-400 transition-all"
                    />
                </div>
            ) : (
                <div className="p-3 bg-white border-b border-slate-50 flex justify-between items-center shrink-0">
                    <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase pl-1">Group Chats</span>
                    <button 
                        onClick={() => setView('createGroup')}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center bg-blue-50 hover:bg-blue-100/80 px-2 py-1 rounded-full transition-colors cursor-pointer"
                    >
                        <Plus size={12} className="mr-1" /> New Group
                    </button>
                </div>
            )}

            {/* List Contents */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30 flex flex-col">
                {listTab === 'users' ? (
                    isSearching ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-2">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-slate-400">Loading contacts...</span>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center text-slate-400 mt-12 text-xs">No contacts found</div>
                    ) : (
                        <>
                            {users.map(u => {
                                const isUserActive = !isGroupChat && activeChatId === u.id;
                                const isUserOnline = onlineUsers.includes(u.id);
                                const lastMessage = (u as any).lastMessage;
                                const lastMessageAt = (u as any).lastMessageAt;
                                const lastMessageSenderId = (u as any).lastMessageSenderId;

                                return (
                                    <div 
                                        key={u.id} 
                                        className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer flex items-center transition-all ${isUserActive ? 'bg-blue-50/40 border-l-4 border-l-blue-600 pl-3' : ''}`}
                                        onClick={() => {
                                            setActiveChat(u.id, false);
                                            setSelectedDirectUser(u);
                                            setSearchQuery('');
                                            setView('chat');
                                        }}
                                    >
                                        <div className="relative mr-3 shrink-0">
                                            <ChatUserAvatar user={u} size="md" />
                                            {isUserOnline && (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <span className="font-semibold text-xs text-slate-800 truncate">{u.firstName} {u.lastName}</span>
                                                <div className="flex items-center shrink-0 ml-2">
                                                    {lastMessageAt && (
                                                        <span className="text-[9px] text-slate-400 mr-1">{formatTimestamp(lastMessageAt)}</span>
                                                    )}
                                                    {unreadCounts.direct[u.id] > 0 && (
                                                        <span className="bg-blue-600 text-white font-bold rounded-full min-w-[18px] h-[18px] px-1 text-[9px] flex items-center justify-center scale-90">
                                                            {unreadCounts.direct[u.id]}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-slate-400 truncate">
                                                {lastMessage 
                                                    ? (lastMessageSenderId === currentUserId ? 'You: ' : '') + lastMessage
                                                    : (u.systemRole?.[0]?.roleName || 'Member')
                                                }
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )
                ) : (
                    groups.length === 0 ? (
                        <div className="text-center text-slate-400 mt-12 text-xs">No group chats found</div>
                    ) : (
                        groups.map(g => {
                            const isGroupActive = isGroupChat && activeChatId === g.id;
                            return (
                                <div 
                                    key={g.id} 
                                    className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer flex items-center transition-all ${isGroupActive ? 'bg-blue-50/40 border-l-4 border-l-blue-600 pl-3' : ''}`}
                                    onClick={() => {
                                        setActiveChat(g.id, true);
                                        setView('chat');
                                    }}
                                >
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3 text-indigo-600 border border-indigo-200/80 shadow-sm shrink-0">
                                        <Users size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <span className="font-semibold text-xs text-slate-800 truncate">{g.name}</span>
                                            {unreadCounts.group[g.id] > 0 && (
                                                <span className="bg-blue-600 text-white font-bold rounded-full min-w-[18px] h-[18px] px-1 text-[9px] flex items-center justify-center scale-90">
                                                    {unreadCounts.group[g.id]}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 truncate">Group Chat</div>
                                    </div>
                                </div>
                            );
                        })
                    )
                )}
            </div>
        </div>
    );

    // Chat view rendering
    const renderChatArea = (isMobileLayout: boolean = false) => {
        if (!activeChatId) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/40 p-6 text-center select-none rounded-r-2xl">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 border border-blue-100/50 shadow-inner mb-3">
                        <MessageCircle size={28} />
                    </div>
                    <h3 className="font-bold text-sm text-slate-700 mb-1">Your Messenger</h3>
                    <p className="text-xs text-slate-400 max-w-[200px]">Select a contact or group to start sending real-time messages.</p>
                </div>
            );
        }

        return (
            <div className="flex-1 flex flex-col h-full bg-white relative rounded-r-2xl min-w-0">
                {/* Header */}
                <div className="bg-white border-b border-slate-100 p-3.5 flex justify-between items-center shadow-sm z-10 shrink-0">
                    <div className="flex items-center min-w-0">
                        {!isExpanded && (
                            <button onClick={() => setView('list')} className="hover:bg-slate-100 p-1.5 rounded-lg mr-1 text-slate-500 cursor-pointer">
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        {!isGroupChat && activeUser ? (
                            <div className="relative shrink-0 scale-90 -ml-1 mr-2">
                                <ChatUserAvatar user={activeUser} size="md" />
                                {isOnline && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></span>
                                )}
                            </div>
                        ) : (
                            <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-2 shrink-0 scale-90">
                                <Users size={16} />
                            </div>
                        )}
                        <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-800 truncate">
                                {isGroupChat && activeGroup ? activeGroup.name : activeUser ? `${activeUser.firstName} ${activeUser.lastName}` : 'Chat'}
                            </h4>
                            <span className="text-[10px] text-slate-400 block -mt-0.5">
                                {isGroupChat ? 'Group Chat' : isOnline ? 'Active now' : 'Offline'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 shrink-0">
                        {isGroupChat ? (
                            <button 
                                onClick={() => setShowGroupSettings(!showGroupSettings)} 
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${showGroupSettings ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
                                title="Group Details & Members"
                            >
                                <Users size={18} />
                            </button>
                        ) : (
                            <button 
                                onClick={handleDeleteDirectConversation} 
                                className="p-1.5 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-red-600 hover:bg-red-50"
                                title="Delete Conversation"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        {!isExpanded && (
                            <div className="flex items-center space-x-1">
                                <button onClick={() => setIsExpanded(true)} className="hover:bg-slate-100 p-1.5 rounded-lg text-slate-500 cursor-pointer" title="Expand layout">
                                    <Maximize2 size={16} />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="hover:bg-slate-100 p-1.5 rounded-lg text-slate-500 cursor-pointer">
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Conversation Body */}
                <div 
                    ref={messagesContainerRef} 
                    onScroll={handleScroll} 
                    className="flex-1 p-4 overflow-y-auto bg-slate-50/50 flex flex-col space-y-2"
                >
                    {isLoadingHistory && (
                        <div className="flex justify-center items-center py-2 shrink-0">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] text-slate-400 ml-1.5">Loading history...</span>
                        </div>
                    )}
                    
                    {messages.map((msg, index) => {
                        const isSender = msg.senderId === currentUserId;
                        const prevMsg = index > 0 ? messages[index - 1] : null;
                        
                        const isConsecutive = prevMsg && 
                            prevMsg.senderId === msg.senderId && 
                            (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 120000);

                        return (
                            <div 
                                key={msg.id} 
                                className={msg.isSystemMessage ? `w-full flex justify-center my-3` : `flex flex-col max-w-[85%] ${isSender ? 'self-end items-end' : 'self-start items-start'} ${isConsecutive ? '-mt-1' : 'mt-2'} group relative`}
                            >
                                {msg.isSystemMessage ? (
                                    <div className="bg-slate-100 text-slate-500 text-[10px] py-1 px-3 rounded-full italic shadow-sm">
                                        <span className="font-semibold text-slate-600">{users.find(u => u.id === msg.senderId)?.firstName || 'Someone'}</span> {msg.message}
                                    </div>
                                ) : (
                                    <>
                                        {isGroupChat && !isSender && !isConsecutive && (
                                    <span className="text-[9px] text-slate-400 font-bold ml-11 mb-0.5 tracking-wide">
                                        {users.find(u => u.id === msg.senderId)?.firstName || `User ${msg.senderId}`}
                                    </span>
                                )}
                                
                                <div className={`flex items-end relative group/bubble ${isSender ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {isGroupChat && !isSender && (
                                        <div className="mr-2 mb-1 shrink-0 flex items-end">
                                            {!isConsecutive ? (
                                                (() => {
                                                    const msgUser = users.find(u => u.id === msg.senderId);
                                                    return msgUser ? <ChatUserAvatar user={msgUser} size="sm" /> : <div className="w-8 h-8 bg-slate-200 rounded-full"></div>;
                                                })()
                                            ) : <div className="w-8 h-8"></div>}
                                        </div>
                                    )}
                                    <div 
                                        className={`p-2.5 shadow-sm text-xs max-w-full break-words select-text ${
                                            isSender 
                                                ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                                                : 'bg-slate-200/80 text-slate-800 rounded-2xl rounded-tl-sm'
                                        } ${
                                            isConsecutive 
                                                ? (isSender ? '!rounded-tr-2xl !rounded-r-md' : '!rounded-tl-2xl !rounded-l-md') 
                                                : ''
                                        } ${msg.id < 0 ? 'opacity-65' : ''} ${msg.sendFailed ? 'ring-1 ring-red-300' : ''} transition-all`}
                                    >
                                         {msg.replyToMessageId && (() => {
                                             const repliedMsg = messages.find(m => m.id === msg.replyToMessageId);
                                             const repliedContent = repliedMsg 
                                                 ? (repliedMsg.isUnsent ? "Message unsent" : (repliedMsg.message || "Attachment"))
                                                 : "Original message";
                                             return (
                                                 <div className={`border-l-2 pl-2 mb-1.5 text-[10px] rounded py-0.5 ${
                                                     isSender 
                                                         ? 'bg-black/10 border-white/50 text-white/80' 
                                                         : 'bg-black/5 border-slate-400/50 text-slate-600/90'
                                                 } italic truncate max-w-xs`}>
                                                     {repliedContent}
                                                 </div>
                                             );
                                         })()}
                                        {msg.isUnsent ? (
                                            <span className="text-slate-400/80 italic">
                                                {isSender ? "You unsent a message" : `${users.find(u => u.id === msg.senderId)?.firstName || 'Someone'} unsent a message`}
                                            </span>
                                        ) : (
                                            <>
                                                {msg.message && <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>}
                                                {msg.fileStorageId && (
                                                    <div className="mt-2 relative">
                                                        {msg.attachmentType?.startsWith('image/') ? (
                                                            <div 
                                                                className="cursor-pointer overflow-hidden rounded relative inline-block group/img"
                                                                onClick={() => setMaximizedMedia({ url: attachmentUrl(msg.id), type: 'image', name: msg.attachmentName || 'Image' })}
                                                            >
                                                                <img 
                                                                    src={attachmentUrl(msg.id)}
                                                                    alt={msg.attachmentName || "Attachment"} 
                                                                    className="max-w-[250px] max-h-[250px] object-cover bg-white/20 transition-transform duration-200 group-hover/img:scale-[1.02]"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                        const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                                                                        if (fallback) fallback.style.display = 'flex';
                                                                    }}
                                                                />
                                                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                                                                    <Maximize2 size={24} className="text-white opacity-0 group-hover/img:opacity-100 drop-shadow-md" />
                                                                </div>
                                                                <a 
                                                                    href={attachmentUrl(msg.id)}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="hidden items-center bg-white/10 hover:bg-white/20 border border-white/20 rounded px-3 py-2 transition-colors w-max max-w-full mt-1"
                                                                >
                                                                    <Paperclip size={16} className="mr-2 shrink-0"/> 
                                                                    <span className="text-xs font-medium truncate">{msg.attachmentName || 'Download File'}</span>
                                                                    <Download size={14} className="ml-3 shrink-0 opacity-70" />
                                                                </a>
                                                            </div>
                                                        ) : msg.attachmentType?.startsWith('video/') ? (
                                                            <div className="cursor-pointer overflow-hidden rounded relative inline-block group/vid">
                                                                <video 
                                                                    src={attachmentUrl(msg.id)}
                                                                    className="max-w-[250px] max-h-[250px] object-cover bg-black rounded"
                                                                    controls
                                                                />
                                                            </div>
                                                        ) : (
                                                            <a 
                                                                href={attachmentUrl(msg.id)}
                                                                target="_blank" 
                                                                rel="noreferrer"
                                                                className="flex items-center bg-white/10 hover:bg-white/20 border border-white/20 rounded px-3 py-2 transition-colors w-max max-w-full"
                                                                title="Download Attachment"
                                                            >
                                                                <Paperclip size={16} className="mr-2 shrink-0 text-current opacity-80"/> 
                                                                <span className="text-xs font-medium truncate max-w-[200px]">{msg.attachmentName || 'Download File'}</span>
                                                                <Download size={14} className="ml-3 shrink-0 opacity-70" />
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {!msg.isUnsent && (
                                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-75 flex items-center space-x-2 absolute -bottom-7 ${isSender ? 'right-0 flex-row-reverse space-x-reverse' : 'left-0'} select-none z-20`}>
                                        {/* Quick Reactions Emojis Group */}
                                        <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-100/70 rounded-full px-2 py-0.5 shadow-sm">
                                            {[
                                                { type: 'like', emoji: '👍' },
                                                { type: 'heart', emoji: '❤️' },
                                                { type: 'smile', emoji: '😄' },
                                                { type: 'shock', emoji: '😮' },
                                                { type: 'sad', emoji: '😢' },
                                                { type: 'angry', emoji: '😠' }
                                            ].map(r => (
                                                <button
                                                    key={r.type}
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleReaction(msg.id, r.type); }}
                                                    className="hover:scale-130 active:scale-95 transition-transform duration-75 cursor-pointer text-[13px] leading-none"
                                                    title={r.type.charAt(0).toUpperCase() + r.type.slice(1)}
                                                >
                                                    {r.emoji}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Actions Group */}
                                        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100/70 rounded-full px-2 py-1 shadow-sm text-slate-400">
                                            <button 
                                                onClick={() => {
                                                    setReplyToMessage(msg);
                                                    const isMobileScreen = window.innerWidth < 768;
                                                    if (isMobileScreen) {
                                                        mobileMessageInputRef.current?.focus();
                                                    } else {
                                                        desktopMessageInputRef.current?.focus();
                                                    }
                                                }} 
                                                className="hover:text-blue-500 hover:scale-115 transition-all cursor-pointer flex items-center justify-center"
                                                title="Reply"
                                            >
                                                <CornerUpLeft size={11} />
                                            </button>

                                            {isGroupChat && (
                                                <>
                                                    <span className="w-[1px] h-2 bg-slate-200"></span>
                                                    <button 
                                                        onClick={() => setMessageDetails(msg)} 
                                                        className="hover:text-blue-500 hover:scale-115 transition-all cursor-pointer flex items-center justify-center"
                                                        title="Message Details"
                                                    >
                                                        <Info size={11} />
                                                    </button>
                                                </>
                                            )}
                                            
                                            {isSender && (
                                                <>
                                                    <span className="w-[1px] h-2 bg-slate-200"></span>
                                                    <button 
                                                        onClick={() => handleUnsend(msg.id)} 
                                                        className="hover:text-red-500 hover:scale-115 transition-all cursor-pointer flex items-center justify-center"
                                                        title="Unsend"
                                                    >
                                                        <Trash2 size={11} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {isSender && msg.readReceipts?.length > 0 && !isConsecutive && (
                                    <span className="text-[8.5px] text-slate-400/80 mt-0.5 pr-1">Read</span>
                                )}
                                {msg.sendFailed && (
                                    <span className="text-[8.5px] text-red-500 mt-0.5 pr-1">Failed to send</span>
                                )}

                                {msg.reactions && msg.reactions.length > 0 && (
                                    <div className={`flex bg-white shadow-sm border border-slate-200/80 rounded-full px-1.5 py-0.5 z-10 text-[10px] items-center select-none ${isSender ? 'self-end mr-3' : (isGroupChat ? 'self-start ml-12' : 'self-start ml-3')} -mt-3.5 bg-white/95 backdrop-blur scale-95 origin-left`}>
                                        {Array.from(new Set(msg.reactions.map(r => r.reactionType))).map(type => {
                                            const emoji = type === 'like' ? '👍' : type === 'heart' ? '❤️' : type === 'smile' ? '😄' : type === 'sad' ? '😢' : type === 'angry' ? '😠' : type === 'shock' ? '😮' : '👍';
                                            const count = msg.reactions!.filter(r => r.reactionType === type).length;
                                            return (
                                                <span 
                                                    key={type} 
                                                    className="mr-1 cursor-pointer hover:scale-115 active:scale-90 transition-transform flex items-center" 
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleReaction(msg.id, type); }}
                                                >
                                                    {emoji} <span className="text-[9px] text-slate-500 font-bold">{count > 1 ? count : ''}</span>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                                    </>
                                )}
                            </div>
                        );
                    })}

                    {isSomeoneTyping && (
                        <div className="flex flex-col self-start mt-2">
                            <span className="text-[8.5px] text-slate-400 font-bold ml-3.5 mb-1">typing...</span>
                            <div className="flex space-x-1 items-center bg-slate-200/70 backdrop-blur rounded-full px-3 py-2 self-start ml-2 border border-slate-100 shadow-sm animate-pulse">
                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <div className="flex flex-col bg-white border-t border-slate-100 shrink-0">
                    {replyToMessage && (
                        <div className="px-4 py-2 bg-slate-50 text-[10px] text-slate-500 flex justify-between items-center border-b border-slate-100">
                            <div className="truncate border-l-2 border-blue-500 pl-2">
                                <span className="font-bold mr-1">Replying:</span> 
                                {replyToMessage.message || "Attachment"}
                            </div>
                            <button onClick={() => setReplyToMessage(null)} className="text-slate-400 hover:text-red-500 cursor-pointer">
                                <X size={12} />
                            </button>
                        </div>
                    )}
                    <div className="p-3 flex items-center space-x-2">
                        <label className="cursor-pointer text-slate-400 hover:text-blue-500 transition-colors p-1 hover:bg-slate-50 rounded-lg">
                            <Paperclip size={18} />
                            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                        </label>
                        <input
                            ref={isMobileLayout ? mobileMessageInputRef : desktopMessageInputRef}
                            type="text"
                            value={messageInput}
                            onChange={handleInputChange}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            className="flex-1 border border-slate-200 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-slate-50/50"
                            placeholder="Type a message..."
                        />
                        <button 
                            onClick={sendMessage} 
                            disabled={!messageInput.trim() && !file}
                            className="text-blue-600 hover:text-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors p-1.5 hover:bg-blue-50 rounded-full cursor-pointer"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    {file && (
                        <div className="px-4 py-1.5 bg-slate-50 text-[10px] text-slate-500 truncate flex justify-between border-t border-slate-100">
                            <span>Attached: {file.name}</span>
                            <button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700 cursor-pointer">
                                <X size={12} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Create Group Form
    const renderCreateGroup = () => (
        <div className="flex-1 flex flex-col h-full bg-white rounded-r-2xl min-w-0">
            <div className="bg-white border-b border-slate-100 p-4 flex items-center z-10 shrink-0">
                {!isExpanded && (
                    <button onClick={() => setView('list')} className="hover:bg-slate-100 p-1.5 rounded-lg mr-2 text-slate-500 cursor-pointer">
                        <ArrowLeft size={18} />
                    </button>
                )}
                <h4 className="font-bold text-xs text-slate-800">Create New Group</h4>
            </div>

            <div className="p-4 border-b border-slate-50 flex flex-col space-y-2 shrink-0 bg-white">
                <input
                    type="text"
                    placeholder="Group Name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-slate-50/50"
                />
                <input
                    type="text"
                    placeholder="Search users to add..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-slate-50/50"
                />
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/20 flex flex-col">
                {users.map(u => (
                    <div 
                        key={u.id} 
                        className="px-4 py-2.5 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleMemberSelection(u.id)}
                    >
                        <div className="flex items-center">
                            <ChatUserAvatar user={u} size="sm" />
                            <div className="ml-2.5">
                                <div className="font-semibold text-xs text-slate-800">{u.firstName} {u.lastName}</div>
                                <div className="text-[10px] text-slate-400">{u.systemRole?.[0]?.roleName || 'Member'}</div>
                            </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedMembers.includes(u.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200'}`}>
                            {selectedMembers.includes(u.id) && <Check size={12} />}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                <div className="flex space-x-2">
                    {isExpanded && (
                        <button 
                            onClick={() => setView('chat')}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg py-2.5 text-xs font-bold transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                    )}
                    <button 
                        onClick={handleCreateGroup} 
                        disabled={!groupName.trim() || selectedMembers.length === 0}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg py-2.5 text-xs font-bold hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                    >
                        Create Group
                    </button>
                </div>
            </div>
        </div>
    );

    // Message Details rendering
    const renderMessageDetails = () => {
        if (!messageDetails) return null;

        // Resolve sender name
        let senderName = "Unknown User";
        if (messageDetails.senderId === currentUserId) {
            senderName = "You";
        } else if (activeChatId && isGroupChat) {
            const member = groupMembers.find(m => m.systemUserId === messageDetails.senderId);
            if (member) senderName = `${member.firstName} ${member.lastName}`;
        } else {
            const user = users.find(u => u.id === messageDetails.senderId);
            if (user) senderName = `${user.firstName} ${user.lastName}`;
        }

        // Parse read receipts
        const seenList = (messageDetails.readReceipts || []).map(r => {
            let name = `User ID ${r.systemUserId}`;
            if (r.systemUserId === currentUserId) name = "You";
            else {
                const member = groupMembers.find(m => m.systemUserId === r.systemUserId);
                if (member) name = `${member.firstName} ${member.lastName}`;
            }
            return { name, date: new Date(r.readAt).toLocaleString() };
        });

        // Parse reactions
        const reactionList = (messageDetails.reactions || []).map(r => {
            let name = `User ID ${r.systemUserId}`;
            if (r.systemUserId === currentUserId) name = "You";
            else {
                const member = groupMembers.find(m => m.systemUserId === r.systemUserId);
                if (member) name = `${member.firstName} ${member.lastName}`;
            }
            const emoji = r.reactionType === 'like' ? '👍' : r.reactionType === 'heart' ? '❤️' : r.reactionType === 'smile' ? '😄' : r.reactionType === 'sad' ? '😢' : r.reactionType === 'angry' ? '😠' : r.reactionType === 'shock' ? '😮' : '👍';
            return { name, emoji, date: new Date(r.createdAt).toLocaleString() };
        });

        return (
            <div className="absolute inset-0 bg-white/98 backdrop-blur-sm z-[99999] flex flex-col rounded-2xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white rounded-t-2xl shadow-sm z-10">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center">
                        <Info size={16} className="mr-2 text-blue-500" />
                        Message Details
                    </h3>
                    <button onClick={() => setMessageDetails(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer">
                        <X size={18} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 shadow-sm">
                        <div className="text-[10px] text-slate-400 mb-2 uppercase font-bold tracking-wider">Message Info</div>
                        {messageDetails.message && <p className="text-sm text-slate-700 whitespace-pre-wrap">{messageDetails.message}</p>}
                        {messageDetails.fileStorageId && (
                            <div className="mt-2 flex items-center text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded border border-blue-100">
                                <Paperclip size={14} className="mr-1.5" /> Attachment Included
                            </div>
                        )}
                        <div className="mt-3 flex items-center text-[10px] text-slate-500">
                            <span className="font-semibold text-slate-600">{senderName}</span>
                            <span className="mx-1.5">•</span>
                            <span>{new Date(messageDetails.createdAt).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center">
                            <Check size={12} className="mr-1" /> Seen By ({seenList.length})
                        </div>
                        {seenList.length === 0 ? (
                            <div className="text-xs text-slate-400 italic px-2">No one has seen this yet.</div>
                        ) : (
                            <div className="space-y-1.5">
                                {seenList.map((s, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white border border-slate-100 px-3 py-2.5 rounded-lg text-xs shadow-sm">
                                        <span className="font-medium text-slate-700">{s.name}</span>
                                        <span className="text-[10px] text-slate-400">{s.date}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 pb-4">
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center">
                            <Smile size={12} className="mr-1" /> Reactions ({reactionList.length})
                        </div>
                        {reactionList.length === 0 ? (
                            <div className="text-xs text-slate-400 italic px-2">No reactions yet.</div>
                        ) : (
                            <div className="space-y-1.5">
                                {reactionList.map((r, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white border border-slate-100 px-3 py-2.5 rounded-lg text-xs shadow-sm">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-base leading-none">{r.emoji}</span>
                                            <span className="font-medium text-slate-700">{r.name}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400">{r.date}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Group Info & Settings view rendering
    const renderGroupSettings = () => {
        if (!activeGroup) return null;
        
        const currentUserMember = groupMembers.find(m => m.systemUserId === currentUserId);
        const isCurrentUserAdmin = currentUserMember?.isAdmin === true;

        return (
            <div className={`flex flex-col bg-white h-full ${isExpanded ? 'w-[240px] border-l border-slate-100 animate-in slide-in-from-right duration-200 shrink-0' : 'w-full'}`}>
                {/* Header for mobile/collapsible view */}
                {!isExpanded && (
                    <div className="bg-white border-b border-slate-100 p-3.5 flex items-center z-10 shrink-0">
                        <button onClick={() => setShowGroupSettings(false)} className="hover:bg-slate-100 p-1.5 rounded-lg mr-2 text-slate-500 cursor-pointer">
                            <ArrowLeft size={18} />
                        </button>
                        <h4 className="font-bold text-xs text-slate-800">Group Info</h4>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
                    {/* Info Card */}
                    <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
                        <div className="relative group/logo w-16 h-16 rounded-full shadow-md mb-2 shrink-0">
                            <img 
                                src={`https://ams.erc.ph/api/chat/group/${activeGroup.id}/logo`} 
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                }}
                                alt={activeGroup.name} 
                                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200/50"
                            />
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full items-center justify-center border-2 border-indigo-200/50 shadow-md hidden absolute top-0 left-0">
                                <Users size={24} />
                            </div>
                            
                            {isCurrentUserAdmin && (
                                <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity cursor-pointer text-white">
                                    <Plus size={20} />
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                handleUpdateSettings(groupSettingsName, groupSettingsDesc, e.target.files[0]);
                                            }
                                        }} 
                                    />
                                </label>
                            )}
                        </div>
                        {isCurrentUserAdmin ? (
                            <div className="w-full space-y-2">
                                <input
                                    type="text"
                                    value={groupSettingsName}
                                    onChange={(e) => setGroupSettingsName(e.target.value)}
                                    className="text-center font-bold text-xs text-slate-800 border border-slate-100 hover:border-slate-300 focus:border-blue-500 focus:outline-none rounded py-1 px-1.5 w-full bg-slate-50/50"
                                    onBlur={() => handleUpdateSettings(groupSettingsName, groupSettingsDesc)}
                                    title="Click to edit group name"
                                />
                                <textarea
                                    value={groupSettingsDesc}
                                    onChange={(e) => setGroupSettingsDesc(e.target.value)}
                                    placeholder="Add group description..."
                                    className="text-center text-[10px] text-slate-500 border border-slate-100 hover:border-slate-300 focus:border-blue-500 focus:outline-none rounded py-1 px-1.5 w-full bg-slate-50/50 resize-none h-12"
                                    onBlur={() => handleUpdateSettings(groupSettingsName, groupSettingsDesc)}
                                    title="Click to edit group description"
                                />
                            </div>
                        ) : (
                            <>
                                <h4 className="font-bold text-xs text-slate-800">{activeGroup.name}</h4>
                                <p className="text-[10px] text-slate-400 mt-1 max-w-full break-words">{activeGroup.description || 'No description added'}</p>
                            </>
                        )}
                    </div>

                    {/* Add Member sub-section (Admins only) */}
                    {isCurrentUserAdmin && (
                        <div className="pb-4 border-b border-slate-100 relative">
                            <h5 className="font-bold text-[9px] text-slate-400 uppercase tracking-wider mb-2">Add Member</h5>
                            <input
                                type="text"
                                placeholder="Search users to add..."
                                value={groupSearchQuery}
                                onChange={async (e) => {
                                    const val = e.target.value;
                                    setGroupSearchQuery(val);
                                    if (val.trim() === '') {
                                        setGroupSearchUsers([]);
                                        return;
                                    }
                                    try {
                                        const response = await getUsers({ page: 1, pageSize: 50, searchString: val });
                                        if (response?.data?.items) {
                                            const filtered = response.data.items.filter(u => 
                                                u.id !== currentUserId && 
                                                !groupMembers.some(m => m.systemUserId === u.id)
                                            );
                                            setGroupSearchUsers(filtered.slice(0, 5));
                                        }
                                    } catch (err) {
                                        console.error("Failed to search users for group settings", err);
                                    }
                                }}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-[10px] focus:outline-none bg-slate-50 focus:bg-white"
                            />
                            {groupSearchQuery.trim() !== '' && (
                                <div className="absolute left-0 right-0 mt-1 border border-slate-100 rounded bg-white shadow-lg max-h-32 overflow-y-auto z-[99]">
                                    {groupSearchUsers.length === 0 ? (
                                        <div className="p-2 text-center text-[10px] text-slate-400">No users found</div>
                                    ) : (
                                        groupSearchUsers.map(u => (
                                            <div 
                                                key={u.id} 
                                                className="p-2 border-b border-slate-50 hover:bg-slate-50 flex justify-between items-center cursor-pointer"
                                                onClick={() => {
                                                    handleAddMemberToGroup(u.id);
                                                    setGroupSearchQuery('');
                                                }}
                                            >
                                                <span className="text-[10px] text-slate-700 truncate font-semibold">{u.firstName} {u.lastName}</span>
                                                <Plus size={12} className="text-blue-500 shrink-0" />
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Members List */}
                    <div className="flex-1 flex flex-col min-h-[150px]">
                        <h5 className="font-bold text-[9px] text-slate-400 uppercase tracking-wider mb-2">Members ({groupMembers.length})</h5>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {groupMembers.map(member => (
                                <div key={member.id} className="flex items-center justify-between group/member select-none py-1">
                                    <div className="flex items-center min-w-0">
                                        <div className="w-6.5 h-6.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-bold rounded-full flex items-center justify-center shrink-0">
                                            {member.firstName?.[0]}{member.lastName?.[0]}
                                        </div>
                                        <div className="ml-2 min-w-0">
                                            <span className="text-[10px] text-slate-700 font-bold truncate block leading-tight">{member.firstName} {member.lastName}</span>
                                            {member.isAdmin && (
                                                <span className="bg-indigo-50 text-indigo-600 border border-indigo-100/30 font-bold rounded-full px-1 text-[8px] tracking-wide mt-0.5 inline-block">
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Admin Action Overlay */}
                                    {isCurrentUserAdmin && member.systemUserId !== currentUserId && member.systemUserId !== activeGroup.createdBySystemUserId && (
                                        <div className="opacity-0 group-hover/member:opacity-100 transition-opacity flex space-x-1 shrink-0 ml-1">
                                            <button 
                                                onClick={() => handleAssignAdmin(member.systemUserId, !member.isAdmin)}
                                                className="text-[9px] bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 px-1 py-0.5 rounded cursor-pointer transition-colors"
                                                title={member.isAdmin ? "Revoke Admin" : "Make Admin"}
                                            >
                                                {member.isAdmin ? "Revoke" : "Admin"}
                                            </button>
                                            <button 
                                                onClick={() => handleKickMember(member.systemUserId)}
                                                className="text-[9px] bg-slate-50 hover:bg-red-50 hover:text-red-600 border border-slate-100 px-1 py-0.5 rounded cursor-pointer transition-colors"
                                                title="Remove Member"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-3 border-t border-slate-100 bg-slate-50 shrink-0 space-y-2">
                    <button 
                        onClick={handleLeaveGroup}
                        className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/50 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center"
                    >
                        Leave Group
                    </button>
                    {isCurrentUserAdmin && (
                        <button 
                            onClick={handleDeleteGroup}
                            className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center"
                        >
                            Delete Group
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // Responsive sizing layouts
    let widgetSizeClasses = 'w-[calc(100vw-24px)] h-[80vh] max-h-[560px] md:w-80 md:h-[450px]';
    if (isExpanded) {
        widgetSizeClasses = showGroupSettings 
            ? 'w-[calc(100vw-24px)] h-[80vh] max-h-[560px] md:w-[980px] md:h-[550px]' 
            : 'w-[calc(100vw-24px)] h-[80vh] max-h-[560px] md:w-[750px] md:h-[550px]';
    }

    return (
        <div className={`fixed bottom-3 right-3 md:bottom-6 md:right-6 ${widgetSizeClasses} bg-white/95 backdrop-blur border border-slate-200/70 rounded-2xl shadow-2xl flex z-[9999] overflow-hidden transition-all duration-300 ease-out`}>
            {isExpanded ? (
                // Expandable three-pane layout (visible side-by-side on desktop, progressive on mobile)
                <>
                    <div className="hidden md:flex h-full w-full">
                        {renderSidebar()}
                        {view === 'createGroup' ? renderCreateGroup() : renderChatArea(false)}
                        {showGroupSettings && view !== 'createGroup' && renderGroupSettings()}
                    </div>
                    <div className="flex md:hidden h-full w-full">
                        {view === 'list' && renderSidebar()}
                        {view === 'chat' && !showGroupSettings && renderChatArea(true)}
                        {view === 'chat' && showGroupSettings && renderGroupSettings()}
                        {view === 'createGroup' && renderCreateGroup()}
                    </div>
                </>
            ) : (
                // Collapsible single-pane layout
                <>
                    {view === 'list' && renderSidebar()}
                    {view === 'chat' && !showGroupSettings && renderChatArea(false)}
                    {view === 'chat' && showGroupSettings && renderGroupSettings()}
                    {view === 'createGroup' && renderCreateGroup()}
                </>
            )}
            
            {/* Overlay for Message Details */}
            {renderMessageDetails()}

            {/* Overlay for Maximized Media */}
            {maximizedMedia && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-10"
                    onClick={() => setMaximizedMedia(null)}
                >
                    <button 
                        className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 p-2 rounded-full backdrop-blur-sm transition-colors z-[110]"
                        onClick={(e) => { e.stopPropagation(); setMaximizedMedia(null); }}
                    >
                        <X size={24} />
                    </button>
                    
                    <div 
                        className="relative max-w-full max-h-full flex flex-col items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {maximizedMedia.type === 'image' ? (
                            <img 
                                src={maximizedMedia.url} 
                                alt={maximizedMedia.name} 
                                className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl"
                            />
                        ) : (
                            <video 
                                src={maximizedMedia.url} 
                                controls 
                                autoPlay
                                className="max-w-full max-h-[85vh] rounded shadow-2xl bg-black"
                            />
                        )}
                        <div className="mt-4 flex items-center justify-center">
                            <a 
                                href={maximizedMedia.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-colors text-sm font-medium"
                            >
                                <Download size={16} className="mr-2" />
                                Download {maximizedMedia.name}
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
