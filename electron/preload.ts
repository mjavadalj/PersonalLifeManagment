import { contextBridge, ipcRenderer } from "electron";
import type { Bridge } from "../src/shared/types";
const bridge: Bridge = {
  read: () => ipcRenderer.invoke("roy:read"),
  dispatch: (command) => ipcRenderer.invoke("roy:dispatch", command),
  importMedia: () => ipcRenderer.invoke("roy:import"),
  openSource: (id) => ipcRenderer.invoke("roy:source", id),
  windowAction: (action) => ipcRenderer.invoke("roy:window", action),
  widgetHeight: (height) => ipcRenderer.send("roy:height", height),
  onPauseMedia: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("roy:pause-media", handler);
    return () => ipcRenderer.removeListener("roy:pause-media", handler);
  },
  subscribe: (callback) => {
    const handler = (
      _event: unknown,
      snapshot: Parameters<typeof callback>[0],
    ) => callback(snapshot);
    ipcRenderer.on("roy:state", handler);
    return () => ipcRenderer.removeListener("roy:state", handler);
  },
};
contextBridge.exposeInMainWorld("roy", bridge);
