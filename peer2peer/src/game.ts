// Ez a fájl a játéklogika fő belépési pontja. Ez inicializálja a játékot, kezeli a játék ciklusát és kezeli a játékosok interakcióit.
// Ergo logika go brr és ez csinal mindent. Jó, majdnem mindent, mert a hálózati rész külön fájlban van, de ez a játék logika része. Talán.

class Game {
    private players: string[];
    private isRunning: boolean;

    constructor() {
        this.players = [];
        this.isRunning = false;
    }

    public startGame(): void {
        this.isRunning = true;
        this.gameLoop();
    }

    private gameLoop(): void {
        if (!this.isRunning) return;

        // Game logic goes here

        requestAnimationFrame(() => this.gameLoop());
    }

    public addPlayer(playerId: string): void {
        if (!this.players.includes(playerId)) {
            this.players.push(playerId);
            this.onPlayerJoined(playerId);
        }
    }

    private onPlayerJoined(playerId: string): void {
        console.log(`Player ${playerId} has joined the game.`);
        // Additional logic for when a player joins
    }

    public removePlayer(playerId: string): void {
        this.players = this.players.filter(player => player !== playerId);
        this.onPlayerLeft(playerId);
    }

    private onPlayerLeft(playerId: string): void {
        console.log(`Player ${playerId} has left the game.`);
        // Additional logic for when a player leaves
    }

    public stopGame(): void {
        this.isRunning = false;
        console.log("Game has stopped.");
    }
}

export default Game;