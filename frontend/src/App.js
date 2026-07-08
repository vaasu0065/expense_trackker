import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import Dashboard from "./components/Dashboard";
import Statistics from "./components/Statistics";
import LendBorrow from "./components/LendBorrow";
import ImportTransactions from "./components/ImportTransactions";
import BankConnect from "./components/BankConnect";

export default function App() {
  const isLoggedIn = localStorage.getItem("token");

  return (
    <Routes>
      <Route path="/" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/stats" element={isLoggedIn ? <Statistics /> : <Navigate to="/login" />} />
      <Route path="/lendborrow" element={isLoggedIn ? <LendBorrow /> : <Navigate to="/login" />} />
      <Route path="/import" element={isLoggedIn ? <ImportTransactions /> : <Navigate to="/login" />} />
      <Route path="/bank" element={isLoggedIn ? <BankConnect /> : <Navigate to="/login" />} />
    </Routes>
  );
}
