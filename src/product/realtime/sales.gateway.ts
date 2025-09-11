import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ namespace: '/sales', cors: { origin: '*' } })
export class SalesGateway {
    @WebSocketServer() server: Server;

    broadcastSaleStarted(payload: any) {
        this.server.emit('saleStarted', payload);
    }
    broadcastSaleEnded(payload: any) {
        this.server.emit('saleEnded', payload);
    }
}
