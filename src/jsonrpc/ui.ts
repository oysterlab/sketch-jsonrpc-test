import BrowserWindow from 'sketch-module-web-view'
import settings from 'sketch/settings'

const WEBVIEW_INFO = 'WebviewInfo'
interface WebviewInfo {
  x:number
  y:number
  url:string
  width:number
  height:number
}

export default class UI {

  WEBVIEW_ID:string = ''

  constructor(WEBVIEW_ID:string) {
    this.WEBVIEW_ID = WEBVIEW_ID
  }

  showUI(url:string, visible:boolean = false) {
    let webview = this.getWebview()
    
    if (!webview) {
      webview = new BrowserWindow({
        identifier: this.WEBVIEW_ID,
        x:1,
        y:1,
        width: 1,
        height: 1,
        show: true,
        alwaysOnTop: true,
        webPreferences: {
          devTools: true,
        }
      })
    } else {
      webview.setSize(1, 1, false)
    }
  //  webview.webContents.openDevTools()
  
    webview.loadURL(url)
  
    this._storeUrlInfo(url) 
    this._restoreSize();
    (visible ? this.show() : this.hide());
  }
  
  show() {
    const webview = this.getWebview();
    if (webview) {
      if (webview.webContents.getURL() == 'null') {
        const { url } = settings.sessionVariable(WEBVIEW_INFO) || {} as WebviewInfo;
        (url && this.showUI(url, true)); 
      } else {
        webview.showInactive()
      }
    }
  }
  
  getWebview() {
    const remote = require('sketch-module-web-view/remote')
    return remote.getWebview(this.WEBVIEW_ID)
  }
  
  hide() {
    const webview = this.getWebview();
    (webview && webview.hide())
  }
  
  resize(width:number, height:number) {
    const webview = this.getWebview();
    (webview && webview.setSize(width, height, false));
    this._storeResizeInfo(width, height)
  }
  
  close() {
    const webview = this.getWebview();
    (webview && webview.close())
  }
  
  _storeResizeInfo(width:number, height:number) {
    const webviewInfo = settings.sessionVariable(WEBVIEW_INFO) || {} as WebviewInfo
    settings.setSessionVariable(WEBVIEW_INFO, {
      ...webviewInfo,
      width,
      height
    });
  }
   
  _storeUrlInfo(url:string) {
    const webviewInfo = settings.sessionVariable(WEBVIEW_INFO) || {} as WebviewInfo
    settings.setSessionVariable(WEBVIEW_INFO, {
      ...webviewInfo,
      url
    });
  }
  
  _restoreSize() {
    const webviewInfo = settings.sessionVariable(WEBVIEW_INFO) || {} as WebviewInfo
    if (webviewInfo.width && webviewInfo.height) {
      this.resize(webviewInfo.width, webviewInfo.height)
    }
  }  
}