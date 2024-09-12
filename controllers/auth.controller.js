import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { validationResult } from "express-validator";
import axios from "axios";
import sendEmail from "../lib/email.js";
import crypto from "crypto";
import twilio from 'twilio';
import { CLIENT_RENEG_LIMIT } from "tls";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

let otpStore = {};

export const register = async (req, res) => {
  const { username, email, password, contact, recaptchaValue } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    
    return res.status(500).json({ message: "Inputs must be in Format" });
  }

  const SEC_KEY = "6LfjZTEqAAAAANxriwnfKaPlkv-moF7iiul3mlts";

  try {
    const { data } = await axios({
      url: `https://www.google.com/recaptcha/api/siteverify?secret=${SEC_KEY}&response=${recaptchaValue}`,
      method: "POST",
    });
    
    if (!data.success) {
      return res.status(400).json({ message: "Captcha not Verified!" });
    }

    const otp = crypto.randomInt(100000, 999999); // Generate a 6-digit OTP
    otpStore[email] = otp;
    

    // HASH THE PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // CREATE A NEW USER AND SAVE TO DB
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        contact,
      },
    });

    // console.log(newUser);

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Username or Email already Exists!" });
  }
};

export const login = async (req, res) => {
  const { username, password, recaptchaValue } = req.body;
  const SEC_KEY = "6LfjZTEqAAAAANxriwnfKaPlkv-moF7iiul3mlts";
  try {
    const { data } = await axios({
      url: `https://www.google.com/recaptcha/api/siteverify?secret=${SEC_KEY}&response=${recaptchaValue}`,
      method: "POST",
    });
    if (!data.success) {
      return res.status(400).json({ message: "Captcha not Verified!" });
    }

    // CHECK IF THE USER EXISTS
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) return res.status(400).json({ message: "Invalid Credentials!" });

    // CHECK IF THE PASSWORD IS CORRECT

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid)
      return res.status(400).json({ message: "Invalid Credentials!" });

    // user.otp = numb;

    const age = 1000 * 60 * 60 * 24 * 7;

    const token = jwt.sign(
      {
        id: user.id,
        isAdmin: false,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: age }
    );

    const { password: userPassword, ...userInfo } = user;

    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: age,
      })
      .status(200)
      .json(userInfo);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to login!" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token").status(200).json({ message: "Logout Successful" });
};

export const sendOTP = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(500).json({ message: "Email must be in Format" });
  }
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) return res.status(400).json({ message: "Email Not Exists!" });

  const otp = crypto.randomInt(100000, 999999); // Generate a 6-digit OTP
  // console.log(otp);
  otpStore[email] = otp; // Store OTP temporarily

  try {
    await sendEmail(email, "Your OTP Code", `Your OTP is ${otp}`);
    res.status(200).json({message: "OTP sent Successfully", result: true});
  } catch (error) {
    console.log(error)
    res.status(500).json({error: "Failed to sent OTP", result: false});
  }
};

export const verifyOTP = (req, res) => {
  const { email, otp } = req.body;
  if (otpStore[email] === parseInt(otp)) {
    delete otpStore[email]; // Clear OTP after successful verification
    res.status(200).json({message: "OTP verified Successfully", result: true});
  } else {
    res.status(400).json({message: "Invalid OTP", result: false});
  }
};

// Twilio verification
export const phoneSend =  async (req, res) => {
  const { contact } = req.body;
  
  try {
    const verification = await client.verify.v2.services(process.env.TWILIO_SERVICE_SID)
      .verifications
      .create({ to: `+91${contact}`, channel: 'sms' });

    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ success: false, message: "OTP Cannot Send" });
  }
};

// Endpoint to verify OTP
export const phoneVerify = async (req, res) => {
  const { contact, otp } = req.body;

  try {
    const verificationCheck = await client.verify.v2.services(process.env.TWILIO_SERVICE_SID)
      .verificationChecks
      .create({ to: `+91${contact}`, code: otp });

    if (verificationCheck.status === 'approved') {
      res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Error in Verifying" });
  }
};
