import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import InputPage from './components/InputPage';
import TeleprompterPage from './components/TeleprompterPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<InputPage />} />
          <Route path="/prompter" element={<TeleprompterPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;