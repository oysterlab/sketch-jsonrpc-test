import * as rpc from "rpc"
import dom from 'sketch/dom'
import UI from './jsonrpc/ui'
 

export function onOpenDocument() {

    const rpcUI = new UI(rpc.WEBVIEW_NAME)    
    rpcUI.showUI(require('../browser/webview.html'), true)
    rpcUI.resize(200, 200)
}

export const onSelectionChanged = async () => {
    const selectedLayer = dom.getSelectedDocument()?.selectedLayers?.layers[0]
    if (!selectedLayer) return

    const result = await rpc.uiApi.updateCurrentLayerId(selectedLayer.id)
    console.log('onSelectionChanged: ' + result)    
}


