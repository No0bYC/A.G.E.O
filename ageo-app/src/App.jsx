import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import GuestAuth from "./pages/GuestAuth.jsx";
import GuestApp from "./pages/GuestApp.jsx";
import HostAuth from "./pages/HostAuth.jsx";
import HostDashboard from "./pages/HostDashboard.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="max-w-md mx-auto" style={{ minHeight: "100vh" }}><Home /></div>} />
        <Route path="/voyageur" element={<div className="max-w-md mx-auto" style={{ minHeight: "100vh" }}><GuestAuth /></div>} />
        <Route path="/voyageur/app" element={<div className="max-w-md mx-auto" style={{ minHeight: "100vh" }}><GuestApp /></div>} />
        <Route path="/hote" element={<HostAuth />} />
        <Route path="/hote/app" element={<HostDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
