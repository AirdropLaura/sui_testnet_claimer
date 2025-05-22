import { Infer } from 'superstruct';
export declare const GasCostSummary: import("superstruct").Struct<{
    computationCost: number;
    storageCost: number;
    storageRebate: number;
    nonRefundableStorageFee: number;
}, {
    computationCost: import("superstruct").Struct<number, null>;
    storageCost: import("superstruct").Struct<number, null>;
    storageRebate: import("superstruct").Struct<number, null>;
    nonRefundableStorageFee: import("superstruct").Struct<number, null>;
}>;
export type GasCostSummary = Infer<typeof GasCostSummary>;
export declare const CheckPointContentsDigest: import("superstruct").Struct<string, null>;
export type CheckPointContentsDigest = Infer<typeof CheckPointContentsDigest>;
export declare const CheckpointDigest: import("superstruct").Struct<string, null>;
export type CheckpointDigest = Infer<typeof CheckpointDigest>;
export declare const ECMHLiveObjectSetDigest: import("superstruct").Struct<{
    digest: number[];
}, {
    digest: import("superstruct").Struct<number[], import("superstruct").Struct<number, null>>;
}>;
export type ECMHLiveObjectSetDigest = Infer<typeof ECMHLiveObjectSetDigest>;
export declare const CheckpointCommitment: import("superstruct").Struct<any, null>;
export type CheckpointCommitment = Infer<typeof CheckpointCommitment>;
export declare const EndOfEpochData: import("superstruct").Struct<{
    nextEpochCommittee: [string, number][];
    nextEpochProtocolVersion: number;
    epochCommitments: any[];
}, {
    nextEpochCommittee: import("superstruct").Struct<[string, number][], import("superstruct").Struct<[string, number], null>>;
    nextEpochProtocolVersion: import("superstruct").Struct<number, null>;
    epochCommitments: import("superstruct").Struct<any[], import("superstruct").Struct<any, null>>;
}>;
export type EndOfEpochData = Infer<typeof EndOfEpochData>;
export declare const ExecutionDigests: import("superstruct").Struct<{
    transaction: string;
    effects: string;
}, {
    transaction: import("superstruct").Struct<string, null>;
    effects: import("superstruct").Struct<string, null>;
}>;
export declare const Checkpoint: import("superstruct").Struct<{
    timestampMs: number;
    epoch: number;
    digest: string;
    transactions: string[];
    sequenceNumber: string;
    networkTotalTransactions: number;
    epochRollingGasCostSummary: {
        computationCost: number;
        storageCost: number;
        storageRebate: number;
        nonRefundableStorageFee: number;
    };
    checkpointCommitments: any[];
    previousDigest?: string | undefined;
    endOfEpochData?: {
        nextEpochCommittee: [string, number][];
        nextEpochProtocolVersion: number;
        epochCommitments: any[];
    } | undefined;
}, {
    epoch: import("superstruct").Struct<number, null>;
    sequenceNumber: import("superstruct").Struct<string, null>;
    digest: import("superstruct").Struct<string, null>;
    networkTotalTransactions: import("superstruct").Struct<number, null>;
    previousDigest: import("superstruct").Struct<string | undefined, null>;
    epochRollingGasCostSummary: import("superstruct").Struct<{
        computationCost: number;
        storageCost: number;
        storageRebate: number;
        nonRefundableStorageFee: number;
    }, {
        computationCost: import("superstruct").Struct<number, null>;
        storageCost: import("superstruct").Struct<number, null>;
        storageRebate: import("superstruct").Struct<number, null>;
        nonRefundableStorageFee: import("superstruct").Struct<number, null>;
    }>;
    timestampMs: import("superstruct").Struct<number, null>;
    endOfEpochData: import("superstruct").Struct<{
        nextEpochCommittee: [string, number][];
        nextEpochProtocolVersion: number;
        epochCommitments: any[];
    } | undefined, {
        nextEpochCommittee: import("superstruct").Struct<[string, number][], import("superstruct").Struct<[string, number], null>>;
        nextEpochProtocolVersion: import("superstruct").Struct<number, null>;
        epochCommitments: import("superstruct").Struct<any[], import("superstruct").Struct<any, null>>;
    }>;
    transactions: import("superstruct").Struct<string[], import("superstruct").Struct<string, null>>;
    checkpointCommitments: import("superstruct").Struct<any[], import("superstruct").Struct<any, null>>;
}>;
export type Checkpoint = Infer<typeof Checkpoint>;
export declare const CheckpointPage: import("superstruct").Struct<{
    data: {
        timestampMs: number;
        epoch: number;
        digest: string;
        transactions: string[];
        sequenceNumber: string;
        networkTotalTransactions: number;
        epochRollingGasCostSummary: {
            computationCost: number;
            storageCost: number;
            storageRebate: number;
            nonRefundableStorageFee: number;
        };
        checkpointCommitments: any[];
        previousDigest?: string | undefined;
        endOfEpochData?: {
            nextEpochCommittee: [string, number][];
            nextEpochProtocolVersion: number;
            epochCommitments: any[];
        } | undefined;
    }[];
    nextCursor: string | null;
    hasNextPage: boolean;
}, {
    data: import("superstruct").Struct<{
        timestampMs: number;
        epoch: number;
        digest: string;
        transactions: string[];
        sequenceNumber: string;
        networkTotalTransactions: number;
        epochRollingGasCostSummary: {
            computationCost: number;
            storageCost: number;
            storageRebate: number;
            nonRefundableStorageFee: number;
        };
        checkpointCommitments: any[];
        previousDigest?: string | undefined;
        endOfEpochData?: {
            nextEpochCommittee: [string, number][];
            nextEpochProtocolVersion: number;
            epochCommitments: any[];
        } | undefined;
    }[], import("superstruct").Struct<{
        timestampMs: number;
        epoch: number;
        digest: string;
        transactions: string[];
        sequenceNumber: string;
        networkTotalTransactions: number;
        epochRollingGasCostSummary: {
            computationCost: number;
            storageCost: number;
            storageRebate: number;
            nonRefundableStorageFee: number;
        };
        checkpointCommitments: any[];
        previousDigest?: string | undefined;
        endOfEpochData?: {
            nextEpochCommittee: [string, number][];
            nextEpochProtocolVersion: number;
            epochCommitments: any[];
        } | undefined;
    }, {
        epoch: import("superstruct").Struct<number, null>;
        sequenceNumber: import("superstruct").Struct<string, null>;
        digest: import("superstruct").Struct<string, null>;
        networkTotalTransactions: import("superstruct").Struct<number, null>;
        previousDigest: import("superstruct").Struct<string | undefined, null>;
        epochRollingGasCostSummary: import("superstruct").Struct<{
            computationCost: number;
            storageCost: number;
            storageRebate: number;
            nonRefundableStorageFee: number;
        }, {
            computationCost: import("superstruct").Struct<number, null>;
            storageCost: import("superstruct").Struct<number, null>;
            storageRebate: import("superstruct").Struct<number, null>;
            nonRefundableStorageFee: import("superstruct").Struct<number, null>;
        }>;
        timestampMs: import("superstruct").Struct<number, null>;
        endOfEpochData: import("superstruct").Struct<{
            nextEpochCommittee: [string, number][];
            nextEpochProtocolVersion: number;
            epochCommitments: any[];
        } | undefined, {
            nextEpochCommittee: import("superstruct").Struct<[string, number][], import("superstruct").Struct<[string, number], null>>;
            nextEpochProtocolVersion: import("superstruct").Struct<number, null>;
            epochCommitments: import("superstruct").Struct<any[], import("superstruct").Struct<any, null>>;
        }>;
        transactions: import("superstruct").Struct<string[], import("superstruct").Struct<string, null>>;
        checkpointCommitments: import("superstruct").Struct<any[], import("superstruct").Struct<any, null>>;
    }>>;
    nextCursor: import("superstruct").Struct<string | null, null>;
    hasNextPage: import("superstruct").Struct<boolean, null>;
}>;
export type CheckpointPage = Infer<typeof CheckpointPage>;
