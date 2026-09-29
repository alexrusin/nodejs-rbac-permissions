import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['node_modules/', 'src/generated/'] },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: ['src/auth/route.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // Matches calls on a router or app, and any method call whose first argument is a
          // path string, so renaming the router does not get around the rule.
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.property.name=/^(get|post|put|patch|delete|options|head|all|route)$/]:matches([callee.object.name=/^(router|app)$/], [arguments.0.value=/^\\//])",
          message:
            'Register routes with route() from src/auth/route.ts so that every route declares a permission or PUBLIC.',
        },
      ],
    },
  },
);
