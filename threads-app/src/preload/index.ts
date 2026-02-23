import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  createAccount: (data: any) => ipcRenderer.invoke('create-account', data),
  deleteAccount: (id: string) => ipcRenderer.invoke('delete-account', id),
  importAccounts: () => ipcRenderer.invoke('import-accounts'),
  exportAccounts: () => ipcRenderer.invoke('export-accounts'),

  getProxies: () => ipcRenderer.invoke('get-proxies'),
  createProxy: (data: any) => ipcRenderer.invoke('create-proxy', data),
  deleteProxy: (id: string) => ipcRenderer.invoke('delete-proxy', id),

  // Auto Post APIs
  getPosts: () => ipcRenderer.invoke('get-posts'),
  createPost: (data: any) => ipcRenderer.invoke('create-post', data),
  deletePost: (id: string) => ipcRenderer.invoke('delete-post', id),

  getCampaigns: () => ipcRenderer.invoke('get-campaigns'),
  createCampaign: (data: any) => ipcRenderer.invoke('create-campaign', data),
  deleteCampaign: (id: string) => ipcRenderer.invoke('delete-campaign', id),
  uploadMedia: () => ipcRenderer.invoke('upload-media'),

  // Automation APIs
  startCheckLive: (accountId: string) => ipcRenderer.invoke('start-check-live', accountId),
  startCampaign: (campaignId: string) => ipcRenderer.invoke('start-campaign', campaignId)
}
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
