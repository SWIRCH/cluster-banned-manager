/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./assets/**/*.{html,js,css}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
};
