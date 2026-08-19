export type ConnectivityState = "ONLINE" | "OFFLINE" | "DEGRADED" | "SYNCING";

export class ConnectivityService {
  private state: ConnectivityState = typeof navigator !== "undefined" && !navigator.onLine ? "OFFLINE" : "ONLINE";
  private listeners: Array<(state: ConnectivityState) => void> = [];
  private checkInterval: any = null;
  private isSimulatedOffline: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        if (!this.isSimulatedOffline) {
          this.setState("ONLINE");
        }
      });
      window.addEventListener("offline", () => {
        this.setState("OFFLINE");
      });
    }
  }

  public getState(): ConnectivityState {
    if (this.isSimulatedOffline) return "OFFLINE";
    return this.state;
  }

  public isOnline(): boolean {
    return this.getState() === "ONLINE" || this.getState() === "SYNCING";
  }

  public isOffline(): boolean {
    return this.getState() === "OFFLINE";
  }

  public setState(newState: ConnectivityState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.notifyListeners();
    }
  }

  public setSimulatedOffline(offline: boolean): void {
    this.isSimulatedOffline = offline;
    this.setState(offline ? "OFFLINE" : "ONLINE");
  }

  public isOfflineSimulated(): boolean {
    return this.isSimulatedOffline;
  }

  public subscribe(listener: (state: ConnectivityState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    const current = this.getState();
    this.listeners.forEach((l) => {
      try {
        l(current);
      } catch (_) {}
    });
  }

  /**
   * Lightweight probe to test backend reachability
   */
  public async probeReachability(): Promise<boolean> {
    if (this.isSimulatedOffline) return false;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.setState("OFFLINE");
      return false;
    }

    try {
      if (typeof fetch === "function") {
        // Fast ping check with 3s timeout
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        await fetch(window.location.origin + "/favicon.ico", {
          method: "HEAD",
          signal: controller.signal,
          cache: "no-cache",
        });
        clearTimeout(timer);
        this.setState("ONLINE");
        return true;
      }
      return true;
    } catch (_) {
      this.setState("DEGRADED");
      return false;
    }
  }
}

export const connectivityService = new ConnectivityService();
