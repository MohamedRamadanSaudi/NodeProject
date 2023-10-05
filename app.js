require("dotenv").config();
const express = require("express");
const path = require("node:path");

const cors = require("cors");

const app = express();

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const mongoose = require("mongoose");

const httpStatusText = require("./utils/httpStatusText");

const url = process.env.MONGO_URL;

mongoose.connect(url).then(() => {
  console.log("mongodb server started...");
});

app.use(cors());
app.use(express.json());

const coursesRouter = require("./routes/courses_route");
const usersRouter = require("./routes/users_route");

app.use("/api/courses", coursesRouter);
app.use("/api/users", usersRouter);

// global middleware for not found router
app.all("*", (req, res, next) => {
  return res.status(404).json({
    status: httpStatusText.ERROR,
    message: "Route not found",
  });
});

// global error handler
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: err.statusText || httpStatusText.ERROR,
    message: err.message,
    code: err.statusCode || 500,
    data: null,
  });
});

app.listen(process.env.POET || 4000, () => {
  console.log("listening on port 4000...");
});
