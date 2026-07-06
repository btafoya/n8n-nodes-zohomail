import tseslint from 'typescript-eslint';

export default tseslint.config(
	tseslint.configs.recommended,
	{
		files: ['**/*.ts'],
		languageOptions: {
			parserOptions: {
				project: './tsconfig.json',
			},
		},
		ignores: ['vitest.config.ts', '**/*.test.ts'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
	{
		ignores: ['dist/', 'node_modules/'],
	},
);
