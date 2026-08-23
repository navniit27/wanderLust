/** @type {import('jest').Config} */
process.env.NODE_ENV = "test";
process.env.SECRET = process.env.SECRET || "test-secret-value-for-jest";

module.exports = {
    testEnvironment: "node",
    testTimeout: 60000,
    verbose: true,
};
