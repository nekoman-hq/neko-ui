/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./.rnstorybook/**/*.{js,jsx,ts,tsx}",
    "./.rnstorybook/preview.tsx",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Hier deine Custom-Colors hinzufügen, NICHT unter colors direkt!
      colors: {
        /* Core */
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",

        border: "rgb(var(--border) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        "card-foreground": "rgb(var(--card-foreground) / <alpha-value>)",

        /* Semantic */
        primary: "rgb(var(--primary) / <alpha-value>)",
        "primary-foreground": "rgb(var(--primary-foreground) / <alpha-value>)",

        destructive: "rgb(var(--destructive) / <alpha-value>)",
        "destructive-foreground":
          "rgb(var(--destructive-foreground) / <alpha-value>)",

        success: "rgb(var(--success) / <alpha-value>)",
        "success-foreground": "rgb(var(--success-foreground) / <alpha-value>)",

        muted: "rgb(var(--muted) / <alpha-value>)",
        "muted-foreground": "rgb(var(--muted-foreground) / <alpha-value>)",

        /* Charts */
        "chart1-primary": "rgb(var(--chart1-primary) / <alpha-value>)",
        "chart1-secondary": "rgb(var(--chart1-secondary) / <alpha-value>)",

        /*SegmentControl*/
        "segment-background": "rgb(var(--segment-background) / <alpha-value>)",
        "segment-active": "rgb(var(--segment-active) / <alpha-value>)",
        "segment-inactive": "rgb(var(--segment-inactive) / <alpha-value>)",

        /*RichText*/
        "rich-editor-title": "rgb(var(--rich-editor-title) / <alpha-value>)",
      },
    },
  },
  plugins: [
    ({ addBase }) =>
      addBase({
        ":root": {
          /* Core */
          "--background": "16 16 20",
          "--foreground": "250 250 250",

          "--border": "27 31 55",
          "--card": "27 31 55",
          "--card-foreground": "250 250 250",

          /* Semantic */
          "--primary": "36 100 240",
          "--primary-foreground": "250 250 250",

          "--destructive": "246 52 52",
          "--destructive-foreground": "250 250 250",

          "--success": "18 76 27",
          "--success-foreground": "250 250 250",

          "--muted": "38 38 38",
          "--muted-foreground": "161 161 161",

          /* Charts */
          "--chart1-primary": "36 100 240",
          "--chart1-secondary": "10 68 194",

          /* SegmentControl */
          "--segment-background": "36 100 240",
          "--segment-active": "250 250 250",
          "--segment-inactive": "161 161 161",

          /* RichTextEditor */
          "--rich-editor-title": "250 250 250",
        },
      }),
  ],
};
