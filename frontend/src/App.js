import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import Dashboard from "./components/Dashboard";
import Statistics from "./components/Statistics";

export default function App() {
  const isLoggedIn = localStorage.getItem("token");

  return (
    <Routes>
      <Route
        path="/"
        element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />}
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/stats"
        element={isLoggedIn ? <Statistics /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}
