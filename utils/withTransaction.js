const mongoose = require("mongoose");

function canUseTransactions() {
    try {
        const type = mongoose.connection?.client?.topology?.description?.type;
        return (
            type === "ReplicaSetWithPrimary" ||
            type === "ReplicaSetNoPrimary" ||
            type === "Sharded" ||
            type === "LoadBalanced"
        );
    } catch {
        return false;
    }
}

/**
 * Runs work inside a MongoDB transaction on replica sets / Atlas.
 * On standalone MongoDB (local Docker), runs without a session.
 */
module.exports = async function withTransaction(work) {
    if (!canUseTransactions()) {
        return work(null);
    }

    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            result = await work(session);
        });

        return result;
    } finally {
        session.endSession();
    }
};
