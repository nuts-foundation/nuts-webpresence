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
        linkHover: "#166fb2",
        inkt: "#1C2A39",
        "nuts-blauw": "#004B6B",
        "nuts-blauw-fel": "#0084DF",
        "nuts-groen": "#87A14C",
        zand: "#F0E7E5",
        creme: "#FBF6F4",
        perzik: "#FCE5D3",
        leisteen: "#4C5968",
        grijs: "#5B6470",
        "light-rand": "#DCEBEF",
        "zand-donker": "#D6C9C4",
        pijl: "#B8ADA9",
        onderstreep: "#F0C9C2",
        "nuts-blauw-donker": "#0B122C",
        "fase-idee": "#8B97A8",
        "fase-productie": "#2E8A4F"
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
