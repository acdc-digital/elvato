module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  rules: {
    "@next/next/no-page-custom-font": "off",
    "@next/next/no-typos": "off",
    "@next/next/no-duplicate-head": "off",
    "@next/next/no-before-interactive-script-outside-document": "off",
  },
  settings: {
    next: {
      rootDir: __dirname,
    },
  },
};