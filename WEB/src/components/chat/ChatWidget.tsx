import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { signalRService } from '../../services/signalrService';
import { MessageCircle, X, Send, Paperclip, ArrowLeft, Users, User as UserIcon, Plus, Check } from 'lucide-react';
import { ChatMessage, ChatGroup } from '../../types/chat';
import { getUsers, getUserPhoto } from '../../api/user-management/userApi';
import { User } from '../../types';
import { secureStorage } from '../../utils/secureStorage';
import axiosInstance from '../../lib/axios';

const ChatUserAvatar: React.FC<{ user: User }> = ({ user }) => {
    const [imageUrl, setImageUrl] = useState<string | undefined>();

    useEffect(() => {
        let isMounted = true;
        const loadProfilePicture = async () => {
            if (!user?.profilePictureStorageFile?.id) return;
            try {
                const systemUserId = secureStorage.getItem('systemUserId') || '';
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
    }, [user]);

    if (imageUrl) {
        return <img src={imageUrl} alt={user.firstName} className="w-10 h-10 rounded-full object-cover mr-3 border border-gray-200 shadow-sm" />;
    }

    return (
        <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center mr-3 text-blue-700 font-bold border border-blue-300 shadow-sm shrink-0">
            {user.firstName?.[0]}{user.lastName?.[0]}
        </div>
    );
};

export const ChatWidget: React.FC = () => {
    const { isOpen, setIsOpen, messages, activeChatId, setActiveChat, isGroupChat, onlineUsers, typingUsers, unreadCounts, setMessages, prependMessages, hasMoreHistory, setHasMoreHistory, groups, setGroups, addGroup } = useChatStore();
    const [messageInput, setMessageInput] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [view, setView] = useState<'list' | 'chat' | 'createGroup'>('list');
    const [listTab, setListTab] = useState<'users' | 'groups'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    
    // Create group state
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
    const [reactionMenuId, setReactionMenuId] = useState<number | null>(null);
    const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const systemUserIdStr = secureStorage.getItem('systemUserId');
    const currentUserId = systemUserIdStr ? parseInt(systemUserIdStr, 10) : 1;

    useEffect(() => {
        signalRService.startConnection(currentUserId);
    }, []);

    useEffect(() => {
        if (isOpen) {
            const fetchGroups = async () => {
                try {
                    const response = await axiosInstance.get(`/chat/groups/${currentUserId}`);
                    const data = response.data;
                    if (data.isSuccess) {
                        setGroups(data.data);
                        // Join all groups in SignalR
                        data.data.forEach((g: ChatGroup) => {
                            signalRService.joinGroup(g.id);
                        });
                    }
                } catch (err) { console.error("Failed to fetch groups", err); }
            };
            fetchGroups();
        }
    }, [isOpen, setGroups]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen && (view === 'list' || view === 'createGroup')) {
                fetchContacts(searchQuery);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, isOpen, view]);

    const fetchContacts = async (search?: string) => {
        setIsSearching(true);
        try {
            const response = await getUsers({ page: 1, pageSize: 50, searchString: search });
            if (response?.data?.items) {
                setUsers(response.data.items.filter(u => u.id !== currentUserId));
            }
        } catch (err) {
            console.error("Failed to load users", err);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        if (isOpen && activeChatId && view === 'chat') {
            fetchHistory(true);
        }
    }, [isOpen, activeChatId, view]);

    const fetchHistory = async (initial = false) => {
        if (!activeChatId || isLoadingHistory || (!initial && !hasMoreHistory)) return;

        setIsLoadingHistory(true);
        try {
            let url = isGroupChat 
                ? `/chat/history/group/${activeChatId}?limit=20` 
                : `/chat/history/direct/${activeChatId}?currentUserId=${currentUserId}`;

            if (!initial && messages.length > 0) {
                const realOldest = messages.find(m => m.id > 0)?.id;
                if (realOldest) {
                    url += `&beforeMessageId=${realOldest}`;
                }
            }

            const response = await axiosInstance.get(url);
            const data = response.data;
            
            if (data.isSuccess) {
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

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (e.currentTarget.scrollTop === 0) {
            fetchHistory();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessageInput(e.target.value);
        
        if (activeChatId) {
            if (!typingTimeoutRef.current) {
                signalRService.sendTypingStarted(isGroupChat ? undefined : activeChatId, isGroupChat ? activeChatId : undefined);
            } else {
                clearTimeout(typingTimeoutRef.current);
            }
            
            typingTimeoutRef.current = setTimeout(() => {
                signalRService.sendTypingStopped(isGroupChat ? undefined : activeChatId, isGroupChat ? activeChatId : undefined);
                typingTimeoutRef.current = null;
            }, 2000);
        }
    };

    const sendMessage = async () => {
        if (!messageInput.trim() && !file) return;

        const formData = new FormData();
        formData.append('senderId', currentUserId.toString());
        if (isGroupChat && activeChatId) formData.append('groupId', activeChatId.toString());
        else if (activeChatId) formData.append('receiverId', activeChatId.toString());
        
        if (replyToMessage) formData.append('replyToMessageId', replyToMessage.id.toString());
        if (messageInput.trim()) formData.append('message', messageInput.trim());
        if (file) formData.append('file', file);

        setMessageInput('');
        setFile(null);
        setReplyToMessage(null);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
            signalRService.sendTypingStopped(isGroupChat ? undefined : activeChatId, isGroupChat ? activeChatId : undefined);
        }

        try {
            await axiosInstance.post('/chat/send', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setTimeout(scrollToBottom, 100);
        } catch (error) {
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
            if (data.isSuccess) {
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
        const endpoint = hasReacted ? '/chat/reaction/remove' : '/chat/reaction/add';
        
        try {
            await axiosInstance.post(endpoint, {
                messageId,
                systemUserId: currentUserId,
                reactionType
            });
        } catch (err) {
            console.error("Failed to toggle reaction", err);
        }
    };

    const handleUnsend = async (messageId: number) => {
        try {
            await axiosInstance.post(`/chat/unsend/${messageId}?systemUserId=${currentUserId}`);
        } catch (err) {
            console.error("Failed to unsend message", err);
        }
    };

    if (!isOpen) {
        const directCount = Object.values(unreadCounts.direct || {}).reduce((a, b) => a + b, 0);
        const groupCount = Object.values(unreadCounts.group || {}).reduce((a, b) => a + b, 0);
        const totalUnread = directCount + groupCount;

        return (
            <div className="fixed bottom-4 right-4 z-[9999]">
                <button
                    onClick={() => setIsOpen(true)}
                    className="relative bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                >
                    <MessageCircle size={24} />
                    {totalUnread > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                            {totalUnread}
                        </span>
                    )}
                </button>
            </div>
        );
    }

    if (view === 'createGroup') {
        return (
            <div className="fixed bottom-4 right-4 w-80 h-96 bg-white border border-gray-200 rounded-lg shadow-2xl flex flex-col z-[9999]">
                <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center relative">
                    <div className="flex items-center">
                        <button onClick={() => setView('list')} className="hover:text-gray-200 mr-2">
                            <ArrowLeft size={18} />
                        </button>
                        <span className="font-semibold text-sm">New Group Chat</span>
                    </div>
                </div>
                <div className="p-3 border-b bg-white flex flex-col space-y-2">
                    <input
                        type="text"
                        placeholder="Group Name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:border-blue-500 bg-gray-50"
                    />
                    <input
                        type="text"
                        placeholder="Search users to add..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:border-blue-500 bg-gray-50"
                    />
                </div>
                <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
                    {users.map(u => (
                        <div 
                            key={u.id} 
                            className="p-2 border-b hover:bg-gray-100 cursor-pointer flex items-center relative"
                            onClick={() => toggleMemberSelection(u.id)}
                        >
                            <div className={`w-5 h-5 rounded-md border mr-3 flex items-center justify-center ${selectedMembers.includes(u.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                {selectedMembers.includes(u.id) && <Check size={14} className="text-white" />}
                            </div>
                            <ChatUserAvatar user={u} />
                            <div className="flex-1">
                                <div className="font-medium text-sm text-gray-800">{u.firstName} {u.lastName}</div>
                                <div className="text-xs text-gray-500">{u.systemRole?.[0]?.roleName || 'No Role'}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-3 border-t bg-white">
                    <button 
                        onClick={handleCreateGroup} 
                        disabled={!groupName.trim() || selectedMembers.length === 0}
                        className="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Create Group
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'list') {
        return (
            <div className="fixed bottom-4 right-4 w-80 h-[450px] bg-white border border-gray-200 rounded-lg shadow-2xl flex flex-col z-[9999]">
                <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center relative">
                    <span className="font-semibold">Messages</span>
                    <button onClick={() => setIsOpen(false)} className="hover:text-gray-200">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex border-b bg-white text-sm font-medium">
                    <button 
                        onClick={() => setListTab('users')}
                        className={`flex-1 py-2 flex items-center justify-center ${listTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <UserIcon size={16} className="mr-1" /> Users
                    </button>
                    <button 
                        onClick={() => setListTab('groups')}
                        className={`flex-1 py-2 flex items-center justify-center ${listTab === 'groups' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users size={16} className="mr-1" /> Groups
                    </button>
                </div>
                
                {listTab === 'users' && (
                    <div className="p-2 border-b bg-white relative">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border rounded-full focus:outline-none focus:border-blue-500 bg-gray-50"
                        />
                    </div>
                )}
                
                {listTab === 'groups' && (
                    <div className="p-2 border-b bg-white flex justify-between items-center">
                        <span className="text-sm text-gray-500 font-medium px-1">Your Groups</span>
                        <button 
                            onClick={() => setView('createGroup')}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                        >
                            <Plus size={16} className="mr-1" /> Create
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
                    {listTab === 'users' ? (
                        isSearching ? (
                            <div className="text-center text-gray-500 mt-10 text-sm">Searching...</div>
                        ) : users.length === 0 ? (
                            <div className="text-center text-gray-500 mt-10 text-sm">No users found.</div>
                        ) : (
                            users.map(u => (
                                <div 
                                    key={u.id} 
                                    className="p-3 border-b hover:bg-gray-100 cursor-pointer flex items-center relative"
                                    onClick={() => {
                                        setActiveChat(u.id, false);
                                        setView('chat');
                                    }}
                                >
                                    <ChatUserAvatar user={u} />
                                    <div className="flex-1">
                                        <div className="font-medium text-sm text-gray-800">{u.firstName} {u.lastName}</div>
                                        <div className="text-xs text-gray-500">{u.systemRole?.[0]?.roleName || 'No Role'}</div>
                                    </div>
                                    {onlineUsers.includes(u.id) && <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-green-400 rounded-full"></span>}
                                </div>
                            ))
                        )
                    ) : (
                        groups.length === 0 ? (
                            <div className="text-center text-gray-500 mt-10 text-sm">No groups found.</div>
                        ) : (
                            groups.map(g => (
                                <div 
                                    key={g.id} 
                                    className="p-3 border-b hover:bg-gray-100 cursor-pointer flex items-center"
                                    onClick={() => {
                                        setActiveChat(g.id, true);
                                        setView('chat');
                                    }}
                                >
                                    <div className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center mr-3 text-indigo-700 font-bold border border-indigo-300 shadow-sm shrink-0">
                                        <Users size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-sm text-gray-800">{g.name}</div>
                                        <div className="text-xs text-gray-500">Group Chat</div>
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>
        );
    }

    const isOnline = !isGroupChat && activeChatId && onlineUsers.includes(activeChatId);
    const chatKey = isGroupChat ? `group_${activeChatId}` : `user_${activeChatId}`;
    const typingList = typingUsers[chatKey] || [];
    const isSomeoneTyping = typingList.length > 0 && !(typingList.length === 1 && typingList[0] === currentUserId);
    const activeUser = users.find(u => u.id === activeChatId);
    const activeGroup = groups.find(g => g.id === activeChatId);

    return (
        <div className="fixed bottom-4 right-4 w-80 h-[450px] bg-white border border-gray-200 rounded-lg shadow-2xl flex flex-col z-[9999]">
            {/* Header */}
            <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center relative">
                <div className="flex items-center">
                    <button onClick={() => setView('list')} className="hover:text-gray-200 mr-2">
                        <ArrowLeft size={18} />
                    </button>
                    {!isGroupChat && activeUser && (
                        <div className="scale-75 -ml-2 -mr-1">
                            <ChatUserAvatar user={activeUser} />
                        </div>
                    )}
                    {isGroupChat && (
                        <div className="scale-75 -ml-2 -mr-1 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Users size={20} className="text-white" />
                        </div>
                    )}
                    <span className="font-semibold text-sm truncate max-w-[150px]">
                        {isGroupChat && activeGroup ? activeGroup.name : activeUser ? `${activeUser.firstName} ${activeUser.lastName}` : 'Chat'}
                    </span>
                    {isOnline && <span className="w-2 h-2 bg-green-400 rounded-full ml-2 shrink-0"></span>}
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:text-gray-200 shrink-0">
                    <X size={20} />
                </button>
            </div>

            {/* Chat Area */}
            <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 p-3 overflow-y-auto bg-gray-50 flex flex-col space-y-2">
                {isLoadingHistory && <div className="text-center text-xs text-gray-400 py-1">Loading older messages...</div>}
                
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.senderId === currentUserId ? 'self-end items-end' : 'self-start items-start'} group`}>
                        {isGroupChat && msg.senderId !== currentUserId && (
                            <span className="text-[10px] text-gray-500 ml-1 mb-0.5 font-medium">User {msg.senderId}</span>
                        )}
                        <div className="flex items-center relative">
                            {msg.senderId === currentUserId && !msg.isUnsent && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity mr-2 flex space-x-1">
                                    <button onClick={() => setReactionMenuId(reactionMenuId === msg.id ? null : msg.id)} className="text-gray-400 hover:text-blue-500 bg-white shadow-sm rounded-full p-1 border">😀</button>
                                    <button onClick={() => setReplyToMessage(msg)} className="text-gray-400 hover:text-blue-500 bg-white shadow-sm rounded-full p-1 border" title="Reply">↩️</button>
                                    <button onClick={() => handleUnsend(msg.id)} className="text-gray-400 hover:text-red-500 bg-white shadow-sm rounded-full p-1 border" title="Unsend">🗑️</button>
                                </div>
                            )}

                            <div className={`p-2 rounded-lg ${msg.senderId === currentUserId ? 'bg-blue-100' : 'bg-gray-200'} ${msg.id < 0 ? 'opacity-50' : ''}`}>
                                {msg.replyToMessageId && (
                                    <div className="bg-white/50 border-l-2 border-blue-400 pl-2 mb-1 text-xs text-gray-500 italic rounded">
                                        Replying to a message...
                                    </div>
                                )}
                                {msg.isUnsent ? (
                                    <span className="text-gray-500 italic text-sm">Message unsent</span>
                                ) : (
                                    <>
                                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                        {msg.fileStorageId && (
                                            <span className="text-xs text-blue-500 flex items-center mt-1">
                                                <Paperclip size={12} className="mr-1"/> Attachment
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>

                            {msg.senderId !== currentUserId && !msg.isUnsent && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex space-x-1">
                                    <button onClick={() => setReactionMenuId(reactionMenuId === msg.id ? null : msg.id)} className="text-gray-400 hover:text-blue-500 bg-white shadow-sm rounded-full p-1 border">😀</button>
                                    <button onClick={() => setReplyToMessage(msg)} className="text-gray-400 hover:text-blue-500 bg-white shadow-sm rounded-full p-1 border" title="Reply">↩️</button>
                                </div>
                            )}

                            {reactionMenuId === msg.id && (
                                <div className={`absolute top-0 ${msg.senderId === currentUserId ? 'right-full mr-10' : 'left-full ml-10'} -mt-8 bg-white border shadow-lg rounded-full px-2 py-1 flex space-x-2 z-50`}>
                                    {['like', 'heart', 'smile', 'sad', 'angry', 'shock'].map(type => {
                                        const emoji = type === 'like' ? '👍' : type === 'heart' ? '❤️' : type === 'smile' ? '😄' : type === 'sad' ? '😢' : type === 'angry' ? '😠' : '😮';
                                        return <button key={type} onClick={() => handleReaction(msg.id, type)} className="hover:scale-125 transition-transform">{emoji}</button>;
                                    })}
                                </div>
                            )}
                        </div>
                        {msg.senderId === currentUserId && msg.readReceipts?.length > 0 && (
                            <span className="text-[10px] text-gray-400 mt-0.5">Read</span>
                        )}
                        {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex bg-white shadow-sm border rounded-full px-1.5 py-0.5 -mt-3 z-10 text-xs self-start ml-2">
                                {Array.from(new Set(msg.reactions.map(r => r.reactionType))).map(type => {
                                    const emoji = type === 'like' ? '👍' : type === 'heart' ? '❤️' : type === 'smile' ? '😄' : type === 'sad' ? '😢' : type === 'angry' ? '😠' : type === 'shock' ? '😮' : '👍';
                                    const count = msg.reactions!.filter(r => r.reactionType === type).length;
                                    return <span key={type} className="mr-1 cursor-pointer" onClick={() => handleReaction(msg.id, type)}>{emoji} {count > 1 ? count : ''}</span>;
                                })}
                            </div>
                        )}
                    </div>
                ))}

                {isSomeoneTyping && (
                    <div className="text-xs text-gray-500 italic self-start mt-2">
                        Someone is typing...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {replyToMessage && (
                <div className="px-3 py-2 bg-gray-100 text-xs text-gray-600 flex justify-between items-center border-t border-blue-200">
                    <div className="truncate border-l-2 border-blue-500 pl-2">
                        <span className="font-semibold mr-1">Replying to:</span> 
                        {replyToMessage.message || "Attachment"}
                    </div>
                    <button onClick={() => setReplyToMessage(null)} className="text-gray-500 hover:text-red-500 ml-2">
                        <X size={14} />
                    </button>
                </div>
            )}
            <div className="p-2 border-t bg-white flex items-center space-x-2 rounded-b-lg">
                <label className="cursor-pointer text-gray-500 hover:text-blue-600">
                    <Paperclip size={18} />
                    <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
                <input
                    type="text"
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 border rounded-full px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 bg-gray-50"
                    placeholder="Type a message..."
                />
                <button onClick={sendMessage} className="text-blue-600 hover:text-blue-800">
                    <Send size={18} />
                </button>
            </div>
            {file && (
                <div className="px-3 py-1 bg-gray-100 text-xs text-gray-600 truncate flex justify-between border-t rounded-b-lg">
                    <span>Attached: {file.name}</span>
                    <button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700">
                        <X size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};
