import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class NotificationGateway {
    @WebSocketServer()
    server: Server;

    // Users join their personal room for private notifications
    @SubscribeMessage('joinRoom')
    handleJoinRoom(@ConnectedSocket() client: Socket, payload: { userId: string }) {
        client.join(payload.userId);
    }
}
