// ================= IMPORTS =================
import express from "express";
import cors from "cors";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// ================= APP INIT =================
const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json()); // better than bodyParser

// ================= RAZORPAY =================
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("Dsish Backend Running ✅");
});


// ================= CREATE ORDER =================
app.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", orderId } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({
        success: false,
        error: "Amount and orderId required"
      });
    }

    const options = {
      amount: amount * 100, // ₹ → paise
      currency,
      receipt: orderId,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      id: order.id,
      amount: order.amount
    });

  } catch (err) {
    console.error("Create Order Error:", err);

    res.status(500).json({
      success: false,
      error: "Order creation failed"
    });
  }
});


// ================= VERIFY PAYMENT =================
app.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Missing payment details"
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      return res.json({ success: true });
    } else {
      return res.status(400).json({ success: false });
    }

  } catch (err) {
    console.error("Verification Error:", err);

    res.status(500).json({
      success: false,
      error: "Verification failed"
    });
  }
});


// ================= START SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(` Dsish backend running on port ${PORT}`);
});