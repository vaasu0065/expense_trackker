import { useState } from "react";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

export default function AddExpense({ onAdded }) {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "",
    date: ""
  });
  const { toast, showToast, hideToast } = useToast();

  const save = async (e) => {
    e.preventDefault();

    if (!form.title || !form.amount || !form.category || !form.date) {
      showToast("All fields are required", "warning");
      return;
    }

    const today = new Date();
    const selected = new Date(form.date);

    today.setHours(0,0,0,0);
    selected.setHours(0,0,0,0);

    // ❌ Prevent Future Date
    if(selected > today){
      showToast("Future date is not allowed", "error");
      return;
    }

    try {
      const res = await api.post("/expenses/add", form);

      showToast("Expense added successfully! ✅", "success");

      // ⚠️ Budget Exceeded Alert (if backend sends)
      if(res.data.exceeded){
        setTimeout(() => {
          showToast(
            `Budget Exceeded! Budget: ₹${res.data.budget}, Spent: ₹${res.data.spent}`,
            "warning",
            5000
          );
        }, 1000);
      }

      // Reset fields
      setForm({
        title: "",
        amount: "",
        category: "",
        date: ""
      });

      // Call parent callback to refresh data
      if (onAdded) {
        onAdded();
      }

    } catch(err){
      console.log(err);
      const errorMsg = err.response?.data?.msg || "Something went wrong";
      showToast(errorMsg, "error");
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
      
      <div className="card">
        <h3 className="">Add Expense</h3>

        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <input
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />

        <input
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />

        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />

        <button
          onClick={save}
          className="
            bg-gradient-to-r from-green-500 to-emerald-600
            hover:from-green-600 hover:to-emerald-700
            text-white font-semibold
            px-6 py-2
            rounded-xl
            shadow-md hover:shadow-lg
            transition-all duration-200
          "
        >
          Add Expense
        </button>

      </div>
    </>
  );
}
