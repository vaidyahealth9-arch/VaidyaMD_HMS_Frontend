/**
 * VaidyaMD HMS — WebSocket Client for Real-time Notifications
 */

type WsMessageHandler = (message: Record<string, unknown>) => void;

class VaidyaMdWebSocket {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private handlers: WsMessageHandler[] = [];
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;

  connect(userId: string, userInfo: { role: string; tenant_id: string }) {
    this.userId = userId;
    this.shouldReconnect = true;

    let wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    if (typeof window !== 'undefined') {
      const currentOrigin = window.location.origin;
      if (currentOrigin.includes('localhost:3000')) {
        wsBaseUrl = 'ws://localhost:8000';
      } else if (currentOrigin.includes('-3000.')) {
        const secureBase = currentOrigin.replace('http://', 'ws://').replace('https://', 'wss://');
        wsBaseUrl = secureBase.replace('-3000.', '-8000.');
      } else if (wsBaseUrl === '/' || wsBaseUrl.startsWith('/')) {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsBaseUrl = `${wsProtocol}//${window.location.host}${wsBaseUrl === '/' ? '' : wsBaseUrl}`;
      }
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('vaidya_md_token') : null;
    const wsUrl = `${wsBaseUrl.replace(/\/$/, '')}/ws/notifications/${userId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('🔌 VaidyaMD WebSocket connected');
        // Register user role for role-based broadcasting
        this.ws?.send(JSON.stringify({ type: 'register', ...userInfo }));

        // Start heartbeat
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') return; // Ignore pong
          this.handlers.forEach((handler) => handler(data));
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 VaidyaMD WebSocket disconnected');
        this.cleanup();
        if (this.shouldReconnect) {
          this.reconnectTimeout = setTimeout(() => {
            if (this.userId) this.connect(userId, userInfo);
          }, 3000);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
    }
  }

  private cleanup() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = null;
  }

  disconnect() {
    this.shouldReconnect = false;
    this.cleanup();
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.ws?.close();
    this.ws = null;
  }

  onMessage(handler: WsMessageHandler) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new VaidyaMdWebSocket();
