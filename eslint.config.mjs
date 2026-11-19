import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: [
      'dist/**/*',
      'node_modules/**/*',
      'static/**/*',
      'server/**/*',
      'tests/**/*',
      'src/**/*',
      'server.ts',
      'eslint.config.mjs'
    ]
  },
  firebaseRulesPlugin.configs['flat/recommended']
];
