import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ namespace: '/sales', cors: { origin: '*' } })
export class SalesGateway {
    @WebSocketServer() server: Server;

    broadcastSaleStarted() {
        this.server.emit('saleStarted', { ts: new Date().toISOString() });
    }
    broadcastSaleEnded() {
        this.server.emit('saleEnded', { ts: new Date().toISOString() });
    }
}
