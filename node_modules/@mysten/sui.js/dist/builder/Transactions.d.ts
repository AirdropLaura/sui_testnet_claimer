import { Infer, Struct } from 'superstruct';
import { ObjectId } from '../types/common';
export declare const TransactionBlockInput: Struct<{
    kind: "Input";
    index: number;
    type?: "object" | "pure" | undefined;
    value?: any;
}, {
    kind: Struct<"Input", "Input">;
    index: Struct<number, null>;
    value: Struct<any, null>;
    type: Struct<"object" | "pure" | undefined, null>;
}>;
export type TransactionBlockInput = Infer<typeof TransactionBlockInput>;
export declare const TransactionArgument: Struct<{
    kind: "Input";
    index: number;
    type?: "object" | "pure" | undefined;
    value?: any;
} | {
    kind: "GasCoin";
} | {
    kind: "Result";
    index: number;
} | {
    kind: "NestedResult";
    index: number;
    resultIndex: number;
}, null>;
export type TransactionArgument = Infer<typeof TransactionArgument>;
export declare const ObjectTransactionArgument: Struct<{
    kind: "Input";
    index: number;
    type?: "object" | "pure" | undefined;
    value?: any;
} | {
    kind: "GasCoin";
} | {
    kind: "Result";
    index: number;
} | {
    kind: "NestedResult";
    index: number;
    resultIndex: number;
}, null>;
export declare const PureTransactionArgument: (type: string) => Struct<{
    kind: "Input";
    index: number;
    type?: "object" | "pure" | undefined;
    value?: any;
} | {
    kind: "GasCoin";
} | {
    kind: "Result";
    index: number;
} | {
    kind: "NestedResult";
    index: number;
    resultIndex: number;
}, null>;
export declare const MoveCallTransaction: Struct<{
    arguments: ({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[];
    kind: "MoveCall";
    typeArguments: string[];
    target: `${string}::${string}::${string}`;
}, {
    kind: Struct<"MoveCall", "MoveCall">;
    target: Struct<`${string}::${string}::${string}`, null>;
    typeArguments: Struct<string[], Struct<string, null>>;
    arguments: Struct<({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[], Struct<{
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    }, null>>;
}>;
export type MoveCallTransaction = Infer<typeof MoveCallTransaction>;
export declare const TransferObjectsTransaction: Struct<{
    objects: ({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[];
    kind: "TransferObjects";
    address: {
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    };
}, {
    kind: Struct<"TransferObjects", "TransferObjects">;
    objects: Struct<({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[], Struct<{
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    }, null>>;
    address: Struct<{
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    }, null>;
}>;
export type TransferObjectsTransaction = Infer<typeof TransferObjectsTransaction>;
export declare const SplitCoinsTransaction: Struct<{
    kind: "SplitCoins";
    coin: {
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    };
    amounts: ({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[];
}, {
    kind: Struct<"SplitCoins", "SplitCoins">;
    coin: Struct<{
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    }, null>;
    amounts: Struct<({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[], Struct<{
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    }, null>>;
}>;
export type SplitCoinsTransaction = Infer<typeof SplitCoinsTransaction>;
export declare const MergeCoinsTransaction: Struct<{
    kind: "MergeCoins";
    destination: {
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    };
    sources: ({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[];
}, {
    kind: Struct<"MergeCoins", "MergeCoins">;
    destination: Struct<{
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    }, null>;
    sources: Struct<({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[], Struct<{
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    }, null>>;
}>;
export type MergeCoinsTransaction = Infer<typeof MergeCoinsTransaction>;
export declare const MakeMoveVecTransaction: Struct<{
    objects: ({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[];
    kind: "MakeMoveVec";
    type?: {
        None: null;
    } | {
        Some: string;
    } | undefined;
}, {
    kind: Struct<"MakeMoveVec", "MakeMoveVec">;
    type: Struct<{
        None: null;
    } | {
        Some: string;
    } | undefined, null>;
    objects: Struct<({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[], Struct<{
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    }, null>>;
}>;
export type MakeMoveVecTransaction = Infer<typeof MakeMoveVecTransaction>;
export declare const PublishTransaction: Struct<{
    kind: "Publish";
    dependencies: string[];
    modules: number[][];
}, {
    kind: Struct<"Publish", "Publish">;
    modules: Struct<number[][], Struct<number[], Struct<number, null>>>;
    dependencies: Struct<string[], Struct<string, null>>;
}>;
export type PublishTransaction = Infer<typeof PublishTransaction>;
export declare const TransactionType: Struct<{
    arguments: ({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[];
    kind: "MoveCall";
    typeArguments: string[];
    target: `${string}::${string}::${string}`;
} | {
    objects: ({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[];
    kind: "TransferObjects";
    address: {
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    };
} | {
    kind: "SplitCoins";
    coin: {
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    };
    amounts: ({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[];
} | {
    kind: "MergeCoins";
    destination: {
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    };
    sources: ({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[];
} | {
    objects: ({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[];
    kind: "MakeMoveVec";
    type?: {
        None: null;
    } | {
        Some: string;
    } | undefined;
} | {
    kind: "Publish";
    dependencies: string[];
    modules: number[][];
}, null>;
export type TransactionType = Infer<typeof TransactionType>;
export declare function getTransactionType(data: unknown): Struct<{
    arguments: ({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[];
    kind: "MoveCall";
    typeArguments: string[];
    target: `${string}::${string}::${string}`;
}, {
    kind: Struct<"MoveCall", "MoveCall">;
    target: Struct<`${string}::${string}::${string}`, null>;
    typeArguments: Struct<string[], Struct<string, null>>;
    arguments: Struct<({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[], Struct<{
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    }, null>>;
}> | Struct<{
    objects: ({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[];
    kind: "TransferObjects";
    address: {
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    };
}, {
    kind: Struct<"TransferObjects", "TransferObjects">;
    objects: Struct<({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[], Struct<{
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    }, null>>;
    address: Struct<{
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    }, null>;
}> | Struct<{
    kind: "SplitCoins";
    coin: {
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    };
    amounts: ({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[];
}, {
    kind: Struct<"SplitCoins", "SplitCoins">;
    coin: Struct<{
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    }, null>;
    amounts: Struct<({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[], Struct<{
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    }, null>>;
}> | Struct<{
    kind: "MergeCoins";
    destination: {
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    };
    sources: ({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[];
}, {
    kind: Struct<"MergeCoins", "MergeCoins">;
    destination: Struct<{
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    }, null>;
    sources: Struct<({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[], Struct<{
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    }, null>>;
}> | Struct<{
    objects: ({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[];
    kind: "MakeMoveVec";
    type?: {
        None: null;
    } | {
        Some: string;
    } | undefined;
}, {
    kind: Struct<"MakeMoveVec", "MakeMoveVec">;
    type: Struct<{
        None: null;
    } | {
        Some: string;
    } | undefined, null>;
    objects: Struct<({
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    })[], Struct<{
        kind: "Input";
        index: number;
        type?: "object" | "pure" | undefined;
        value?: any;
    } | {
        kind: "GasCoin";
    } | {
        kind: "Result";
        index: number;
    } | {
        kind: "NestedResult";
        index: number;
        resultIndex: number;
    }, null>>;
}> | Struct<{
    kind: "Publish";
    dependencies: string[];
    modules: number[][];
}, {
    kind: Struct<"Publish", "Publish">;
    modules: Struct<number[][], Struct<number[], Struct<number, null>>>;
    dependencies: Struct<string[], Struct<string, null>>;
}>;
/**
 * Simple helpers used to construct transactions:
 */
export declare const Transactions: {
    MoveCall(input: Omit<{
        arguments: ({
            kind: "Input";
            index: number;
            type?: "object" | "pure" | undefined;
            value?: any;
        } | {
            kind: "GasCoin";
        } | {
            kind: "Result";
            index: number;
        } | {
            kind: "NestedResult";
            index: number;
            resultIndex: number;
        })[];
        kind: "MoveCall";
        typeArguments: string[];
        target: `${string}::${string}::${string}`;
    }, "arguments" | "kind" | "typeArguments"> & {
        arguments?: ({
            kind: "Input";
            index: number;
            type?: "object" | "pure" | undefined;
            value?: any;
        } | {
            kind: "GasCoin";
        } | {
            kind: "Result";
            index: number;
        } | {
            kind: "NestedResult";
            index: number;
            resultIndex: number;
        })[] | undefined;
        typeArguments?: string[] | undefined;
    }): MoveCallTransaction;
    TransferObjects(objects: TransactionArgument[], address: TransactionArgument): TransferObjectsTransaction;
    SplitCoins(coin: TransactionArgument, amounts: TransactionArgument[]): SplitCoinsTransaction;
    MergeCoins(destination: TransactionArgument, sources: TransactionArgument[]): MergeCoinsTransaction;
    Publish(modules: number[][], dependencies: ObjectId[]): PublishTransaction;
    MakeMoveVec({ type, objects, }: Omit<{
        objects: ({
            kind: "Input";
            index: number;
            type?: "object" | "pure" | undefined;
            value?: any;
        } | {
            kind: "GasCoin";
        } | {
            kind: "Result";
            index: number;
        } | {
            kind: "NestedResult";
            index: number;
            resultIndex: number;
        })[];
        kind: "MakeMoveVec";
        type?: {
            None: null;
        } | {
            Some: string;
        } | undefined;
    }, "type" | "kind"> & {
        type?: string | undefined;
    }): MakeMoveVecTransaction;
};
