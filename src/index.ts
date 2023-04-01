import * as rpc from "rpc"
import * as renderRpc from 'render-rpc'
import dom from 'sketch/dom'
import UI from './jsonrpc/ui'
 

export function onOpenDocument() {

    const rpcUI = new UI(rpc.WEBVIEW_NAME)    
    rpcUI.showUI(require('../browser/webview.html'), true)
    rpcUI.resize(200, 200)

    const renderUI = new UI(renderRpc.WEBVIEW_NAME)
    renderUI.showUI(require('../render/webview.html'), true)
    renderUI.resize(300, 300)
}

export const onSelectionChanged = async () => {
    const selectedLayer = dom.getSelectedDocument()?.selectedLayers?.layers[0]
    if (!selectedLayer) return

    const rpcResult = await rpc.uiApi.updateCurrentLayerId(selectedLayer.id)
    console.log('rpc onSelectionChanged: ' + rpcResult)    

    const renderResult = await renderRpc.uiApi.updateCurrentLayerId(selectedLayer.id)
    console.log('render onSelectionChanged: ' + renderResult)
}


