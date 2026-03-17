
// Fixed User.js
const database = require('../config/database');
const pool = database.pool;
const bcrypt = require('bcrypt');

class User {
    static async create(userData) {
        const { username, email, password, role = 'customer', name, phone_number } = userData;
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const query = `
            INSERT INTO users (username, email, password, role, name, phone_number) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
   
        const params = [
            username,
            email,
            hashedPassword,
            role,
            name ?? null,        
            phone_number ?? null 
        ];
        
        const [result] = await pool.execute(query, params);
        return result.insertId;
    }

    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await pool.execute(query, [email]);
        return rows[0];
    }

    static async findById(id) {
        const query = 'SELECT id, username, email, role, name, phone_number, created_at FROM users WHERE id = ?';
        const [rows] = await pool.execute(query, [id]);
        return rows[0];
    }

    static async findByUsername(username) {
        const query = 'SELECT * FROM users WHERE username = ?';
        const [rows] = await pool.execute(query, [username]);
        return rows[0];
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Admin specific methods
    static async findAllAdmins() {
        const query = `
            SELECT id, username, email, role, name, phone_number, created_at 
            FROM users 
            WHERE role IN ('admin', 'super_admin') 
            ORDER BY created_at DESC
        `;
        const [rows] = await pool.execute(query);
        return rows;
    }

    static async updateRole(userId, role) {
        const query = 'UPDATE users SET role = ? WHERE id = ? AND role != "super_admin"';
        const [result] = await pool.execute(query, [role, userId]);
        return result.affectedRows > 0;
    }

    static async delete(userId) {
        // Prevent deletion of super_admin and current user
        const query = 'DELETE FROM users WHERE id = ? AND role NOT IN ("super_admin")';
        const [result] = await pool.execute(query, [userId]);
        return result.affectedRows > 0;
    }

    static async getAllUsers() {
        const query = `
            SELECT id, username, email, role, name, phone_number, created_at 
            FROM users 
            ORDER BY created_at DESC
        `;
        const [rows] = await pool.execute(query);
        return rows;
    }

    static async updateUser(userId, updateData) {
        const { name, email, phone_number } = updateData;
        const query = 'UPDATE users SET name = ?, email = ?, phone_number = ? WHERE id = ?';
        
        // ✅ Fix: Convert undefined values to null for update as well
        const params = [
            name ?? null,       
            email ?? null,      
            phone_number ?? null,
            userId
        ];
        
        const [result] = await pool.execute(query, params);
        return result.affectedRows > 0;
    }

    static async isAdmin(userId) {
        const user = await this.findById(userId);
        return user && ['admin', 'super_admin'].includes(user.role);
    }

    static async isSuperAdmin(userId) {
        const user = await this.findById(userId);
        return user && user.role === 'super_admin';
    }
}

module.exports = User;