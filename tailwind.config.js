/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "dark-gray": "#101828",
        brand: "#D15949",
        stroke: "#E0E0E0",
        button: "#FEC248",
        "button-hover": "#CB9B3A",
        dark: "#B24A3B",
        darker: "#7D352C",
        light: "#F1F9FB",
        "menu-hover": "#FFE4CB",
        text: "#272727",
        link: "#027FDD",
        linkHover: "#166fb2"
      },
      fontFamily: {
        redhat: "Red Hat Display",
        inter: "Inter"
      },
      container: {
        padding: {
          DEFAULT: "1rem",
          "md": "1.5rem",
          "xl": "6rem"
        }
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.text'),
            a: {
              color: theme('colors.link'),
              textDecoration: "none"
            },
            'a:hover': {
              color: theme('colors.linkHover'),
              textDecoration: "underline"
            },
            li: {
              fontFamily: "Inter",
              listStyle: "none",
              fontSize: "1em"
            },
            p: {
              fontFamily: "Inter",
              fontSize: "1em"
            },
            h1: {
              fontFamily: "Red Hat Display",
              fontSize: "2.25em",
              marginTop: "1rem",
              marginBottom: "2.25rem"
            },
            h2: {
              fontSize: "1.75em",
              fontFamily: "Red Hat Display",
              marginBottom: "1rem"
            }
          }
        }
      })
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
}
