import React, { useEffect, useState } from 'react';
import { $currentLayerId, api } from 'render-rpc' 

function getRandomHexColor() {
  const randomInt = Math.floor(Math.random() * 16777216);
  const hexString = randomInt.toString(16);
  const paddedHexString = hexString.padStart(6, '0');
  const hexColor = `#${paddedHexString}`;
  return hexColor;
}

export default function App() {
  const [layerId, setLayerId] = useState<string>('');

  // call the plugin from the webview
  const onClick = async () => {
    const result = await api.changeLayerColor(getRandomHexColor(), layerId)
    console.log(result)
  }

  useEffect(() => {
    $currentLayerId.subscribe((id:any) => {
      console.log('currentLayerId', id)
      setLayerId(id)
    });
  }, []);

  return (
    <>
      Render  {layerId}
      <div>
        <button id="button" onClick={onClick}>Get a random number</button>
      </div>
    </>
  )
}