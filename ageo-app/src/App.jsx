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
      <div className="max-w-md mx-auto" style={{ minHeight: "100vh" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/voyageur" element={<GuestAuth />} />
          <Route path="/voyageur/app" element={<GuestApp />} />
        </Routes>
      </div>
      <Routes>
        <Route path="/hote" element={<HostAuth />} />
        <Route path="/hote/app" element={<HostDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
