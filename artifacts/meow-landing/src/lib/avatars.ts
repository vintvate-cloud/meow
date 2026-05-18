export const AVATAR_IMAGES = [
  "/avatar-images/IMG-20260518-WA0038.jpg",
  "/avatar-images/IMG-20260518-WA0039.jpg",
  "/avatar-images/IMG-20260518-WA0040.jpg",
  "/avatar-images/IMG-20260518-WA0041.jpg",
  "/avatar-images/IMG-20260518-WA0042.jpg",
  "/avatar-images/IMG-20260518-WA0043.jpg",
  "/avatar-images/IMG-20260518-WA0044.jpg",
  "/avatar-images/IMG-20260518-WA0045.jpg",
  "/avatar-images/IMG-20260518-WA0046.jpg",
  "/avatar-images/IMG-20260518-WA0047.jpg",
  "/avatar-images/IMG-20260518-WA0048.jpg",
  "/avatar-images/IMG-20260518-WA0049.jpg",
  "/avatar-images/IMG-20260518-WA0050.jpg",
  "/avatar-images/IMG-20260518-WA0051.jpg",
  "/avatar-images/IMG-20260518-WA0052.jpg",
  "/avatar-images/IMG-20260518-WA0053.jpg",
  "/avatar-images/IMG-20260518-WA0054.jpg",
  "/avatar-images/IMG-20260518-WA0055.jpg",
  "/avatar-images/IMG-20260518-WA0056.jpg",
  "/avatar-images/IMG-20260518-WA0058.jpg",
  "/avatar-images/IMG-20260518-WA0061.jpg",
  "/avatar-images/IMG-20260518-WA0062.jpg",
  "/avatar-images/IMG-20260518-WA0063.jpg",
  "/avatar-images/IMG-20260518-WA0064.jpg",
  "/avatar-images/file_000000002c48720ba7cb59142acd08d8.png",
  "/avatar-images/file_00000000601471fdb2ff85ca4a8a7f62.png",
  "/avatar-images/file_000000006b3471fd855379ad42cea08f.png",
  "/avatar-images/file_00000000d91071f8bec3981c55536d96.png"
];

// Firebase Auth requires photoURL to be a fully qualified URL.
// We use a dummy domain to store the relative path safely in Firebase,
// and strip it when rendering in the UI.
export const formatAvatarUrlForStorage = (url: string) => {
  if (url.startsWith("/avatar-images/")) {
    return `https://avatar.meow${url}`;
  }
  return url;
};

export const parseAvatarUrlFromStorage = (url: string | null) => {
  if (!url) return AVATAR_IMAGES[0];
  if (url.startsWith("https://avatar.meow/avatar-images/")) {
    return url.replace("https://avatar.meow", "");
  }
  // Fallback if stored with localhost origin during development
  try {
    const urlObj = new URL(url);
    if (urlObj.pathname.startsWith('/avatar-images/')) {
      return urlObj.pathname;
    }
  } catch (e) {
    // Ignore invalid URLs
  }
  return url;
};
