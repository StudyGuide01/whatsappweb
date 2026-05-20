import useLoginStore from "@/store/useLoginStore";
import countries from "@/utils/countrilies";
import React, { useState } from "react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import useUserStore from "@/store/useUserStore";
import { useForm } from "react-hook-form";
import useThemeStore from "@/store/themeStore";
import { motion } from "framer-motion";
// import axiosInstance from "@/services/axiosInstance"; // Aapka custom axios instance jahan se export hua hai use check kar lena path sahi hai ya nahi
import axiosInstance from "@/services/url.service";
import axios from "axios";
const avatars = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Jack",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Luna",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver",
];

// schema to check validation of state using yup
const loginValidationSchema = yup
  .object()
  .shape({
    phoneNumber: yup
      .string()
      .nullable()
      .notRequired()
      .transform((value, originalValue) => {
        return originalValue && originalValue.trim() === "" ? null : value;
      })
      .test("is-digit", "Phone number must be digits only", (value) => {
        if (!value) return true;
        return /^\d+$/.test(value);
      }),
    email: yup
      .string()
      .nullable()
      .notRequired()
      .transform((value, originalValue) => {
        return originalValue && originalValue.trim() === "" ? null : value;
      })
      .email("Please enter a valid email"),
  })
  .test(
    "at-least-one",
    "Either email or phoneNumber is required",
    function (value) {
      return !!(value.phoneNumber || value.email);
    }
  );

// otp validation function with yup
const otpValidationSchema = yup.object().shape({
  otp: yup
    .string()
    .length(6, "Otp must be exactly 6 digits")
    .required("Otp is required"),
});

const profileValidationSchema = yup.object().shape({
  userName: yup.string().required("username is required"),
  agreed: yup.bool().oneOf([true], "You must agree to the terms"),
});

const login = () => {
  const { step, userPhoneData, setStep, setUserPhoneData, resetLoginState } =
    useLoginStore();
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [otpInputs, setOtpInputs] = useState(["", "", "", "", "", ""]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const { theme, setTheme } = useThemeStore();

  // register for credentials (Step 1)
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    watch: loginWatch,
  } = useForm({
    resolver: yupResolver(loginValidationSchema),
    defaultValues: {
      phoneNumber: "",
      email: "",
    },
  });

  // register for otp (Step 2)
  const {
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue: setOtpValue,
  } = useForm({
    resolver: yupResolver(otpValidationSchema),
  });

  // register for profile (Step 3)
  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    watch: profileWatch,
  } = useForm({
    resolver: yupResolver(profileValidationSchema),
  });

  // --- Step 1: Send OTP handler ---
  const onLoginSubmit = async (data) => {
    setError("");
    setLoading(false);

    try {
      setLoading(true);
      // Agar phone number input kiya hai to country code ke sath full format pass karenge
      const payload = {
        // email: data.email || null,
        phoneNumber: data.phoneNumber ? `${selectedCountry.dial_code}${data.phoneNumber}` : null,
      };

      // API Hit: Axios Instance path automatically maps to -> http://localhost:8000/api/auth/send-otp
      const response = await axios.post("http://localhost:8000/api/auth/send-otp", payload);

      if (response.status === 200 || response.data?.success) {
        // Store user state data in zustand store
        setUserPhoneData(payload);
        // Step set to 2 to shift layout to OTP input window
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Step 2: Verify OTP handler (Placeholder for your logic next) ---
  const onOtpSubmit = async (data) => {
    setError("");
    console.log("Verifying OTP:", data.otp);
    // Yahan aap agle step me login verify ki api hit kar sakte hain
  };

  // Handle manual 6 boxes input tracking for design & auto focus
  const handleOtpInputChange = (value, index) => {
    const newOtp = [...otpInputs];
    newOtp[index] = value.slice(-1); // Sirf last digit store karenge
    setOtpInputs(newOtp);

    // Combine string to push inside hook-form state trigger
    const fullOtpString = newOtp.join("");
    setOtpValue("otp", fullOtpString, { shouldValidate: true });

    // Auto Focus forward
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    // Backspace event handler to auto shift focus backward
    if (e.key === "Backspace" && !otpInputs[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <>
      <div
        className={`min-h-screen flex items-center justify-center p-4 ${
          theme === "dark"
            ? "bg-gray-900 bg-none"
            : "bg-gradient-to-br from-green-400 to-blue-500"
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`w-full max-w-md rounded-2xl p-8 shadow-2xl text-center flex flex-col items-center ${
            theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-800"
          }`}
        >
          {/* WhatsApp Logo Icon */}
          <div className="bg-emerald-500 p-3 rounded-full text-white mb-3 shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.618-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
            </svg>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold mb-4 tracking-wide">
            WhatsApp Login
          </h2>

          {/* Progress Bar Line */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mb-4 overflow-hidden">
            <div
              className={`bg-emerald-500 h-full transition-all duration-300 ${
                step === 2 ? "w-2/3" : "w-1/3"
              }`}
            ></div>
          </div>

          {/* Dynamic Error Alert Banner */}
          {error && (
            <div className="text-red-500 text-sm font-medium mb-4 bg-red-50 dark:bg-red-900/20 py-1.5 px-4 rounded-md w-full">
              {error}
            </div>
          )}

          {/* Form Handle Validation Errors Alerts */}
          {(loginErrors.phoneNumber || loginErrors.email || loginErrors.root?.message) && (
            <div className="text-orange-500 text-xs font-medium mb-3">
              {loginErrors.phoneNumber?.message || loginErrors.email?.message || loginErrors.root?.message}
            </div>
          )}

          {/* ================= STEP 1: LOGIN FIELD SCREEN ================= */}
          {step === 1 && (
            <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="w-full space-y-4">
              {/* Phone Input Group */}
              <div className="flex space-x-2 w-full">
                {/* Country Code Dropdown */}
                <select
                  className={`border rounded-lg px-2 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 w-24 text-center ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-gray-50 border-gray-300 text-gray-700"
                  }`}
                  value={selectedCountry?.dial_code || "+91"}
                  onChange={(e) => {
                    const found = countries.find((c) => c.dial_code === e.target.value);
                    if (found) setSelectedCountry(found);
                  }}
                >
                  {countries.map((cCode, index) => (
                    <option
                      key={index}
                      value={cCode.dial_code}
                      className={theme === "dark" ? "bg-gray-700 text-white" : "bg-white text-gray-700"}
                    >
                      {cCode.dial_code} ({cCode.code})
                    </option>
                  ))}
                </select>

                {/* Phone Number Input */}
                <input
                  type="text"
                  placeholder="Enter your phone number to receive an OTP"
                  {...loginRegister("phoneNumber")}
                  className={`flex-1 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-gray-50 border-gray-300 text-gray-600 placeholder-gray-400"
                  }`}
                />
              </div>

              {/* "or" Divider */}
              <div className="flex items-center my-3">
                <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                <span className="px-3 text-xs text-gray-400 font-medium uppercase">or</span>
                <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
              </div>

              {/* Email Input */}
              <div className="w-full">
                <input
                  type="email"
                  placeholder="Email (optional)"
                  {...loginRegister("email")}
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-gray-50 border-gray-300 text-gray-600 placeholder-gray-400"
                  }`}
                />
              </div>

              {/* Send OTP Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition duration-200 text-sm mt-2 flex justify-center items-center ${
                  loading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          )}

          {/* ================= STEP 2: OTP VERIFICATION WINDOW SCREEN ================= */}
          {step === 2 && (
            <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="w-full space-y-5">
              {/* Description Info text */}
              <p className="text-gray-500 dark:text-gray-400 text-xs px-4 leading-relaxed">
                Please enter the 6-digit OTP send to your{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {userPhoneData?.phoneNumber || userPhoneData?.email}
                </span>
              </p>

              {/* 6 Digit Box Inputs Layout Design */}
              <div className="flex justify-center gap-2 my-2">
                {otpInputs.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInputChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className={`w-12 h-12 text-center text-xl font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-gray-50 border-gray-300 text-gray-800"
                    }`}
                  />
                ))}
              </div>

              {otpErrors.otp && (
                <div className="text-red-500 text-xs font-medium">{otpErrors.otp.message}</div>
              )}

              {/* Verify OTP Call to Action Button */}
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition duration-200 text-sm"
              >
                Verify OTP
              </button>

              {/* Wrong Number Go Back Secondary Trigger Option */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full flex items-center justify-center gap-1 text-xs font-semibold py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/>
                </svg>
                Wrong number? Go back
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default login;