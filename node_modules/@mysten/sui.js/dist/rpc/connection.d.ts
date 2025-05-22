interface ConnectionOptions {
    fullnode: string;
    websocket?: string;
    faucet?: string;
}
export declare class Connection {
    #private;
    constructor(options: ConnectionOptions);
    get fullnode(): string;
    get websocket(): string;
    get faucet(): string | undefined;
}
export declare const localnetConnection: Connection;
export declare const devnetConnection: Connection;
export {};
