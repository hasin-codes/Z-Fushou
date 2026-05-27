export {};

declare global {
  interface Window {
    discordSidebar?: {
      open: (url: string) => void;
      close: () => void;
      setBounds: (bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
      }) => void;
      onCloseRequest?: (callback: () => void) => void;
      offCloseRequest?: (callback: () => void) => void;
      onRefreshBounds?: (callback: () => void) => void;
      offRefreshBounds?: (callback: () => void) => void;
    };
    windowControls?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      zoomIn: () => void;
      zoomOut: () => void;
      zoomReset: () => void;
      getZoomFactor: () => number;
      enterLoginMode: () => void;
      exitLoginMode: () => void;
    };
    desktopAuth?: {
      saveToken: (token: string) => Promise<void>;
      readToken: () => Promise<string | null>;
      deleteToken: () => Promise<void>;
      openLoginPage: () => Promise<void>;
      onDeepLinkToken: (callback: (token: string) => void) => void;
      offDeepLinkToken: (callback: (token: string) => void) => void;
    };
  }
}
