import React, { useEffect, useState } from 'react';
import { $renderCurrentLayerId, api } from 'render-rpc' 

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
    const result = await api.renderChangeLayerColor(getRandomHexColor(), layerId)
    console.log(result)
  }

  useEffect(() => {
    $renderCurrentLayerId.subscribe((id:any) => {
      console.log('renderCurrentLayerId', id)
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