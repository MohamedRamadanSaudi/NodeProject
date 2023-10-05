const asyncWrapper = require("../middlewares/asyncWrapper");
const User = require("../models/user.model");
const httpStatusText = require("../utils/httpStatusText");
const AppError = require("../utils/appError");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const generateJWT = require("../utils/generateJWT");

const getAllUsers = asyncWrapper(async (req, res) => {
  const query = req.query;

  const limit = query.limit || 10;
  const page = query.page || 1;
  const skip = (page - 1) * limit;

  // get all courses from DB using Course model
  const users = await User.find({}, { __v: false, password: false })
    .limit(limit)
    .skip(skip);
  const length = await User.countDocuments();
  res.json({ status: httpStatusText.SUCCESS, length, data: { users } });
});

const register = asyncWrapper(async (req, res, next) => {
  console.log(req.body);
  const { firstName, lastName, email, password, role } = req.body;

  const oldUser = await User.findOne({ email });
  if (oldUser) {
    const error = AppError.create(
      "user already exists",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  // password hashing
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role,
    avatar: req.file.filename,
  });

  //generate JWT token
  const token = await generateJWT({
    email: newUser.email,
    id: newUser._id,
    role: newUser.role,
  });
  newUser.token = token;

  await newUser.save();

  res
    .status(201)
    .json({ status: httpStatusText.SUCCESS, data: { user: newUser } });
});

const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    const error = AppError.create(
      "email and password are required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const user = await User.findOne({ email });

  if (!user) {
    const error = AppError.create("user not found", 404, httpStatusText.FAIL);
    return next(error);
  }

  const matchedPassword = await bcrypt.compare(password, user.password);

  if (user && matchedPassword) {
    const token = await generateJWT({
      email: user.email,
      id: user._id,
      role: user.role,
    });

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: {
        token,
      },
    });
  } else {
    const error = AppError.create("something wrong", 500, httpStatusText.FAIL);
    return next(error);
  }
});

module.exports = {
  getAllUsers,
  register,
  login,
};