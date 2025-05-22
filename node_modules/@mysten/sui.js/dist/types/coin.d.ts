import { Infer } from 'superstruct';
export declare const CoinStruct: import("superstruct").Struct<{
    version: number;
    digest: string;
    coinType: string;
    previousTransaction: string;
    coinObjectId: string;
    balance: number;
    lockedUntilEpoch: number | null;
}, {
    coinType: import("superstruct").Struct<string, null>;
    coinObjectId: import("superstruct").Struct<string, null>;
    version: import("superstruct").Struct<number, null>;
    digest: import("superstruct").Struct<string, null>;
    balance: import("superstruct").Struct<number, null>;
    lockedUntilEpoch: import("superstruct").Struct<number | null, null>;
    previousTransaction: import("superstruct").Struct<string, null>;
}>;
export type CoinStruct = Infer<typeof CoinStruct>;
export declare const PaginatedCoins: import("superstruct").Struct<{
    data: {
        version: number;
        digest: string;
        coinType: string;
        previousTransaction: string;
        coinObjectId: string;
        balance: number;
        lockedUntilEpoch: number | null;
    }[];
    nextCursor: string | null;
    hasNextPage: boolean;
}, {
    data: import("superstruct").Struct<{
        version: number;
        digest: string;
        coinType: string;
        previousTransaction: string;
        coinObjectId: string;
        balance: number;
        lockedUntilEpoch: number | null;
    }[], import("superstruct").Struct<{
        version: number;
        digest: string;
        coinType: string;
        previousTransaction: string;
        coinObjectId: string;
        balance: number;
        lockedUntilEpoch: number | null;
    }, {
        coinType: import("superstruct").Struct<string, null>;
        coinObjectId: import("superstruct").Struct<string, null>;
        version: import("superstruct").Struct<number, null>;
        digest: import("superstruct").Struct<string, null>;
        balance: import("superstruct").Struct<number, null>;
        lockedUntilEpoch: import("superstruct").Struct<number | null, null>;
        previousTransaction: import("superstruct").Struct<string, null>;
    }>>;
    nextCursor: import("superstruct").Struct<string | null, null>;
    hasNextPage: import("superstruct").Struct<boolean, null>;
}>;
export type PaginatedCoins = Infer<typeof PaginatedCoins>;
export declare const CoinBalance: import("superstruct").Struct<{
    coinType: string;
    coinObjectCount: number;
    totalBalance: number;
    lockedBalance: {
        number?: number | undefined;
        epochId?: number | undefined;
    };
}, {
    coinType: import("superstruct").Struct<string, null>;
    coinObjectCount: import("superstruct").Struct<number, null>;
    totalBalance: import("superstruct").Struct<number, null>;
    lockedBalance: import("superstruct").Struct<{
        number?: number | undefined;
        epochId?: number | undefined;
    }, {
        epochId: import("superstruct").Struct<number | undefined, null>;
        number: import("superstruct").Struct<number | undefined, null>;
    }>;
}>;
export type CoinBalance = Infer<typeof CoinBalance>;
export declare const CoinSupply: import("superstruct").Struct<{
    value: number;
}, {
    value: import("superstruct").Struct<number, null>;
}>;
export type CoinSupply = Infer<typeof CoinSupply>;
