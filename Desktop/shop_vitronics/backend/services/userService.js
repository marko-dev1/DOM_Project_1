const User = require('../models/user');
const bcrypt = require('bcrypt');

class UserService {
  static async createAdmin(userData) {
    const { username, email, password } = userData;
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const userId = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'admin'
    });

    return userId;
  }

  static async getAllAdmins() {
    return await User.findAllAdmins();
  }

  static async updateUserRole(userId, role) {
    return await User.updateRole(userId, role);
  }

  static async deleteAdmin(userId) {
    return await User.delete(userId);
  }

   static async deleteUser(userId) {
    return await User.delete(userId);
  }
}

module.exports = UserService;