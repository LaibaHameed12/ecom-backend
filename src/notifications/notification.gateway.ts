import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    constructor(private readonly jwtService: JwtService) { }

    async handleConnection(client: Socket) {
        try {
            // token should be sent in handshake auth: { token }
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
            if (!token) throw new Error('No token');

            const payload: any = await this.jwtService.verifyAsync(token);
            const userId = payload.sub ?? payload._id;
            if (!userId) throw new Error('Invalid token');

            client.join(String(userId));
            client.data.userId = String(userId);
        } catch (err) {
            // refuse connection if not authenticated
            client.disconnect(true);
        }
    }

    handleDisconnect(client: Socket) {
        // optional cleanup
    }
}
