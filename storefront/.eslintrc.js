module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  rules: {
    "@next/next/no-page-custom-font": "off",
  },
  settings: {
    next: {
      rootDir: __dirname,
    },
  },
};