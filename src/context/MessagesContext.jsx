import { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from "react";
import { StreamChat } from "stream-chat";
import { chatApi } from "../services/chatApi";
import { supportApi } from "../services/authApi";
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
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [updateTick, setUpdateTick] = useState(0);

  const clientRef = useRef(null);

  // Initialize and connect Stream Chat client when user logs in
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
        const { apiKey, token, user: streamUserData } = await chatApi.getToken();
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
        console.error("Stream Chat initialization error:", err);
      } finally {
        if (isMounted) setConnecting(false);
      }
    }

    initStream();

    return () => {
      isMounted = false;
    };
  }, [isAuthed, user?.id]);

  // Transform Stream channels into the TerraMatch UI model, strictly deduplicated by otherUserId
  const conversations = useMemo(() => {
    if (!user) return [];

    const map = new Map();

    rawChannels.forEach((chan) => {
      const state = chan.state;
      const members = Object.values(state.members || {});
      const otherMember = members.find((m) => m.user?.id !== user.id)?.user || members[0]?.user || {};
      const otherUserId = otherMember.id || chan.id;
      const rawName = otherMember.name || "TerraMatch User";
      const isSupport = Boolean(
        otherMember.customRole === "ADMIN" ||
        chan.data?.isSupport === true ||
        chan.data?.name === "Support (Admin)" ||
        chan.data?.name === "TerraMatch Support" ||
        chan.id.startsWith("support_") ||
        chan.id.startsWith("tm_support_")
      );
      const otherName = isSupport ? "Support (Admin)" : rawName;

      const messages = (state.messages || []).map((m) => ({
        id: m.id,
        sender: m.user?.id === user.id ? "me" : "them",
        text: m.text,
        time: formatMessageTime(m.created_at),
        createdAt: m.created_at,
      }));

      const lastMsg = messages[messages.length - 1];

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

      const conv = {
        id: chan.id,
        cid: chan.cid,
        channel: chan,
        name: otherName,
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
        lastMessageTime: lastMsg ? lastMsg.time : formatMessageTime(chan.data?.last_message_at || chan.data?.created_at),
        unreadCount: chan.countUnread ? chan.countUnread() : 0,
        landContext,
        projectContext,
        isBuyNowRequest: Boolean(chan.data?.landId),
        messages,
      };

      if (!map.has(otherUserId)) {
        map.set(otherUserId, conv);
      } else {
        // Merge duplicate channel messages into single conversation thread
        const existing = map.get(otherUserId);
        const combined = [...existing.messages, ...messages].sort(
          (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        );
        const uniqueMessages = [];
        const seenMsgIds = new Set();
        for (const msg of combined) {
          if (!seenMsgIds.has(msg.id)) {
            seenMsgIds.add(msg.id);
            uniqueMessages.push(msg);
          }
        }
        existing.messages = uniqueMessages;
        if (conv.landContext) existing.landContext = conv.landContext;
        existing.unreadCount += conv.unreadCount;
        if (new Date(chan.data?.last_message_at || 0) > new Date(existing.channel?.data?.last_message_at || 0)) {
          existing.id = chan.id;
          existing.cid = chan.cid;
          existing.channel = chan;
          existing.lastMessageTime = conv.lastMessageTime;
        }
      }
    });

    return Array.from(map.values());
  }, [rawChannels, user, updateTick]);

  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  }, [conversations]);

  // Start or get a Stream conversation
  const startConversation = useCallback(
    async ({ targetUserId, targetSlug, landId, projectId, initialMessage }) => {
      const res = await chatApi.createOrGetChannel({
        targetUserId,
        targetSlug,
        landId,
        projectId,
        initialMessage,
      });

      const channelId = res.channelId;

      if (clientRef.current && user) {
        const filter = { members: { $in: [user.id] } };
        const sort = [{ last_message_at: -1 }];
        const chans = await clientRef.current.queryChannels(filter, sort, { watch: true, state: true });
        setRawChannels(chans);
      }

      setActiveChannelId(channelId);
      return { conversationId: channelId, channelId };
    },
    [user]
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

  // Send a message to a channel
  const sendMessage = useCallback(
    async (channelId, text) => {
      if (!text || !text.trim() || !clientRef.current) return;
      let targetChan = rawChannels.find((c) => c.id === channelId || c.cid === channelId);
      if (!targetChan && channelId) {
        try {
          const rawId = channelId.includes(":") ? channelId.split(":")[1] : channelId;
          targetChan = clientRef.current.channel("messaging", rawId);
          await targetChan.watch();
        } catch (e) {
          console.warn("Could not resolve channel for message:", e);
        }
      }
      if (targetChan) {
        await targetChan.sendMessage({ text: text.trim() });
        setUpdateTick((t) => t + 1);
      }
    },
    [rawChannels]
  );

  // Mark channel messages as read
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
        await targetChan.markRead();
        setUpdateTick((t) => t + 1);
      }
    },
    [rawChannels]
  );

  // Ensure conversation exists or resolve from URL contact/project/land parameter
  const ensureConversation = useCallback(
    async (contactParam, { projectId, landId } = {}) => {
      if (!contactParam && !projectId && !landId) return null;

      const isSupportQuery =
        contactParam === "support" || contactParam === "admin" || contactParam === "help";

      const directMatch = conversations.find(
        (c) =>
          (isSupportQuery && (c.isSupport || c.otherUserRole === "ADMIN" || c.id.startsWith("support_"))) ||
          (contactParam && (c.id === contactParam || c.cid === contactParam || c.otherUserId === contactParam)) ||
          (!contactParam && projectId && c.projectContext?.id === projectId) ||
          (!contactParam && landId && c.landContext?.id === landId)
      );
      if (directMatch) {
        setActiveChannelId(directMatch.id);
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
        if (res?.channelId) {
          setActiveChannelId(res.channelId);
          return res.channelId;
        }
      } catch (err) {
        console.warn("Could not automatically create channel for contact:", err.message);
      }

      return contactParam;
    },
    [conversations, startConversation]
  );

  const startSupportConversation = useCallback(
    async (initialMessage) => {
      try {
        const res = await startConversation({
          targetUserId: "support",
          isSupport: true,
          initialMessage,
        });
        return res;
      } catch (err) {
        // Fallback to supportApi directly
        const fallback = await supportApi.sendMessage(initialMessage);
        return fallback;
      }
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
