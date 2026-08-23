const js = require("@eslint/js");
const prettier = require("eslint-config-prettier");
const globals = require("globals");

module.exports = [
    {
        ignores: ["node_modules/**", "public/js/**", "coverage/**", "scripts/**"],
    },
    js.configs.recommended,
    prettier,
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "commonjs",
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
        rules: {
            "no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_|next|req|res|err",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
            "no-console": "off",
        },
    },
];
