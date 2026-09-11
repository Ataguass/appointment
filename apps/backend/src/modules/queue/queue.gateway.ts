import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';

interface SocketClient {
  id: string;
  join: (room: string) => void;
  leave: (room: string) => void;
}

interface SocketServer {
  to: (room: string) => { emit: (event: string, data: any) => void };
  emit: (event: string, data: any) => void;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/queue',
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: SocketServer;

  private readonly logger = new Logger(QueueGateway.name);

  handleConnection(client: SocketClient) {
    this.logger.log(`Client connected to queue gateway: ${client.id}`);
  }

  handleDisconnect(client: SocketClient) {
    this.logger.log(`Client disconnected from queue gateway: ${client.id}`);
  }

  /**
   * Subscribe to live updates for a doctor's queue.
   */
  @SubscribeMessage('joinDoctorQueue')
  handleJoinDoctorQueue(
    @ConnectedSocket() client: SocketClient,
    @MessageBody() data: { doctorId: string },
  ) {
    if (data?.doctorId) {
      const room = `doctor:${data.doctorId}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined room ${room}`);
      return { event: 'joined', room };
    }
  }

  /**
   * Unsubscribe from doctor queue updates.
   */
  @SubscribeMessage('leaveDoctorQueue')
  handleLeaveDoctorQueue(
    @ConnectedSocket() client: SocketClient,
    @MessageBody() data: { doctorId: string },
  ) {
    if (data?.doctorId) {
      const room = `doctor:${data.doctorId}`;
      client.leave(room);
      this.logger.log(`Client ${client.id} left room ${room}`);
      return { event: 'left', room };
    }
  }

  /**
   * Subscribe to personal appointment/token status updates.
   */
  @SubscribeMessage('joinPatientQueue')
  handleJoinPatientQueue(
    @ConnectedSocket() client: SocketClient,
    @MessageBody() data: { appointmentId: string },
  ) {
    if (data?.appointmentId) {
      const room = `appointment:${data.appointmentId}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined room ${room}`);
      return { event: 'joined', room };
    }
  }

  /**
   * Broadcast full queue updates to all clients watching a doctor.
   */
  broadcastQueueUpdate(doctorId: string, queueState: unknown) {
    if (this.server) {
      this.server.to(`doctor:${doctorId}`).emit('queue:updated', queueState);
      // Also broadcast to general hospital waiting display room
      this.server.emit('queue:hospital_updated', { doctorId, queueState });
    }
  }

  /**
   * Broadcast audio/visual token call alert (e.g. for TV display & patient tracker).
   */
  broadcastTokenCalled(doctorId: string, tokenData: unknown) {
    if (this.server) {
      this.server.to(`doctor:${doctorId}`).emit('queue:token_called', tokenData);
      this.server.emit('queue:token_called_display', tokenData);
    }
  }

  /**
   * Broadcast doctor delay announcement.
   */
  broadcastDoctorDelay(doctorId: string, delayData: unknown) {
    if (this.server) {
      this.server.to(`doctor:${doctorId}`).emit('queue:doctor_running_late', delayData);
    }
  }
}
