import React from "react";
import ReactDOM from "react-dom/client"; // Import createRoot
import WordGame from "./wordgame"; // Import our game component

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <WordGame />
  </React.StrictMode>
);
