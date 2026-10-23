// Applies a theme picked by hand before the first paint, so a dark page
// doesn't flash light on load. Reads the save written by src/storage.ts.
try {
  const theme = JSON.parse(localStorage.getItem("stop-the-bar/v1"))?.settings?.theme;
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
} catch {
  // blocked storage or a corrupted save: stay on the system theme
}
