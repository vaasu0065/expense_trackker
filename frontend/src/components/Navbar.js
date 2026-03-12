import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function Navbar(){

  const [user,setUser] = useState(null);

  const loadUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const logout = ()=>{
    localStorage.removeItem("token");
    window.location = "/login";
  };

  return (
    <nav className="p-4 bg-black text-white flex justify-between items-center shadow">
      <h2 className="font-bold text-xl">Expense Tracker</h2>

      <div className="flex gap-6 items-center">

        <Link to="/" className="hover:text-green-400">Home</Link>
        <Link to="/stats" className="hover:text-green-400">Statistics</Link>

        {user && <span className="text-gray-300">👤 {user.name}</span>}

        <button onClick={logout}
          className="bg-red-500 px-4 py-1 rounded hover:bg-red-600">
          Logout
        </button>
      </div>
    </nav>
  );
}
