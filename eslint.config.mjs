import js from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(
 {ignores:['dist/**','node_modules/**','data/**']},
 js.configs.recommended,
 ...tseslint.configs.recommended,
 {files:['**/*.ts','**/*.mjs'],languageOptions:{globals:{process:'readonly',console:'readonly',Buffer:'readonly',setTimeout:'readonly',clearTimeout:'readonly',setInterval:'readonly',clearInterval:'readonly',URL:'readonly'}},rules:{'@typescript-eslint/no-unused-vars':['warn',{argsIgnorePattern:'^_',varsIgnorePattern:'^_'}],'no-empty':['error',{allowEmptyCatch:true}]}}
);
