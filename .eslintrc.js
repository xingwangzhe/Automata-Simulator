module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: [
    'plugin:vue/vue3-recommended', // 使用推荐配置而非严格配置
    'eslint:recommended',
    '@vue/typescript/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2021,
  },
  rules: {
    // 关闭或降低常见规则的严格程度
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'off',

    // 格式化规则设为警告而非错误
    indent: ['warn', 2],
    quotes: ['warn', 'single'],
    semi: ['warn', 'always'],

    // 关闭更多严格规则
    'prefer-const': 'off',
    'no-var': 'off',
  },
}
