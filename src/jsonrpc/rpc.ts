import BrowserWindow, { BrowserWindowOptions } from "sketch-module-web-view"

const RPCError = require("./errors")
const { MethodNotFound } = require("./errors")

declare global {
  interface Window {
    _prism(message:any):void
  }
}

declare class NSMutableArray {
  new():NSMutableArray
}

let sendRaw:Function = () => {}

let pending:any = typeof NSThread !== 'undefined' ? 
  NSThread.mainThread().threadDictionary() :
  {}; // 오류 방지용
let methods:any = {}

const RPC_THREAD_NAME = 'prism.rpc'

function sendJson(req:any) {
  try {
    sendRaw(req);
  } catch (err) {
    console.error(err);
  }
}

function sendResult(id:any, result:any) {
  sendJson({
    jsonrpc: "2.0",
    id,
    result
  });
}

function sendError(id:any, error:any) {
  const errorObject = {
    code: error.code,
    message: error.message,
    data: error.data
  };

  sendJson({
    jsonrpc: "2.0",
    id,
    error: errorObject
  });
}

function handleRaw(data:any) {
  try {
    if (!data) {
      return;
    }

    handleRpc(data);
  } catch (err) {
    console.error(err);
    console.error(data);
  }
}

function handleRpc(json:any) {
  if (typeof json.id !== "undefined") {
    if (
      typeof json.result !== "undefined" ||
      json.error ||
      typeof json.method === "undefined"
    ) {
      pending[json.id] = json;
    } else {
      handleRequest(json);
    }
  } else {
    handleNotification(json);
  }
}

function onRequest(method:any, params:any) {

  if (!(methods as any)[method]) {
    throw new MethodNotFound(method);
  }
  return (methods as any)[method](...params);
}

function handleNotification(json:any) {
  if (!json.method) {
    return;
  }
  onRequest(json.method, json.params);
}

function handleRequest(json:any) {
  if (!json.method) {
    sendError(json.id, new RPCError.InvalidRequest("Missing method"));
    return;
  }
  try {

    const result = onRequest(json.method, json.params);
    if (result && typeof result.then === "function") {
      result
        .then((res:any) => sendResult(json.id, res))
        .catch((err:any) => {
          sendError(json.id, err)
          
        });
    } else {
      sendResult(json.id, result);
    }
  } catch (err) {
    sendError(json.id, err);
  }
}

export function setup(_methods:any) {
  const handlerName = '_prism'
  if (typeof NSThread !== "undefined") {
    const { getWebview } = require('sketch-module-web-view/remote')
    let webview = getWebview('prism.webview')
    if (!webview) {
      const options:BrowserWindowOptions = {
        identifier: 'prism.webview',
        width: 240,
        height: 180,
        show: false,
        webPreferences: {
          devTools: true,
        }
      }
      webview = new BrowserWindow(options)
      webview.webContents.on(handlerName, (message:any) => {
        handleRaw(message)
      })
    }

    sendRaw = (message:any) => {
      message.id = message.id + ''
      const evalValue = 'window.'+handlerName+'(\'' + JSON.stringify(message) + '\')'
      webview.webContents.executeJavaScript(evalValue)
    }

  } else if (typeof window !== "undefined") {
    (window as any)[handlerName] = (message:any) => { 
      handleRaw(JSON.parse(message))
    }
    sendRaw = (message:any) => {
      window.postMessage(handlerName, message)
    }
  }

  Object.assign(methods, _methods);
}

const sendNotification = (method:any, params:any) => {
  sendJson({ jsonrpc: "2.0", method, params });
};

export function sendRequest(method:any, params:any, timeout:any) {
  return new Promise((resolve, reject) => {
    const id = 'req.' + (NSUUID as any).UUID().UUIDString();
    const req = { jsonrpc: "2.0", method, params, id };

    const fiber = require('sketch/async').createFiber();
    const callback = (err:any, result:any) => {
      if (err) {
        const jsError:any = new Error(err.message);
        jsError.code = err.code;
        jsError.data = err.data;
        reject(jsError);
        return;
      }
      resolve(result);
    };
    
    let receiver: any;
    let start = Date.now();
    receiver = () => {
      const result = pending[id];
      const isTimeout = (Date.now() - start) >= 1000;
      if (result) {
        // 결과 값이 있는 경우
        callback(result.error, result.result);
        fiber.cleanup();
      } else if (isTimeout) {
        // 너무 오래 걸리면 타임아웃 처리
        fiber.cleanup();
      } else {
        setTimeout(receiver, 5);
      }
    };
    setTimeout(receiver, 1);

    sendJson(req);
  });
};
