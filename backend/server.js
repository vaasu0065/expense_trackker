require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// TEST
app.get("/test",(req,res)=>{
  res.send("Backend Running OK");
});

// ROUTES
app.use("/auth", require("./routes/authRoutes"));
app.use("/otp", require("./routes/otpRoutes"));
app.use("/expenses", require("./routes/expenseRoutes"));
app.use("/budget", require("./routes/budgetRoutes"));

app.listen(process.env.PORT || 4000, () =>
  console.log("Server running on", process.env.PORT)
);
