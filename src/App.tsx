import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import AuthGate from './auth/AuthGate';
import TopBar from './components/TopBar';
import SubjectsPage from './pages/SubjectsPage';
import UnitsPage from './pages/UnitsPage';
import PYQMcqPapersPage from './pages/PYQMcqPapersScreen';
import ChaptersPage from './pages/ChaptersPage';
import MockTestPapers from './pages/MockTestPage';
import NewsPage from './pages/NewsPage';           // <-- add
import PYQExamPapersPDF from './pages/PYQExamPapers';
import PYQMCQ from './pages/PYQMCQ';
import Banners from './pages/BannersPages';

export default function App() {
  return (
    <AuthGate>
      <TopBar />
      <Routes>
        <Route path="/banners" element={<Banners />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/units" element={<UnitsPage />} />
        <Route path="/pyq_mcq" element={<PYQMCQ />} />
        <Route path="pyqmcqpapers" element={<PYQMcqPapersPage />} />
        <Route path="/pyqexampaperspdf" element={<PYQExamPapersPDF />} />
        <Route path="/mocktestpapers" element={<MockTestPapers />} />
        <Route path="/chapters" element={<ChaptersPage />} />
        <Route path="/news" element={<NewsPage />} />  {/* <-- add */}
        <Route path="*" element={<Navigate to="/subjects" />} />
      </Routes>
    </AuthGate>
  );
}


// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.tsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App
