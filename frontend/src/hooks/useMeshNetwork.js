import { useState, useEffect, useCallback } from 'react';
import { registerPlugin } from '@capacitor/core';

// 1. Register the Native Plugin directly
// This name 'MeshNetwork' MUST match the @CapacitorPlugin(name="MeshNetwork") in Java
const MeshPlugin = registerPlugin('MeshNetwork');

export function useMeshNetwork(options = {}) {
  const { autoStart = false } = options;

  const [isRunning, setIsRunning] = useState(false);
  const [peers, setPeers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const [myNodeId, setMyNodeId] = useState(null);

  // 2. Initialize & Start Mesh
  const startMesh = useCallback(async () => {
    console.log("[MeshHook] Starting...");
    try {
      setError(null);

      // A. Check/Request Permissions First
      // This calls the 'checkPermissions' method we added to MeshPlugin.java
      const permResult = await MeshPlugin.checkPermissions();
      
      if (!permResult.granted) {
        throw new Error("Bluetooth/Location permissions denied");
      }

      // B. Start the Service
      const result = await MeshPlugin.startMesh();
      console.log("[MeshHook] Started:", result);
      
      setMyNodeId(result.nodeId || "ME");
      setIsRunning(true);

    } catch (err) {
      console.error("[MeshHook] Start Failed:", err);
      setError(err.message || "Failed to start mesh");
      setIsRunning(false);
    }
  }, []);

  // 3. Stop Mesh
  const stopMesh = useCallback(async () => {
    try {
      await MeshPlugin.stopMesh();
      setIsRunning(false);
      setPeers([]);
    } catch (err) {
      console.error("[MeshHook] Stop Failed:", err);
    }
  }, []);

  // 4. Send Message
  const sendMessage = useCallback(async (text, destination = 'BROADCAST') => {
    // Optimistic UI Update (Show message immediately)
    const newMsg = {
      sender: 'ME',
      content: text,
      timestamp: Date.now(),
      status: 'sending'
    };
    
    setMessages(prev => [newMsg, ...prev]);

    try {
      // Call Native Method
      await MeshPlugin.sendMessage({ message: text, destination });
      
      // Update status to sent
      setMessages(prev => prev.map(m => 
        m === newMsg ? { ...m, status: 'sent' } : m
      ));
      
      return true;
    } catch (err) {
      console.error("[MeshHook] Send Failed:", err);
      setError("Failed to send message");
      
      // Update status to failed
      setMessages(prev => prev.map(m => 
        m === newMsg ? { ...m, status: 'failed' } : m
      ));
      return false;
    }
  }, []);

  // 5. Send SOS (Wrapper for high priority message)
  const sendSOS = useCallback(async (text, lat, lng) => {
    const sosPayload = `SOS|${lat}|${lng}|${text}`;
    return sendMessage(sosPayload, 'BROADCAST');
  }, [sendMessage]);

  // 6. Event Listeners (The Bridge to Java)
  useEffect(() => {
    let peerListener = null;
    let msgListener = null;

    const setupListeners = async () => {
      // Listener 1: Peer Found
      peerListener = await MeshPlugin.addListener('peerFound', (peer) => {
        console.log("[MeshHook] Peer Found:", peer);
        setPeers(prev => {
          if (prev.find(p => p.id === peer.peerId)) return prev;
          return [...prev, { id: peer.peerId, lastSeen: Date.now(), status: 'connected' }];
        });
      });

      // Listener 2: Message Received
      msgListener = await MeshPlugin.addListener('messageReceived', (msg) => {
        console.log("[MeshHook] Message Received:", msg);
        const incomingMsg = {
          sender: msg.sender,
          content: msg.content, // Ensure Java sends 'content'
          timestamp: Date.now(),
          isIncoming: true
        };
        setLastMessage(incomingMsg);
        setMessages(prev => [incomingMsg, ...prev]);
      });
    };

    setupListeners();

    // Cleanup
    return () => {
      if (peerListener) peerListener.remove();
      if (msgListener) msgListener.remove();
    };
  }, []);

  // Auto-start logic
  useEffect(() => {
    if (autoStart && !isRunning) {
      startMesh();
    }
  }, [autoStart, isRunning, startMesh]);

  return {
    isRunning,
    peers,
    messages,
    lastMessage,
    error,
    myNodeId,
    startMesh,
    stopMesh,
    sendMessage,
    sendSOS,
    refreshMessages: () => {}, // No-op for direct plugin, state is managed here
    peerCount: peers.length,
    messageCount: messages.length
  };
}