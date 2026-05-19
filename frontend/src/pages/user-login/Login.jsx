import useLoginStore from "@/store/useLoginStore";
import countries from "@/utils/countrilies";
import React, { useState } from "react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

//schema to check validation of state using yup
const loginValidationSchema = yup
  .object()
  .shape({
    phoneNumber: yup
      .string()
      .nullable()
      .notRequired()
      .matches(/^\d+$/, "phone number must be digit")
      .transform((value, originalValue) => {
        originalValue.trim() === "" ? null : value;
      }),
    email: yup
      .string()
      .nullable()
      .notRequired()
      .email("pelase enter valid email")
      .transform((value, originalValue) => {
        originalValue.trim() === "" ? null : value;
      }),
  })
  .test(
    "at-least-one",
    "Either email or phoneNumber is required",
    function (value) {
      return !!(value.phoneNumber || value.email);
    },
  );

//  otp validation function with yup
const otpValidationSchema = yup.object().shape({
  opt:yup.string().length(6,'Otp must be excatly 6 digit').required("Otp is required")
});

const profileValidationSchema = yup.object().shape({
  userName: yup.string().required('username is required'),
  agreed:yup.bool().oneOf([true],'You must agree to the terms')
})

const login = () => {
  const { step, userPhoneData, setStep, setUserPhoneData, resetLoginState } =
    useLoginStore();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [opt, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");

  return <div>Login</div>;
};

export default login;
