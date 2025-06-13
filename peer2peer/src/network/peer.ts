class Peer {
    private peerConnection: RTCPeerConnection;
    private dataChannel: RTCDataChannel;

    constructor() {
        this.peerConnection = new RTCPeerConnection();
        this.dataChannel = this.peerConnection.createDataChannel("gameData");

        this.dataChannel.onopen = () => {
            console.log("Data channel nyitva");
        };

        this.dataChannel.onmessage = (event) => {
            this.handleMessage(event.data);
        };

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignal(event.candidate);
            }
        };
    }

    connect(offer: RTCSessionDescriptionInit): Promise<void> {
        return this.peerConnection.setRemoteDescription(offer)
            .then(() => this.peerConnection.createAnswer())
            .then(answer => {
                return this.peerConnection.setLocalDescription(answer);
            })
            .then(() => {
                if (this.peerConnection.localDescription) {
                    this.sendSignal(this.peerConnection.localDescription);
                } else {
                    console.error("localDescription null");
                }
            });
    }

    disconnect(): void {
        this.dataChannel.close();
        this.peerConnection.close();
        console.log("Lecsatlakozva");
    }

    sendData(data: any): void {
        if (this.dataChannel.readyState === "open") {
            this.dataChannel.send(JSON.stringify(data));
        } else {
            console.error("Data channel nincs nyitva");
        }
    }

    private handleMessage(data: string): void {
        const message = JSON.parse(data);
        // Bejövő cuccos feldolgozása
        console.log("Üzenet:", message);
    }

    private sendSignal(signal: RTCSessionDescriptionInit | RTCIceCandidateInit): void {
        // Szignal küldése a szerverre vagy más peer-re
        console.log("Szignál küldése:", signal);
    }
}