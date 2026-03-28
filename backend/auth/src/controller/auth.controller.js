import userModel from "../model/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import config from "../config/config.js";
import { publishToQueue } from "../broker/rabbit.js";

const ROLE_REDIRECTS = {
  student: "/student/dashboard",
  staff: "/staff/dashboard",
  admin: "/admin/dashboard",
};

// register functionality

export async function register(req, res) {
  const {
    email,
    password,
    fullname: { firstName, lastName },
    role = "student",
  } = req.body;

  if (!Object.prototype.hasOwnProperty.call(ROLE_REDIRECTS, role)) {
    return res.status(400).json({
      message: "Invalid role. Allowed roles: student, staff, admin",
    });
  }

  const isUserAlreadyExist = await userModel.findOne({ email });

  if (isUserAlreadyExist) {
    return res.status(400).json({
      message: "User Already Exists",
    });
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const user = await userModel.create({
    email,
    password: hashPassword,
    fullname: {
      firstName,
      lastName,
    },
    role,
  });

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      fullname: user.fullname,
    },
    config.JWT_SECRET,
    { expiresIn: "7d" },
  );

  await publishToQueue("user_created", {
    id: user._id,
    email: user.email,
    fullname: user.fullname,
    role: user.role,
  });

  res.cookie("token", token);

  res.status(201).json({
    message: "Registration Successfully",
    user: {
      id: user._id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
    },
    redirectTo: ROLE_REDIRECTS[user.role],
  });
}

export async function googleAuthCallback(req, res) {
  const user = req.user;

  const isUserAlreadyExist = await userModel.findOne({
    $or: [{ email: user.emails[0].value }, { googleId: user.id }],
  });

  if (isUserAlreadyExist) {
    const token = jwt.sign(
      {
        id: isUserAlreadyExist._id,
        role: isUserAlreadyExist.role,
        fullname: isUserAlreadyExist.fullname,
      },
      config.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.cookie("token", token);

    return res.status(200).json({
      message: "Login Successfully",
      user: {
        id: isUserAlreadyExist._id,
        email: isUserAlreadyExist.email,
        fullname: isUserAlreadyExist.fullname,
        role: isUserAlreadyExist.role,
      },
      redirectTo: ROLE_REDIRECTS[isUserAlreadyExist.role],
    });
  }

  const newUser = await userModel.create({
    googleId: user.id,
    email: user.emails[0].value,
    fullname: {
      firstName: user.name.givenName,
      lastName: user.name.familyName,
    },
  });

  await publishToQueue("user_created", {
    id: newUser._id,
    email: newUser.email,
    fullname: newUser.fullname,
    role: newUser.role,
  });

  const token = jwt.sign(
    {
      id: newUser._id,
      role: newUser.role,
      fullname: newUser.fullname,
    },
    config.JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.cookie("token", token);

  res.status(200).json({
    message: "user created Successfully",
    user: {
      id: newUser._id,
      email: newUser.email,
      fullname: newUser.fullname,
      role: newUser.role,
    },
    redirectTo: ROLE_REDIRECTS[newUser.role] || ROLE_REDIRECTS.student,
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(400).json({
      message: "Invalid Credentials",
    });
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({
      message: "Invalid Credentials",
    });
  }

  if (!Object.prototype.hasOwnProperty.call(ROLE_REDIRECTS, user.role)) {
    return res.status(400).json({
      message: "Invalid role on user record",
    });
  }

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      fullname: user.fullname,
    },
    config.JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.cookie("token", token);

  res.status(200).json({
    message: "Login Successfully",
    user: {
      id: user._id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
    },
    redirectTo: ROLE_REDIRECTS[user.role],
  });
}
