// services/websocketService.ts

class WebSocketService {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectInterval = 5000; // 5 seconds
    private listeners: { [event: string]: Function[] } = {};
    private isConnecting = false;

    constructor(private url: string, private token?: string) { }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            if (this.isConnecting) {
                return;
            }

            this.isConnecting = true;

            try {
                // Construct WebSocket URL with token if available
                const wsUrl = this.token
                    ? `${this.url}?token=${this.token}`
                    : this.url;

                console.log('🔌 Connecting to WebSocket:', wsUrl);

                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    console.log('✅ WebSocket connected successfully');
                    this.reconnectAttempts = 0;
                    this.isConnecting = false;
                    this.emit('connected');
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('📨 WebSocket message received:', data);
                        this.emit('message', data);
                    } catch (error) {
                        console.error('❌ Error parsing WebSocket message:', error);
                    }
                };

                this.ws.onclose = (event) => {
                    console.log('🔌 WebSocket connection closed:', event.code, event.reason);
                    this.isConnecting = false;
                    this.emit('disconnected');

                    // Attempt to reconnect if it wasn't a manual close
                    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.scheduleReconnect();
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    this.isConnecting = false;
                    this.emit('error', error);
                    reject(error);
                };

            } catch (error) {
                console.error('❌ Failed to create WebSocket connection:', error);
                this.isConnecting = false;
                reject(error);
            }
        });
    }

    private scheduleReconnect() {
        this.reconnectAttempts++;
        console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectInterval}ms`);

        setTimeout(() => {
            this.connect().catch(error => {
                console.error('❌ Reconnection failed:', error);
            });
        }, this.reconnectInterval);
    }

    disconnect() {
        if (this.ws) {
            console.log('🔌 Manually disconnecting WebSocket');
            this.ws.close(1000, 'Manual disconnect');
            this.ws = null;
        }
    }

    send(data: any) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            try {
                const message = JSON.stringify(data);
                console.log('📤 Sending WebSocket message:', data);
                this.ws.send(message);
                return true;
            } catch (error) {
                console.error('❌ Error sending WebSocket message:', error);
                return false;
            }
        } else {
            console.warn('⚠️ WebSocket is not connected. Message not sent:', data);
            return false;
        }
    }

    on(event: string, callback: Function) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    off(event: string, callback: Function) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    private emit(event: string, data?: any) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error in WebSocket event listener for ${event}:`, error);
                }
            });
        }
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    getReadyState(): number | null {
        return this.ws?.readyState ?? null;
    }

    updateToken(token: string) {
        this.token = token;
        // Reconnect with new token if currently connected
        if (this.isConnected()) {
            this.disconnect();
            this.connect();
        }
    }
}

// Create singleton instance
let wsService: WebSocketService | null = null;

export const createWebSocketService = (url: string, token?: string): WebSocketService => {
    if (wsService) {
        wsService.disconnect();
    }
    wsService = new WebSocketService(url, token);
    return wsService;
};

export const getWebSocketService = (): WebSocketService | null => {
    return wsService;
};

export default WebSocketService;