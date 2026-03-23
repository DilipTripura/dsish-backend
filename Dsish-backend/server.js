// server.js
import express from "express";
import cors from "cors";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import bodyParser from "body-parser";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.rzp_live_SUblwNzrqUGhxn,
  key_secret: process.env.TFdgS49sT2HlAkKPCbLJFcFr
});

// Test API
app.get("/", (req, res) => {
  res.send("Dsish Backend Running ✅");
});

// Create Razorpay order
app.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    if (!amount || !receipt) {
      return res.status(400).json({ error: "Amount and receipt are required" });
    }

    const options = {
      amount: amount * 100, // convert to paise
      currency,
      receipt,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    res.json(order);

  } catch (err) {
    console.error("Razorpay Error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Port setup (works on local + cloud deployment)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Dsish backend running on port ${PORT}`);
});