/// <reference types="sketch-app-types" />

import { sendRequest, setup } from './rpc';
import UI from './ui'
export { UI }

export function createUIAPI<T extends { [method: string]: (...args: any[]) => any | Promise<any> }>(
  methods: T,
  name: string,  
  options?: { 
    timeout?: number 
  }
  ): Readonly<{
    [K in keyof T]: (
      ...args: Parameters<T[K]>
    ) => ReturnType<T[K]> extends Promise<infer U>
      ? ReturnType<T[K]>
      : Promise<ReturnType<T[K]>>;
  }> {
  const timeout = options && options.timeout;
  if (typeof window !== "undefined") {
    setup(methods, name)
  }

  return Object.keys(methods).reduce((prev, p) => {
    (prev as any)[p] = (...params:any) => {
      if (typeof window !== "undefined") {
        return Promise.resolve().then(() => methods[p](...params));
      }

      return sendRequest(p, params, timeout, name)
    }
    return prev
  }, {}) as Readonly<{
    [K in keyof T]: (
      ...args: Parameters<T[K]>
    ) => ReturnType<T[K]> extends Promise<infer U>
      ? ReturnType<T[K]>
      : Promise<ReturnType<T[K]>>;
  }>
}

export function createPluginAPI<
T extends { [method: string]: (...args: any[]) => any | Promise<any> }
>(
methods: T,
name: string,
options?: { 
  timeout?: number 
}
): Readonly<{
  [K in keyof T]: (
    ...args: Parameters<T[K]>
  ) => ReturnType<T[K]> extends Promise<infer U>
    ? ReturnType<T[K]>
    : Promise<ReturnType<T[K]>>;
}> {
  const timeout = options && options.timeout;

  if (typeof NSThread !== "undefined") {
    setup(methods, name)
  }

  return Object.keys(methods).reduce((prev, p) => {
    (prev as any)[p] = (...params:any) => {
      if (typeof NSThread !== "undefined") {
        const methodName = name + '.' + p
        return Promise.resolve().then(() => methods[methodName](...params));
      }
      return sendRequest(p, params, timeout, name);
    };
    return prev;
  }, {}) as Readonly<{
    [K in keyof T]: (
      ...args: Parameters<T[K]>
    ) => ReturnType<T[K]> extends Promise<infer U>
      ? ReturnType<T[K]>
      : Promise<ReturnType<T[K]>>;
  }>;
};