export const isStandalone = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
};

export const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  return (
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(ua) ||
    isTouch
  );
};
