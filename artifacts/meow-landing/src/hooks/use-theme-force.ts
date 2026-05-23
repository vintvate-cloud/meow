import { useEffect } from "react";

export function useForceLightTheme() {
  useEffect(() => {
    // Save original state
    const wasDark = document.documentElement.classList.contains("dark");
    
    // Force light
    document.documentElement.classList.remove("dark");

    // Restore on unmount if it was dark and local storage says dark
    return () => {
      const theme = localStorage.getItem("theme");
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      }
    };
  }, []);
}
