#!/usr/bin/env node
"use strict";

/*
 * NETWORK PROTOCOL: OMI-LISP OVER WEBSOCKETS
 * 
 * S-expression transport over WebSocket
 * JSON framing with binary support
 * Subprotocol: omi-lisp/1
 */

import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

const DEFAULT_PORT = 8080;
const SUBPROTOCOL = "omi-lisp/1";

export function createOmiServer(port = DEFAULT_PORT) {
  const httpServer = createServer();
  const wss = new WebSocketServer({ server: httpServer, protocol: SUBPROTOCOL });
  
  const clients = new Set();
  const handlers = new Map();
  
  function broadcast(message, exclude = null) {
    for (const client of clients) {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  }
  
  function handleMessage(client, data) {
    try {
      const msg = typeof data === "string" ? JSON.parse(data) : data;
      
      if (msg.type === "eval") {
        console.log(`[WS] eval: ${msg.expr}`);
        
        const response = {
          type: "result",
          id: msg.id,
          result: msg.expr,
        };
        
        client.send(JSON.stringify(response));
        
        if (msg.broadcast) {
          broadcast({ type: "eval", expr: msg.expr }, client);
        }
        
      } else if (msg.type === "subscribe") {
        console.log(`[WS] subscribe: ${msg.topic}`);
        client.send(JSON.stringify({ type: "subscribed", topic: msg.topic }));
        
      } else if (msg.type === "ping") {
        client.send(JSON.stringify({ type: "pong", time: Date.now() }));
      }
      
    } catch (e) {
      client.send(JSON.stringify({ type: "error", message: e.message }));
    }
  }
  
  wss.on("connection", (ws, req) => {
    console.log(`[WS] client connected from ${req.socket.remoteAddress}`);
    clients.add(ws);
    
    ws.on("message", (data) => handleMessage(ws, data));
    
    ws.on("close", () => {
      console.log(`[WS] client disconnected`);
      clients.delete(ws);
    });
    
    ws.send(JSON.stringify({ type: "welcome", protocol: SUBPROTOCOL }));
  });
  
  wss.on("error", (e) => {
    console.error(`[WS] server error: ${e.message}`);
  });
  
  httpServer.listen(port, () => {
    console.log(`[WS] Omi-Lisp server running on ws://localhost:${port}`);
    console.log(`[WS] subprotocol: ${SUBPROTOCOL}`);
  });
  
  return { httpServer, wss, broadcast, clients };
}

export function createOmiClient(url = `ws://localhost:${DEFAULT_PORT}`) {
  let ws = null;
  let connected = false;
  const callbacks = new Map();
  
  function connect() {
    return new Promise((resolve, reject) => {
      ws = new WebSocket(url, SUBPROTOCOL);
      
      ws.on("open", () => {
        connected = true;
        resolve();
      });
      
      ws.on("message", (data) => {
        try {
          const msg = typeof data === "string" ? JSON.parse(data) : data;
          
          if (msg.type === "welcome") {
            console.log(`[WS] connected: ${msg.protocol}`);
          } else if (msg.id && callbacks.has(msg.id)) {
            callbacks.get(msg.id)(msg);
          } else {
            console.log(`[WS] message: ${msg.type}`);
          }
        } catch (e) {
          console.error(`[WS] parse error: ${e.message}`);
        }
      });
      
      ws.on("close", () => {
        connected = false;
        console.log(`[WS] disconnected`);
      });
      
      ws.on("error", (e) => {
        reject(e);
      });
    });
  }
  
  function send(message) {
    if (!connected || ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("not connected"));
    }
    
    const id = message.id || `msg_${Date.now()}`;
    message.id = id;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("timeout"));
      }, 5000);
      
      callbacks.set(id, (reply) => {
        clearTimeout(timeout);
        callbacks.delete(id);
        resolve(reply);
      });
      
      ws.send(JSON.stringify(message));
    });
  }
  
  function sendExpr(expr, broadcast = false) {
    return send({ type: "eval", expr, broadcast });
  }
  
  function ping() {
    return send({ type: "ping" });
  }
  
  return { connect, send, sendExpr, ping, get readyState() { return ws?.readyState; } };
}

export function testNetworkProtocol() {
  console.log("=== NETWORK PROTOCOL ===\n");

  console.log("--- Server ---");
  console.log(`  port: ${DEFAULT_PORT}`);
  console.log(`  subprotocol: ${SUBPROTOCOL}`);
  
  console.log("\n--- Message Types ---");
  console.log("  eval:     Evaluate S-expression");
  console.log("  result:   Return value");
  console.log("  subscribe: Subscribe to updates");
  console.log("  ping:     Heartbeat");
  console.log("  pong:     Heartbeat response");
  
  console.log("\n--- Example Usage ---");
  console.log(`  const client = createOmiClient();`);
  console.log(`  await client.connect();`);
  console.log(`  const result = await client.eval("(car '(a b c))");`);
  
  console.log("\n=== Network Protocol Ready ===");
  return { port: DEFAULT_PORT, protocol: SUBPROTOCOL };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testNetworkProtocol();
}