import express from "express";
import { login, logout, phoneSend, phoneVerify, register, sendOTP, verifyOTP } from "../controllers/auth.controller.js";
import {check} from 'express-validator';

const router = express.Router();

router.post('/register',[
    check('email', 'Email must be in format')
                    .isEmail(),
    check('username', 'Name length should be 10 to 20 characters')
                    .isLength({ min: 3, max: 20 }),
    check('contact','Invalid phone number format')
                    .matches(/^[6789]\d{9}$$/).isLength({ min: 10, max: 10 }),
    check('password', 'Password length should be 8 to 10 characters')
                    .isLength({ min: 3, max: 10 })
],register);

router.post('/login',[
    // check('email', 'Email length should be 10 to 30 characters')
    //                 .isEmail(),
    check('username', 'Name length should be 3 to 20 characters')
                    .isLength({ min: 3, max: 20 }),
    check('password', 'Password length should be 3 to 10 characters')
                    .isLength({ min: 3, max: 10 })
],login);

router.post('/logout',[check('email', 'Email must be in format').isEmail()],logout);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/phone-send', phoneSend);
router.post('/phone-verify', phoneVerify);

export default router;