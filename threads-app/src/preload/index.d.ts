import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getAccounts: () => Promise<any[]>
      createAccount: (data: any) => Promise<any>
      deleteAccount: (id: string) => Promise<any>
      importAccounts: () => Promise<{ success: boolean; count?: number; message?: string; error?: string }>
      exportAccounts: () => Promise<boolean>
      getProxies: () => Promise<any[]>
      createProxy: (data: any) => Promise<any>
      deleteProxy: (id: string) => Promise<any>

      getPosts: () => Promise<any[]>
      createPost: (data: any) => Promise<any>
      deletePost: (id: string) => Promise<any>
      getCampaigns: () => Promise<any[]>
      createCampaign: (data: any) => Promise<any>
      deleteCampaign: (id: string) => Promise<any>
      uploadMedia: () => Promise<string[]>
      startCheckLive: (accountId: string) => Promise<boolean>
      startCampaign: (campaignId: string) => Promise<boolean>
    }
  }
}
