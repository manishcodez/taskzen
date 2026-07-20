import type { MetadataRoute } from "next";

const APP_NAME = "Taskzen";
const DESCRIPTION =
  "Organize subjects, tasks, deadlines, and academic progress in one focused workspace.";

/** Brand surfaces from Zenith Ribbon / dark theme (icon.tsx, globals.css). */
const BACKGROUND = "#171B26";
const THEME = "#171B26";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: BACKGROUND,
    theme_color: THEME,
    lang: "en",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
