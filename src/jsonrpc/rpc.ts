import BrowserWindow, { BrowserWindowOptions } from "sketch-module-web-view"

const RPCError = require("./errors")
const { MethodNotFound } = require("./errors")

declare global {
  interface Window {
    _prism(message:any):void
  }
}

let sendRaw:Function = () => {}

let pending:any = typeof NSThread !== 'undefined' ? 
  NSThread.mainThread().threadDictionary() :
  {}; // 오류 방지용
let methods:any = {}

function sendJson(req:any, identifier:string) {
  try {
    sendRaw(req, identifier);
  } catch (err) {
    console.error(err);
  }
}

function sendResult(id:any, result:any, identifier:string) {
  sendJson({
    jsonrpc: "2.0",
    id,
    result
  },
  identifier);
}

function sendError(id:any, error:any, identifier:string) {
  const errorObject = {
    code: error.code,
    message: error.message,
    data: error.data
  };

  sendJson({
    jsonrpc: "2.0",
    id,
    error: errorObject
  },
  identifier);
}

function handleRaw(data:any, identifier:string) {
  try {
    if (!data) {
      return;
    }

    handleRpc(data, identifier);
  } catch (err) {
    console.error(err);
    console.error(data);
  }
}

function handleRpc(json:any, identifier:string) {
  if (typeof json.id !== "undefined") {
    if (
      typeof json.result !== "undefined" ||
      json.error ||
      typeof json.method === "undefined"
    ) {
      pending[json.id] = json;
    } else {
      handleRequest(json, identifier);
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

function handleRequest(json:any, identifier:string) {
  if (!json.method) {
    sendError(json.id, new RPCError.InvalidRequest("Missing method"), identifier);
    return;
  }
  try {

    const result = onRequest(json.method, json.params);
    if (result && typeof result.then === "function") {
      result
        .then((res:any) => sendResult(json.id, res, identifier))
        .catch((err:any) => {
          sendError(json.id, err, identifier)
          
        });
    } else {
      sendResult(json.id, result, identifier);
    }
  } catch (err) {
    sendError(json.id, err, identifier);
  }
}

export function setup(_methods:any, IDENTIFIER = 'prism.webview') {
  const handlerName = '_prism'// + IDENTIFIER.replace(/\./g, '_')
  if (typeof NSThread !== "undefined") {
    const { getWebview } = require('sketch-module-web-view/remote')
    let webview = getWebview(IDENTIFIER)
    if (!webview) {
      const options:BrowserWindowOptions = {
        identifier: IDENTIFIER,
        width: 240,
        height: 180,
        show: false,
        webPreferences: {
          devTools: true,
        }
      }
      webview = new BrowserWindow(options)
      webview.webContents.on(handlerName, (message:any) => {
        handleRaw(message, IDENTIFIER)
      })
    }

    sendRaw = (message:any, identifier:string) => {
      const _webview = getWebview(identifier)
      message.id = message.id + ''
      const evalValue = 'window.'+handlerName+'(\'' + JSON.stringify(message) + '\')'
      _webview.webContents.executeJavaScript(evalValue)
    }

  } else if (typeof window !== "undefined") {
    (window as any)[handlerName] = (message:any) => { 
      handleRaw(JSON.parse(message), IDENTIFIER)
    }
    sendRaw = (message:any) => {
      window.postMessage(handlerName, message)
    }
  }

  Object.assign(methods, _methods);
}

const sendNotification = (method:any, params:any, identifier:string) => {
  sendJson({ jsonrpc: "2.0", method, params }, identifier);
};

const isSketch = () => (typeof NSUUID !== 'undefined')

export function sendRequest(method:any, params:any, timeout:any, identifier:string, ) {
  console.log('sendRequest', method, params, timeout)
  return new Promise((resolve, reject) => {
    const id = 'req.' + (isSketch() ? (NSUUID as any).UUID().UUIDString() : Date.now());
    const req = { jsonrpc: "2.0", method, params, id };

    const fiber = isSketch() ? require('sketch/async').createFiber() : { cleanup: () => {} }
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
        delete pending[id];
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

    sendJson(req, identifier);
  });
};
