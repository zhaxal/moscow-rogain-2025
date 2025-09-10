import localfont from "next/font/local";

const mossport = localfont({
  src: "../fonts/mossport/Mossport.otf",
});

const gothampro = localfont({
  src: [
    {
      path: "../fonts/gotham_pro/gothampro_black.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../fonts/gotham_pro/gothampro_blackitalic.ttf",
      weight: "900",
      style: "italic",
    },
    {
      path: "../fonts/gotham_pro/gothampro_bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/gotham_pro/gothampro_bolditalic.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../fonts/gotham_pro/gothampro_italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../fonts/gotham_pro/gothampro_light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/gotham_pro/gothampro_lightitalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../fonts/gotham_pro/gothampro_medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/gotham_pro/gothampro_mediumitalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../fonts/gotham_pro/gothampro.ttf",
      weight: "400",
      style: "normal",
    },
  ],
});

export { mossport, gothampro };
