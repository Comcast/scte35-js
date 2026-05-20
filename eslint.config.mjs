import js from "@eslint/js";
import typescriptParser from "@typescript-eslint/parser";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";

export default [
    {
        ignores: ["node_modules/**", "build/**", "docs/**", "jsdoc/**", "__tests__/**", "ui/**"],
    },
    js.configs.recommended,
    {
        languageOptions: {
            globals: {
                Buffer: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                console: "readonly",
                exports: "readonly",
                module: "readonly",
                process: "readonly",
                require: "readonly",
            },
        },
    },
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: "module",
            },
        },
        plugins: {
            "@typescript-eslint": typescriptPlugin,
        },
        rules: {
            ...typescriptPlugin.configs.recommended.rules,
        },
    },
];
