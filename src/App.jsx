import { useState } from 'react';
import './App.css';
import ScrollBackgroundVideo from './ScrollBackgroundVideo';
import GridCanvasDisplay from './grid';

function App() {
  const [count, setCount] = useState(0);

  return (
    //<div>
    //  <ScrollBackgroundVideo 
    //    frameCount={650}              // Total number of frames
    //    frameBaseName=""       // Base name for frames
    //    frameExtension=".webp"        // Image format
    //    frameDigits={4}              // Number of digits (0001, 0002, etc.)
    //    heightPerFrame={5}          // Scroll height per frame
    //    imagePath="/halfres2/"         // Folder containing frames
    //  />
    //</div>
    
    <div className='App'>
      <h1>test commit</h1>
      <GridCanvasDisplay />
    </div>
    
    

  );
}

export default App;

