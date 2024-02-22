const windows = {};

function createWindowAccessor(key) {
  return {
    setWindow(window) {
      windows[key] = window;
    },
    getWindow() {
      return windows[key];
    },
  };
}

export const { setWindow: setMainWindow, getWindow: getMainWindow } = createWindowAccessor("mainWindow");
export const { setWindow: setOverlayBid, getWindow: getOverlayBid } = createWindowAccessor("overlayBid");
export const { setWindow: setOverlayTimers, getWindow: getOverlayTimers } = createWindowAccessor("overlayTimers");
export const { setWindow: setOverlayItemDetails, getWindow: getOverlayItemDetails } = createWindowAccessor("overlayItemDetails");
export const { setWindow: setOverlayTracker, getWindow: getOverlayTracker } = createWindowAccessor("overlayTracker");
