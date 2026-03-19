module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  rules: {
    "@next/next/no-page-custom-font": "off",
    "@next/next/no-typos": "off",
  },
  settings: {
    next: {
      rootDir: __dirname,
    },
  },
};