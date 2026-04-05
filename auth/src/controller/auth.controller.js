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

const CLIENT_ROLE_REDIRECTS = {
  student: "http://localhost:5173/student",
  staff: "http://localhost:5173/staff",
  admin: "http://localhost:5173/admin",
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

  try {
    await publishToQueue("user_created", {
      id: user._id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
    });
  } catch (err) {
    console.error("Failed to publish to queue:", err);
  }

  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.status(201).json({
    message: "Registration Successfully",
    user: {
      id: user._id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
    },
    token,
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

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const userPayload = {
      id: isUserAlreadyExist._id,
      email: isUserAlreadyExist.email,
      fullname: isUserAlreadyExist.fullname,
      role: isUserAlreadyExist.role,
    };

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const redirectUrl = new URL(`${frontendUrl}/auth-success`);
    redirectUrl.searchParams.append("user", JSON.stringify(userPayload));
    redirectUrl.searchParams.append("token", token);

    return res.redirect(redirectUrl.toString());
  }

  const newUser = await userModel.create({
    googleId: user.id,
    email: user.emails[0].value,
    fullname: {
      firstName: user.name.givenName,
      lastName: user.name.familyName,
    },
  });

  try {
    await publishToQueue("user_created", {
      id: newUser._id,
      email: newUser.email,
      fullname: newUser.fullname,
      role: newUser.role,
    });
  } catch (err) {
    console.error("Failed to publish to queue:", err);
  }

  const token = jwt.sign(
    {
      id: newUser._id,
      role: newUser.role,
      fullname: newUser.fullname,
    },
    config.JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const userPayload = {
    id: newUser._id,
    email: newUser.email,
    fullname: newUser.fullname,
    role: newUser.role,
  };

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const redirectUrl = new URL(`${frontendUrl}/auth-success`);
  redirectUrl.searchParams.append("user", JSON.stringify(userPayload));
  redirectUrl.searchParams.append("token", token);

  return res.redirect(redirectUrl.toString());
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

  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    message: "Login Successfully",
    user: {
      id: user._id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
    },
    token,
    redirectTo: ROLE_REDIRECTS[user.role],
  });
}

export function logout(req, res) {
  res.clearCookie("token");
  res.status(200).json({
    message: "Logout Successfully",
  });
}

export async function getUsersByRole(req, res) {
  try {
    const { role } = req.query;
    if (!role) {
      return res.status(400).json({ message: 'Role query parameter required' });
    }
    const users = await userModel.find({ role }).select('-password -googleId');
    res.json({ users });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getCurrentUser(req, res) {
  try {
    res.json({ user: req.user });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be active or inactive' });
    }
    const user = await userModel.findByIdAndUpdate(
      id,
      { availabilityStatus: status },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user, message: 'Status updated successfully' });
  } catch (err) {
    console.error('Update user status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function toggleUserBlock(req, res) {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isBlocked = !user.isBlocked;
    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      { isBlocked },
      { new: true }
    ).select('-password');
    res.json({ 
      user: updatedUser, 
      message: isBlocked ? 'User blocked successfully' : 'User unblocked successfully' 
    });
  } catch (err) {
    console.error('Toggle block error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}
