import { EventEmitter } from 'events';

export class Signaling extends EventEmitter {
    private signalingServer: any;

    constructor(serverUrl: string) {
        super();
        this.signalingServer = new WebSocket(serverUrl);
        this.signalingServer.onmessage = this.onSignalReceived.bind(this);
    }

    initiateSignaling() {
        // Üzenet küldése a szervernek a kapcsolat kezdeményezéséhez
        this.sendSignal({ type: 'initiate', message: 'Hellobello' });
    }

    sendSignal(signal: any) {
        this.signalingServer.send(JSON.stringify(signal));
    }

    onSignalReceived(event: MessageEvent) {
        const signal = JSON.parse(event.data);
        this.emit('signalReceived', signal);
    }
}