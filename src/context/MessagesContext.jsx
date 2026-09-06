import { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from "react";
import { StreamChat } from "stream-chat";
import { chatApi } from "../services/chatApi";
import { supportApi } from "../services/authApi";
import { messageApi } from "../services/messageApi";
import { useAuth } from "./AuthContext";
import { formatGHS } from "../constants/landDetails";

const MessagesContext = createContext(null);

function initialsFrom(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

function formatMessageTime(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function MessagesProvider({ children }) {
  const { user, isAuthed } = useAuth();
  const [client, setClient] = useState(null);
  const [rawChannels, setRawChannels] = useState([]);
  const [dbConversations, setDbConversations] = useState([]);
  const [conversationMessagesMap, setConversationMessagesMap] = useState({});
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [updateTick, setUpdateTick] = useState(0);

  const clientRef = useRef(null);

  // 1. Fetch persistent conversations from backend PostgreSQL database
  const refreshDbConversations = useCallback(async () => {
    if (!isAuthed || !user) {
      setDbConversations([]);
      return;
    }

    try {
      const [listRes, supportRes] = await Promise.allSettled([
        messageApi.list(),
        supportApi.getConversation(),
      ]);

      const list = listRes.status === "fulfilled" && Array.isArray(listRes.value) ? listRes.value : [];
      const supportData = supportRes.status === "fulfilled" ? supportRes.value : null;

      const unifiedList = [...list];

      // If support conversation exists with messages or ID and isn't already in list, include it
      if (supportData && (supportData.id || (supportData.messages && supportData.messages.length > 0))) {
        const hasSupportInList = unifiedList.some(
          (c) => c.isSupport || c.id === supportData.id || c.type === "SUPPORT"
        );
        if (!hasSupportInList) {
          const lastMsg = supportData.messages && supportData.messages[supportData.messages.length - 1];
          unifiedList.unshift({
            id: supportData.id || "support",
            landId: null,
            landTitle: "Support Inquiry",
            isSupport: true,
            type: "SUPPORT",
            otherPartyId: "support",
            otherPartyName: "Support (Admin)",
            otherPartyRole: "ADMIN",
            lastMessageText: lastMsg ? lastMsg.body || lastMsg.message || lastMsg.text : "Support inquiry",
            lastMessageAt: lastMsg ? lastMsg.createdAt : new Date().toISOString(),
            unreadCount: 0,
          });
        }

        // Cache messages for support conversation
        if (supportData.messages && supportData.messages.length > 0) {
          const targetKey = supportData.id || "support";
          setConversationMessagesMap((prev) => ({
            ...prev,
            [targetKey]: supportData.messages.map((m) => ({
              id: m.id,
              senderId: m.senderId,
              sender: m.sender === "me" || m.senderId === user.id ? "me" : "them",
              senderName: m.senderId === user.id ? "You" : "Support (Admin)",
              isAdmin: m.isAdmin || m.senderId !== user.id,
              text: m.body || m.message || m.text,
              body: m.body || m.message || m.text,
              time: formatMessageTime(m.createdAt),
              createdAt: m.createdAt,
            })),
            support: supportData.messages.map((m) => ({
              id: m.id,
              senderId: m.senderId,
              sender: m.sender === "me" || m.senderId === user.id ? "me" : "them",
              senderName: m.senderId === user.id ? "You" : "Support (Admin)",
              isAdmin: m.isAdmin || m.senderId !== user.id,
              text: m.body || m.message || m.text,
              body: m.body || m.message || m.text,
              time: formatMessageTime(m.createdAt),
              createdAt: m.createdAt,
            })),
          }));
        }
      }

      setDbConversations(unifiedList);
    } catch (err) {
      console.warn("Could not fetch DB conversations:", err.message);
    }
  }, [isAuthed, user]);

  useEffect(() => {
    refreshDbConversations();
  }, [refreshDbConversations, updateTick]);

  // 2. Initialize and connect Stream Chat client in parallel
  useEffect(() => {
    let isMounted = true;

    async function initStream() {
      if (!isAuthed || !user) {
        if (clientRef.current) {
          try {
            await clientRef.current.disconnectUser();
          } catch (e) {
            console.warn("Stream disconnect error:", e);
          }
          clientRef.current = null;
          setClient(null);
          setRawChannels([]);
          setActiveChannelId(null);
        }
        return;
      }

      try {
        setConnecting(true);
        const { apiKey, token } = await chatApi.getToken();
        if (!isMounted) return;

        // Disconnect existing client if connected to a different user
        if (clientRef.current) {
          if (clientRef.current.userID === user.id) {
            return;
          }
          await clientRef.current.disconnectUser();
          clientRef.current = null;
        }

        const streamClient = StreamChat.getInstance(apiKey);
        await streamClient.connectUser(
          {
            id: user.id,
            name: user.name || "TerraMatch User",
            image: user.avatarUrl || undefined,
            role: "user",
            customRole: user.role || "CLIENT",
          },
          token
        );

        if (!isMounted) {
          await streamClient.disconnectUser();
          return;
        }

        clientRef.current = streamClient;
        setClient(streamClient);

        // Query initial channels
        const filter = { members: { $in: [user.id] } };
        const sort = [{ last_message_at: -1 }];
        const channels = await streamClient.queryChannels(filter, sort, {
          watch: true,
          state: true,
          presence: true,
        });

        if (isMounted) {
          setRawChannels(channels);
        }

        // Listen for real-time chat events
        const handleEvent = (event) => {
          if (!isMounted) return;
          setUpdateTick((t) => t + 1);
          refreshDbConversations();
          if (event.type === "notification.added_to_channel" || event.type === "channel.updated") {
            streamClient.queryChannels(filter, sort, { watch: true, state: true }).then((chans) => {
              if (isMounted) setRawChannels(chans);
            });
          }
        };

        streamClient.on("message.new", handleEvent);
        streamClient.on("notification.message_new", handleEvent);
        streamClient.on("notification.added_to_channel", handleEvent);
        streamClient.on("notification.mark_read", handleEvent);
        streamClient.on("channel.updated", handleEvent);
      } catch (err) {
        console.warn("Stream Chat initialization warning (using DB fallback):", err.message);
      } finally {
        if (isMounted) setConnecting(false);
      }
    }

    initStream();

    return () => {
      isMounted = false;
    };
  }, [isAuthed, user?.id, refreshDbConversations]);

  // 3. Real-time SSE listener for admin replies and updates
  useEffect(() => {
    if (!isAuthed || !user) return;

    let eventSource = null;
    try {
      const sseUrl = `${import.meta.env.VITE_API_URL || ""}/api/bids/stream`;
      eventSource = new EventSource(sseUrl);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (
            data.type === "SUPPORT_REPLY_RECEIVED" ||
            data.type === "SUPPORT_MESSAGE_RECEIVED" ||
            data.type === "MESSAGE_RECEIVED"
          ) {
            refreshDbConversations();
            setUpdateTick((t) => t + 1);
          }
        } catch (e) {
          // ignore
        }
      };
    } catch (err) {
      console.warn("SSE stream setup warning:", err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [isAuthed, user?.id, refreshDbConversations]);

  // 4. Fetch full messages for the active conversation
  const loadConversationMessages = useCallback(
    async (convId) => {
      if (!convId || !isAuthed) return;
      try {
        if (convId === "support" || convId.startsWith("support_")) {
          const supportData = await supportApi.getConversation();
          if (supportData && supportData.messages) {
            const formatted = supportData.messages.map((m) => ({
              id: m.id,
              senderId: m.senderId,
              sender: m.sender === "me" || m.senderId === user?.id ? "me" : "them",
              senderName: m.senderId === user?.id ? "You" : "Support (Admin)",
              isAdmin: m.isAdmin || m.senderId !== user?.id,
              text: m.body || m.message || m.text,
              body: m.body || m.message || m.text,
              time: formatMessageTime(m.createdAt),
              createdAt: m.createdAt,
            }));
            setConversationMessagesMap((prev) => ({
              ...prev,
              [convId]: formatted,
              support: formatted,
              ...(supportData.id ? { [supportData.id]: formatted } : {}),
            }));
          }
        } else {
          const detail = await messageApi.get(convId);
          if (detail && detail.messages) {
            const formatted = detail.messages.map((m) => ({
              id: m.id,
              senderId: m.senderId,
              sender: m.sender === "me" || m.senderId === user?.id ? "me" : "them",
              senderName: m.senderId === user?.id ? "You" : m.senderName || "Them",
              isAdmin: m.isAdmin,
              text: m.body || m.text,
              body: m.body || m.text,
              time: formatMessageTime(m.createdAt),
              createdAt: m.createdAt,
            }));
            setConversationMessagesMap((prev) => ({
              ...prev,
              [convId]: formatted,
            }));
          }
        }
      } catch (err) {
        console.warn("Could not load full messages for conversation:", err.message);
      }
    },
    [isAuthed, user?.id]
  );

  useEffect(() => {
    if (activeChannelId) {
      loadConversationMessages(activeChannelId);
    }
  }, [activeChannelId, loadConversationMessages, updateTick]);

  // 5. Unified Conversation List (Merged DB conversations & Stream channels)
  const conversations = useMemo(() => {
    if (!user) return [];

    const map = new Map();

    // First, populate from DB conversations (Guaranteed persistent source of truth!)
    dbConversations.forEach((dbc) => {
      const isSupport = Boolean(
        dbc.isSupport ||
        dbc.type === "SUPPORT" ||
        dbc.otherPartyRole === "ADMIN" ||
        dbc.otherPartyId === "support" ||
        dbc.id === "support" ||
        dbc.otherPartyName === "Support" ||
        dbc.otherPartyName === "Support (Admin)"
      );

      const cachedMsgs =
        conversationMessagesMap[dbc.id] ||
        (isSupport ? conversationMessagesMap["support"] : null) ||
        [];

      const otherUserId = isSupport ? "support" : dbc.otherPartyId || dbc.id;
      const otherName = isSupport ? "Support (Admin)" : dbc.otherPartyName || "User";

      const landContext = dbc.landId
        ? {
            id: dbc.landId,
            title: dbc.landTitle || "Land Inquiry",
            price: null,
            location: null,
            image: null,
            slug: null,
          }
        : null;

      map.set(otherUserId, {
        id: dbc.id,
        cid: `messaging:${dbc.id}`,
        channel: null,
        name: isSupport ? "Support (Admin)" : otherName,
        subtitle: isSupport
          ? "TerraMatch Platform Support"
          : landContext
          ? `Re: ${landContext.title}`
          : dbc.otherPartyRole || "Direct Message",
        isSupport,
        avatarInitials: isSupport ? "SUP" : initialsFrom(otherName),
        avatarUrl: dbc.otherPartyAvatarUrl || null,
        otherUserId,
        otherUserRole: isSupport ? "ADMIN" : dbc.otherPartyRole,
        lastMessageTime: formatMessageTime(dbc.lastMessageAt),
        unreadCount: dbc.unreadCount || 0,
        landContext,
        projectContext: null,
        isBuyNowRequest: Boolean(dbc.landId),
        messages: cachedMsgs.length > 0 ? cachedMsgs : dbc.lastMessageText ? [
          {
            id: `initial-${dbc.id}`,
            sender: "them",
            senderName: isSupport ? "Support (Admin)" : otherName,
            text: dbc.lastMessageText,
            body: dbc.lastMessageText,
            time: formatMessageTime(dbc.lastMessageAt),
            createdAt: dbc.lastMessageAt,
          }
        ] : [],
      });
    });

    // Second, merge Stream channels
    rawChannels.forEach((chan) => {
      const state = chan.state;
      const members = Object.values(state.members || {});
      const otherMember = members.find((m) => m.user?.id !== user.id)?.user || members[0]?.user || {};
      const rawName = otherMember.name || "TerraMatch User";
      const isSupport = Boolean(
        otherMember.customRole === "ADMIN" ||
        chan.data?.isSupport === true ||
        chan.data?.name === "Support (Admin)" ||
        chan.data?.name === "TerraMatch Support" ||
        chan.id.startsWith("support_") ||
        chan.id.startsWith("tm_support_")
      );
      const otherUserId = isSupport ? "support" : otherMember.id || chan.id;
      const otherName = isSupport ? "Support (Admin)" : rawName;

      const streamMessages = (state.messages || []).map((m) => ({
        id: m.id,
        senderId: m.user?.id,
        sender: m.user?.id === user.id ? "me" : "them",
        senderName: m.user?.id === user.id ? "You" : isSupport ? "Support (Admin)" : otherName,
        isAdmin: isSupport && m.user?.id !== user.id,
        text: m.text,
        body: m.text,
        time: formatMessageTime(m.created_at),
        createdAt: m.created_at,
      }));

      const lastMsg = streamMessages[streamMessages.length - 1];

      const landContext = chan.data?.landId
        ? {
            id: chan.data.landId,
            title: chan.data.landTitle || "Land Inquiry",
            price: chan.data.landPrice ? formatGHS(chan.data.landPrice) : null,
            location: chan.data.landLocation || null,
            image: chan.data.landImage || null,
            slug: chan.data.landSlug || null,
          }
        : null;

      const projectContext = chan.data?.projectId
        ? {
            id: chan.data.projectId,
            title: chan.data.projectTitle || "Construction Project",
            location: chan.data.projectLocation || null,
            budgetRange: chan.data.projectBudget || null,
          }
        : null;

      if (!map.has(otherUserId)) {
        const cachedMsgs =
          conversationMessagesMap[chan.id] ||
          (isSupport ? conversationMessagesMap["support"] : null) ||
          [];

        map.set(otherUserId, {
          id: chan.id,
          cid: chan.cid,
          channel: chan,
          name: isSupport ? "Support (Admin)" : otherName,
          subtitle: isSupport
            ? "TerraMatch Platform Support"
            : landContext
            ? `Re: ${landContext.title}`
            : projectContext
            ? `Project: ${projectContext.title}`
            : otherMember.customRole || "Direct Message",
          isSupport,
          avatarInitials: isSupport ? "SUP" : initialsFrom(otherName),
          avatarUrl: otherMember.image || null,
          otherUserId,
          otherUserRole: isSupport ? "ADMIN" : otherMember.customRole,
          lastMessageTime: lastMsg
            ? lastMsg.time
            : formatMessageTime(chan.data?.last_message_at || chan.data?.created_at),
          unreadCount: chan.countUnread ? chan.countUnread() : 0,
          landContext,
          projectContext,
          isBuyNowRequest: Boolean(chan.data?.landId),
          messages: streamMessages.length > 0 ? streamMessages : cachedMsgs,
        });
      } else {
        // Merge into existing DB conversation
        const existing = map.get(otherUserId);
        existing.channel = chan;
        if (chan.id) existing.cid = chan.cid;

        const allMsgs = [...existing.messages, ...streamMessages].sort(
          (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        );
        const uniqueMessages = [];
        const seenMsgIds = new Set();
        for (const msg of allMsgs) {
          if (msg.id && !seenMsgIds.has(msg.id)) {
            seenMsgIds.add(msg.id);
            uniqueMessages.push(msg);
          } else if (!msg.id) {
            uniqueMessages.push(msg);
          }
        }
        if (uniqueMessages.length > 0) {
          existing.messages = uniqueMessages;
        }
        if (landContext) existing.landContext = landContext;
        if (projectContext) existing.projectContext = projectContext;
        if (chan.countUnread && chan.countUnread() > 0) {
          existing.unreadCount = chan.countUnread();
        }
      }
    });

    return Array.from(map.values());
  }, [dbConversations, rawChannels, user, conversationMessagesMap, updateTick]);

  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  }, [conversations]);

  // 6. Start or get a Stream / DB conversation
  const startConversation = useCallback(
    async ({ targetUserId, targetSlug, landId, projectId, initialMessage, isSupport }) => {
      const isSupportAction = isSupport || targetUserId === "support" || targetSlug === "support";

      if (isSupportAction) {
        if (initialMessage && initialMessage.trim()) {
          const res = await supportApi.sendMessage(initialMessage.trim());
          await refreshDbConversations();
          setActiveChannelId(res.conversationId || "support");
          return { conversationId: res.conversationId || "support", channelId: res.channelId || `support_${user?.id}` };
        } else {
          const res = await supportApi.getConversation();
          await refreshDbConversations();
          const targetId = res?.id || "support";
          setActiveChannelId(targetId);
          return { conversationId: targetId, channelId: `support_${user?.id}` };
        }
      }

      const res = await chatApi.createOrGetChannel({
        targetUserId,
        targetSlug,
        landId,
        projectId,
        initialMessage,
      });

      const channelId = res.channelId;
      await refreshDbConversations();

      if (clientRef.current && user) {
        const filter = { members: { $in: [user.id] } };
        const sort = [{ last_message_at: -1 }];
        const chans = await clientRef.current.queryChannels(filter, sort, { watch: true, state: true });
        setRawChannels(chans);
      }

      setActiveChannelId(channelId);
      return { conversationId: res.conversationId || channelId, channelId };
    },
    [user, refreshDbConversations]
  );

  // Buy Now flow creates/opens a conversation with land metadata
  const startBuyNowRequest = useCallback(
    async (land, message) => {
      return startConversation({
        targetUserId: land?.ownerId || land?.owner?.id,
        targetSlug: land?.ownerSlug,
        landId: land?.id || land?.slug,
        initialMessage: message,
      });
    },
    [startConversation]
  );

  // 7. Send message to active conversation (Supports DB API, Support API, and Stream Chat!)
  const sendMessage = useCallback(
    async (channelId, text) => {
      if (!text || !text.trim() || !user) return;
      const cleanText = text.trim();

      const conv = conversations.find(
        (c) => c.id === channelId || c.cid === channelId || (channelId === "support" && c.isSupport)
      );
      const isSupportMsg = channelId === "support" || conv?.isSupport || channelId.startsWith("support_");

      // Optimistic Message UI update
      const optimisticMsg = {
        id: `temp-${Date.now()}`,
        senderId: user.id,
        sender: "me",
        senderName: "You",
        isAdmin: false,
        text: cleanText,
        body: cleanText,
        time: "Just now",
        createdAt: new Date().toISOString(),
      };

      const targetKey = conv?.id || channelId;
      setConversationMessagesMap((prev) => ({
        ...prev,
        [targetKey]: [...(prev[targetKey] || conv?.messages || []), optimisticMsg],
        ...(isSupportMsg ? { support: [...(prev["support"] || conv?.messages || []), optimisticMsg] } : {}),
      }));

      // Send to Backend Database API
      try {
        if (isSupportMsg) {
          await supportApi.sendMessage(cleanText);
        } else if (conv?.id && conv.id !== "support") {
          await messageApi.send(conv.id, cleanText);
        }
      } catch (dbErr) {
        console.warn("Backend DB message send warning:", dbErr.message);
      }

      // Send via Stream Chat if available
      if (clientRef.current) {
        try {
          let targetChan = rawChannels.find((c) => c.id === channelId || c.cid === channelId);
          if (!targetChan && channelId) {
            const rawId = channelId.includes(":") ? channelId.split(":")[1] : channelId;
            targetChan = clientRef.current.channel("messaging", rawId);
            await targetChan.watch();
          }
          if (targetChan) {
            await targetChan.sendMessage({ text: cleanText });
          }
        } catch (streamErr) {
          console.warn("Stream send message warning:", streamErr.message);
        }
      }

      setUpdateTick((t) => t + 1);
      await refreshDbConversations();
    },
    [conversations, rawChannels, user, refreshDbConversations]
  );

  // 8. Mark channel messages as read
  const markRead = useCallback(
    async (channelId) => {
      let targetChan = rawChannels.find((c) => c.id === channelId || c.cid === channelId);
      if (!targetChan && channelId && clientRef.current) {
        try {
          const rawId = channelId.includes(":") ? channelId.split(":")[1] : channelId;
          targetChan = clientRef.current.channel("messaging", rawId);
        } catch (e) {
          // ignore
        }
      }
      if (targetChan) {
        try {
          await targetChan.markRead();
        } catch (e) {
          // ignore
        }
      }
      setUpdateTick((t) => t + 1);
    },
    [rawChannels]
  );

  // 9. Ensure conversation exists or resolve from URL contact/project/land parameter
  const ensureConversation = useCallback(
    async (contactParam, { projectId, landId } = {}) => {
      if (!contactParam && !projectId && !landId) return null;

      const isSupportQuery =
        contactParam === "support" || contactParam === "admin" || contactParam === "help";

      const directMatch = conversations.find(
        (c) =>
          (isSupportQuery && c.isSupport) ||
          (contactParam && (c.id === contactParam || c.cid === contactParam || c.otherUserId === contactParam)) ||
          (!contactParam && projectId && c.projectContext?.id === projectId) ||
          (!contactParam && landId && c.landContext?.id === landId)
      );

      if (directMatch) {
        setActiveChannelId(directMatch.id);
        loadConversationMessages(directMatch.id);
        return directMatch.id;
      }

      try {
        const res = await startConversation({
          targetUserId: isSupportQuery ? "support" : contactParam,
          targetSlug: contactParam,
          isSupport: isSupportQuery,
          projectId,
          landId,
        });
        if (res?.conversationId || res?.channelId) {
          const targetId = res.conversationId || res.channelId;
          setActiveChannelId(targetId);
          loadConversationMessages(targetId);
          return targetId;
        }
      } catch (err) {
        console.warn("Could not automatically create conversation for contact:", err.message);
      }

      return contactParam;
    },
    [conversations, startConversation, loadConversationMessages]
  );

  const startSupportConversation = useCallback(
    async (initialMessage) => {
      return startConversation({
        targetUserId: "support",
        isSupport: true,
        initialMessage,
      });
    },
    [startConversation]
  );

  const value = useMemo(
    () => ({
      client,
      connecting,
      conversations,
      totalUnread,
      activeChannelId,
      setActiveChannelId,
      startConversation,
      startBuyNowRequest,
      startSupportConversation,
      sendMessage,
      markRead,
      ensureConversation,
      refreshDbConversations,
    }),
    [
      client,
      connecting,
      conversations,
      totalUnread,
      activeChannelId,
      startConversation,
      startBuyNowRequest,
      startSupportConversation,
      sendMessage,
      markRead,
      ensureConversation,
      refreshDbConversations,
    ]
  );

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error("useMessages must be used within a MessagesProvider");
  }
  return context;
}
