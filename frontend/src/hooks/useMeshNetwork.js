import { useState, useEffect, useCallback, useRef } from "react";
import meshNetworkService from "../services/meshNetworkService";

/**
 * React Hook for Mesh Networking
 * Provides easy access to mesh network functionality in React components
 *
 * @param {Object} options - Hook options
 * @param {boolean} [options.autoStart=false] - Automatically start mesh on mount
 * @returns {Object} Mesh network state and functions
 */
export function useMeshNetwork(options = {}) {
  const { autoStart = false } = options;

  const [isRunning, setIsRunning] = useState(false);
  const [peers, setPeers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);

  const peersIntervalRef = useRef(null);

  // Start mesh network
  const startMesh = useCallback(async () => {
    console.log("[useMeshNetwork] startMesh called");
    try {
      setError(null);
      console.log("[useMeshNetwork] Calling meshNetworkService.startMesh()...");

      const result = await meshNetworkService.startMesh();
      console.log("[useMeshNetwork] startMesh result:", result);

      // Reflect running state only when native start succeeds
      setIsRunning(!!result?.success);
      console.log(
        "[useMeshNetwork] State set to isRunning=",
        !!result?.success,
      );

      // Start polling for peers
      if (peersIntervalRef.current) {
        clearInterval(peersIntervalRef.current);
      }

      peersIntervalRef.current = setInterval(async () => {
        try {
          const currentPeers = await meshNetworkService.getPeers();
          console.log("[useMeshNetwork] Peers:", currentPeers.length);
          setPeers(currentPeers);
        } catch (err) {
          console.error("[useMeshNetwork] Failed to get peers:", err);
        }
      }, 3000);

      // Load initial messages
      try {
        const storedMessages = await meshNetworkService.getMessages();
        console.log("[useMeshNetwork] Messages:", storedMessages.length);
        setMessages(storedMessages);
      } catch (err) {
        console.error("[useMeshNetwork] Failed to get messages:", err);
      }
    } catch (err) {
      console.error("[useMeshNetwork] Failed to start mesh:", err);
      setError(err.message || "Failed to start mesh network");
      setIsRunning(false);
    }
  }, []);

  // Stop mesh network
  const stopMesh = useCallback(async () => {
    try {
      await meshNetworkService.stopMesh();
      setIsRunning(false);
      setPeers([]);

      if (peersIntervalRef.current) {
        clearInterval(peersIntervalRef.current);
        peersIntervalRef.current = null;
      }
    } catch (err) {
      console.error("[useMeshNetwork] Failed to stop mesh:", err);
      setError(err.message);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (payload, options = {}) => {
    try {
      setError(null);
      const result = await meshNetworkService.sendMessage({
        payload:
          typeof payload === "string" ? payload : JSON.stringify(payload),
        ...options,
      });

      // Refresh messages
      const updatedMessages = await meshNetworkService.getMessages();
      setMessages(updatedMessages);

      return result;
    } catch (err) {
      console.error("[useMeshNetwork] Failed to send message:", err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Send SOS
  const sendSOS = useCallback(async (message, lat, lng, metadata = {}) => {
    try {
      setError(null);
      const result = await meshNetworkService.sendSOS({
        message,
        lat,
        lng,
        metadata,
      });

      // Refresh messages
      const updatedMessages = await meshNetworkService.getMessages();
      setMessages(updatedMessages);

      return result;
    } catch (err) {
      console.error("[useMeshNetwork] Failed to send SOS:", err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Refresh messages manually
  const refreshMessages = useCallback(async () => {
    try {
      const updatedMessages = await meshNetworkService.getMessages();
      setMessages(updatedMessages);
    } catch (err) {
      console.error("[useMeshNetwork] Failed to refresh messages:", err);
    }
  }, []);

  // Setup event listeners
  useEffect(() => {
    const handleMessageReceived = (message) => {
      console.log("[useMeshNetwork] New message received:", message);
      setLastMessage(message);

      // Add to messages list
      setMessages((prev) => [message, ...prev]);
    };

    const handlePeerDiscovered = (peer) => {
      console.log("[useMeshNetwork] Peer discovered:", peer);
      setPeers((prev) => {
        const exists = prev.some((p) => p.id === peer.peerId);
        if (exists) return prev;
        return [...prev, { id: peer.peerId, lastSeen: Date.now() }];
      });
    };

    const handlePeerLost = (peer) => {
      console.log("[useMeshNetwork] Peer lost:", peer);
      setPeers((prev) => prev.filter((p) => p.id !== peer.peerId));
    };

    meshNetworkService.on("messageReceived", handleMessageReceived);
    meshNetworkService.on("peerDiscovered", handlePeerDiscovered);
    meshNetworkService.on("peerLost", handlePeerLost);

    return () => {
      meshNetworkService.off("messageReceived", handleMessageReceived);
      meshNetworkService.off("peerDiscovered", handlePeerDiscovered);
      meshNetworkService.off("peerLost", handlePeerLost);
    };
  }, []);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart) {
      startMesh();
    }

    // Cleanup on unmount
    return () => {
      if (peersIntervalRef.current) {
        clearInterval(peersIntervalRef.current);
      }
    };
  }, [autoStart, startMesh]);

  return {
    // State
    isRunning,
    peers,
    messages,
    lastMessage,
    error,

    // Actions
    startMesh,
    stopMesh,
    sendMessage,
    sendSOS,
    refreshMessages,

    // Stats
    peerCount: peers.length,
    messageCount: messages.length,
  };
}
