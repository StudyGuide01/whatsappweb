import { create } from "zustand";
import { persist } from "zustand/middleware";

const useLoginStore = create(
  persist(
    (set) => ({
      // State
      step: 1,
      userPhoneData: null,

      // Actions
      setStep: (step) => set({ step }),
      setUserPhoneData: (data) => set({ userPhoneData: data }),
      resetLoginState: () => set({ step: 1, userPhoneData: null }),
    }),
    {
      name: "login-storage", // unique name for localStorage
      partialize: (state) => ({
        step: state.step,
        userPhoneData: state.userPhoneData,
      }),
    },
  ),
);

export default useLoginStore;
