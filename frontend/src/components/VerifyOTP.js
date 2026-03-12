import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import Toast from "./Toast";
import useToast from "../hooks/useToast";

export default function VerifyOTP() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const { toast, showToast, hideToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate("/register");
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split("");
    while (newOtp.length < 6) newOtp.push("");
    setOtp(newOtp);

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    document.getElementById(`otp-${lastIndex}`).focus();
  };

  const verifyOTP = async () => {
    const otpCode = otp.join("");
    
    if (otpCode.length !== 6) {
      showToast("Please enter complete OTP", "warning");
      return;
    }

    console.log("🔍 Verifying OTP:", otpCode, "for email:", email);

    setLoading(true);
    try {
      const response = await api.post("/otp/verify", { email, otp: otpCode });
      console.log("✅ Verification response:", response.data);
      
      showToast("Email verified successfully! 🎉", "success");
      
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error("❌ Verification error:", err);
      console.error("Error response:", err.response?.data);
      
      const errorMsg = err.response?.data?.msg || "Invalid OTP";
      showToast(errorMsg, "error");
      
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-0").focus();
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setResending(true);
    try {
      await api.post("/otp/resend", { email });
      showToast("New OTP sent to your email! 📧", "success");
      setTimer(600); // Reset timer
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-0").focus();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.msg || "Failed to resend OTP", "error");
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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

      <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Verification Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800">Verify Your Email</h2>
              <p className="text-gray-500 mt-2">
                We've sent a 6-digit code to
              </p>
              <p className="text-gray-700 font-semibold">{email}</p>
            </div>

            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Enter Verification Code
              </label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="text-center">
              {timer > 0 ? (
                <p className="text-sm text-gray-600">
                  Code expires in{" "}
                  <span className="font-bold text-green-600">
                    {formatTime(timer)}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-red-600 font-semibold">
                  Code has expired
                </p>
              )}
            </div>

            {/* Verify Button */}
            <button
              onClick={verifyOTP}
              disabled={loading || timer === 0}
              className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Didn't receive the code?
              </p>
              <button
                onClick={resendOTP}
                disabled={resending || timer > 540} // Can resend after 1 minute
                className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? "Sending..." : "Resend Code"}
              </button>
              {timer > 540 && (
                <p className="text-xs text-gray-500 mt-1">
                  Available in {formatTime(timer - 540)}
                </p>
              )}
            </div>

            {/* Back to Register */}
            <div className="text-center pt-4 border-t">
              <button
                onClick={() => navigate("/register")}
                className="text-gray-600 hover:text-gray-700 text-sm hover:underline transition-colors"
              >
                ← Back to Registration
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Check your spam folder if you don't see the email
          </p>
        </div>
      </div>
    </>
  );
}
