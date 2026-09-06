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

/**
 * Deterministic message deduplication & chronological sorting.
 * Replaces optimistic temp messages (temp-* / sse-*) when confirmed by server response,
 * and eliminates duplicate copies from DB vs Stream.
 */
function deduplicateAndSortMessages(msgs) {
  if (!Array.isArray(msgs)) return [];

  const serverMsgs = [];
  const tempMsgs = [];

  for (const m of msgs) {
    if (!m) continue;
    const isTemp = typeof m.id === "string" && (m.id.startsWith("temp-") || m.id.startsWith("sse-"));
    if (isTemp) {
      tempMsgs.push(m);
    } else {
      serverMsgs.push(m);
    }
  }

  const result = [];
  const seenIds = new Set();
  const seenSignatures = new Set();

  for (const m of serverMsgs) {
    if (m.id && seenIds.has(m.id)) continue;
    if (m.id) seenIds.add(m.id);

    const text = (m.body || m.text || "").trim();
    const timeBucket = m.createdAt ? Math.floor(new Date(m.createdAt).getTime() / 5000) : 0;
    const sig = `${m.sender || "me"}_${text}_${timeBucket}`;
    if (text && seenSignatures.has(sig)) continue;
    if (text) seenSignatures.add(sig);

    result.push(m);
  }

  for (const tm of tempMsgs) {
    const text = (tm.body || tm.text || "").trim();
    const tmTime = tm.createdAt ? new Date(tm.createdAt).getTime() : Date.now();

    const isAlreadyConfirmed = result.some((sm) => {
      const smText = (sm.body || sm.text || "").trim();
      const smTime = sm.createdAt ? new Date(sm.createdAt).getTime() : 0;
      const sameSender = sm.sender === tm.sender || sm.senderId === tm.senderId;
      const sameText = smText === text;
      const closeTime = Math.abs(smTime - tmTime) < 15000;
      return sameSender && sameText && closeTime;
    });

    if (!isAlreadyConfirmed && (!tm.id || !seenIds.has(tm.id))) {
      if (tm.id) seenIds.add(tm.id);
      result.push(tm);
    }
  }

  return result.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
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

      // If support conversation exists in DB, guarantee it is present in the list
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
          const formatted = supportData.messages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            sender: m.sender === "me" || m.senderId === user.id ? "me" : "them",
            senderName: m.senderId === user.id ? "You" : "Support (Admin)",
            isAdmin: Boolean(m.isAdmin || m.senderId !== user.id),
            text: m.body || m.message || m.text,
            body: m.body || m.message || m.text,
            time: formatMessageTime(m.createdAt),
            createdAt: m.createdAt,
          }));

          setConversationMessagesMap((prev) => {
            const merged = deduplicateAndSortMessages([...(prev[targetKey] || []), ...(prev["support"] || []), ...formatted]);
            return {
              ...prev,
              [targetKey]: merged,
              support: merged,
              ...(supportData.id ? { [supportData.id]: merged } : {}),
            };
          });
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
          if (event.message) {
            const isSupport =
              event.channel?.data?.isSupport === true ||
              event.channel_id?.startsWith("support_") ||
              event.message.user?.customRole === "ADMIN";
            const newMsg = {
              id: event.message.id,
              senderId: event.message.user?.id,
              sender: event.message.user?.id === user.id ? "me" : "them",
              senderName:
                event.message.user?.id === user.id
                  ? "You"
                  : isSupport
                  ? "Support (Admin)"
                  : event.message.user?.name || "Them",
              isAdmin: Boolean(isSupport && event.message.user?.id !== user.id),
              text: event.message.text,
              body: event.message.text,
              time: formatMessageTime(event.message.created_at),
              createdAt: event.message.created_at,
            };

            const targetKey = event.channel_id || event.channel?.id;
            if (targetKey) {
              setConversationMessagesMap((prev) => ({
                ...prev,
                [targetKey]: deduplicateAndSortMessages([...(prev[targetKey] || []), newMsg]),
                ...(isSupport ? { support: deduplicateAndSortMessages([...(prev["support"] || []), newMsg]) } : {}),
              }));
            }
          }

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
          if (data.type === "SUPPORT_REPLY_RECEIVED") {
            // Admin sent a support reply
            if (!data.userId || data.userId === user.id) {
              const replyMsg = {
                id: `sse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                senderId: "support_admin",
                sender: "them",
                senderName: "Support (Admin)",
                isAdmin: true,
                text: data.message,
                body: data.message,
                time: formatMessageTime(data.timestamp || new Date()),
                createdAt: data.timestamp || new Date().toISOString(),
              };

              const targetConvId = data.conversationId || "support";

              setConversationMessagesMap((prev) => {
                const existing = prev[targetConvId] || prev["support"] || [];
                const updated = deduplicateAndSortMessages([...existing, replyMsg]);
                return {
                  ...prev,
                  [targetConvId]: updated,
                  support: updated,
                  ...(data.conversationId ? { [data.conversationId]: updated } : {}),
                };
              });

              // Update conversation preview in-place without resetting list
              setDbConversations((prev) =>
                prev.map((c) => {
                  if (c.isSupport || c.id === targetConvId || c.id === "support") {
                    return {
                      ...c,
                      lastMessageText: data.message,
                      lastMessageAt: data.timestamp || new Date().toISOString(),
                    };
                  }
                  return c;
                })
              );

              // Background refresh to guarantee PostgreSQL sync
              refreshDbConversations();
            }
          } else if (data.type === "SUPPORT_MESSAGE_RECEIVED" || data.type === "MESSAGE_RECEIVED") {
            refreshDbConversations();
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
        if (convId === "support" || (typeof convId === "string" && convId.startsWith("support_"))) {
          const supportData = await supportApi.getConversation();
          if (supportData && supportData.messages) {
            const formatted = supportData.messages.map((m) => ({
              id: m.id,
              senderId: m.senderId,
              sender: m.sender === "me" || m.senderId === user?.id ? "me" : "them",
              senderName: m.senderId === user?.id ? "You" : "Support (Admin)",
              isAdmin: Boolean(m.isAdmin || m.senderId !== user?.id),
              text: m.body || m.message || m.text,
              body: m.body || m.message || m.text,
              time: formatMessageTime(m.createdAt),
              createdAt: m.createdAt,
            }));
            const targetKey = supportData.id || "support";
            setConversationMessagesMap((prev) => {
              const merged = deduplicateAndSortMessages([
                ...(prev[targetKey] || []),
                ...(prev["support"] || []),
                ...formatted,
              ]);
              return {
                ...prev,
                [targetKey]: merged,
                support: merged,
                ...(supportData.id ? { [supportData.id]: merged } : {}),
              };
            });
          }
        } else {
          const detail = await messageApi.get(convId);
          if (detail && detail.messages) {
            const isSupport = Boolean(detail.isSupport || detail.type === "SUPPORT" || detail.otherPartyRole === "ADMIN");
            const formatted = detail.messages.map((m) => ({
              id: m.id,
              senderId: m.senderId,
              sender: m.sender === "me" || m.senderId === user?.id ? "me" : "them",
              senderName: m.senderId === user?.id ? "You" : isSupport ? "Support (Admin)" : m.senderName || detail.otherPartyName,
              isAdmin: Boolean(m.isAdmin || (isSupport && m.senderId !== user?.id)),
              text: m.body || m.text,
              body: m.body || m.text,
              time: formatMessageTime(m.createdAt),
              createdAt: m.createdAt,
            }));
            setConversationMessagesMap((prev) => {
              const merged = deduplicateAndSortMessages([...(prev[convId] || []), ...formatted]);
              return {
                ...prev,
                [convId]: merged,
                ...(isSupport ? { support: merged } : {}),
              };
            });
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

      const deduplicatedMsgs = deduplicateAndSortMessages(
        cachedMsgs.length > 0
          ? cachedMsgs
          : dbc.lastMessageText
          ? [
              {
                id: `initial-${dbc.id}`,
                sender: "them",
                senderName: isSupport ? "Support (Admin)" : otherName,
                text: dbc.lastMessageText,
                body: dbc.lastMessageText,
                time: formatMessageTime(dbc.lastMessageAt),
                createdAt: dbc.lastMessageAt,
              },
            ]
          : []
      );

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
        messages: deduplicatedMsgs,
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
        (typeof chan.id === "string" && (chan.id.startsWith("support_") || chan.id.startsWith("tm_support_")))
      );
      const otherUserId = isSupport ? "support" : otherMember.id || chan.id;
      const otherName = isSupport ? "Support (Admin)" : rawName;

      const streamMessages = (state.messages || []).map((m) => ({
        id: m.id,
        senderId: m.user?.id,
        sender: m.user?.id === user.id ? "me" : "them",
        senderName: m.user?.id === user.id ? "You" : isSupport ? "Support (Admin)" : otherName,
        isAdmin: Boolean(isSupport && m.user?.id !== user.id),
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
          messages: deduplicateAndSortMessages(streamMessages.length > 0 ? streamMessages : cachedMsgs),
        });
      } else {
        // Merge into existing DB conversation with strict deduplication
        const existing = map.get(otherUserId);
        existing.channel = chan;
        if (chan.id) existing.cid = chan.cid;

        existing.messages = deduplicateAndSortMessages([...existing.messages, ...streamMessages]);
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
          const targetId = res.conversationId || "support";
          setActiveChannelId(targetId);
          loadConversationMessages(targetId);
          return { conversationId: targetId, channelId: res.channelId || `support_${user?.id}` };
        } else {
          const res = await supportApi.getConversation();
          await refreshDbConversations();
          const targetId = res?.id || "support";
          setActiveChannelId(targetId);
          loadConversationMessages(targetId);
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

      const resolvedId = res.conversationId || channelId;
      setActiveChannelId(resolvedId);
      loadConversationMessages(resolvedId);
      return { conversationId: res.conversationId || channelId, channelId };
    },
    [user, refreshDbConversations, loadConversationMessages]
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

  // 7. Send message to active conversation (Supports DB API, Support API, and Stream Chat)
  const sendMessage = useCallback(
    async (channelId, text) => {
      if (!text || !text.trim() || !user) return;
      const cleanText = text.trim();

      const conv = conversations.find(
        (c) => c.id === channelId || c.cid === channelId || (channelId === "support" && c.isSupport)
      );
      const isSupportMsg = channelId === "support" || conv?.isSupport || (typeof channelId === "string" && channelId.startsWith("support_"));
      const targetKey = conv?.id || channelId;

      // 1. Optimistic Message UI update
      const optimisticId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const optimisticMsg = {
        id: optimisticId,
        senderId: user.id,
        sender: "me",
        senderName: "You",
        isAdmin: false,
        text: cleanText,
        body: cleanText,
        time: "Just now",
        createdAt: new Date().toISOString(),
      };

      setConversationMessagesMap((prev) => {
        const existing = prev[targetKey] || (isSupportMsg ? prev["support"] : null) || conv?.messages || [];
        const updated = deduplicateAndSortMessages([...existing, optimisticMsg]);
        return {
          ...prev,
          [targetKey]: updated,
          ...(isSupportMsg ? { support: updated } : {}),
        };
      });

      // 2. In-place preview update
      setDbConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetKey || (isSupportMsg && c.isSupport)) {
            return {
              ...c,
              lastMessageText: cleanText,
              lastMessageAt: new Date().toISOString(),
            };
          }
          return c;
        })
      );

      // 3. Send to Backend Database API
      let confirmedMsg = null;
      let serverConvId = targetKey;

      try {
        if (isSupportMsg) {
          const res = await supportApi.sendMessage(cleanText);
          if (res?.message) {
            confirmedMsg = {
              id: res.message.id,
              senderId: user.id,
              sender: "me",
              senderName: "You",
              isAdmin: false,
              text: res.message.body || cleanText,
              body: res.message.body || cleanText,
              time: formatMessageTime(res.message.createdAt),
              createdAt: res.message.createdAt,
            };
            if (res.conversationId) serverConvId = res.conversationId;
          }
        } else if (conv?.id && conv.id !== "support") {
          const res = await messageApi.send(conv.id, cleanText);
          if (res) {
            confirmedMsg = {
              id: res.id,
              senderId: user.id,
              sender: "me",
              senderName: "You",
              isAdmin: false,
              text: res.body || cleanText,
              body: res.body || cleanText,
              time: formatMessageTime(res.createdAt),
              createdAt: res.createdAt,
            };
          }
        }
      } catch (dbErr) {
        console.warn("Backend DB message send warning:", dbErr.message);
      }

      // 4. Confirm message in cache
      if (confirmedMsg) {
        setConversationMessagesMap((prev) => {
          const existing = prev[serverConvId] || prev[targetKey] || (isSupportMsg ? prev["support"] : null) || [];
          const updated = deduplicateAndSortMessages([...existing, confirmedMsg]);
          return {
            ...prev,
            [serverConvId]: updated,
            [targetKey]: updated,
            ...(isSupportMsg ? { support: updated } : {}),
          };
        });
      }

      // Background refresh to guarantee PostgreSQL sync
      refreshDbConversations();
    },
    [conversations, user, refreshDbConversations]
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
