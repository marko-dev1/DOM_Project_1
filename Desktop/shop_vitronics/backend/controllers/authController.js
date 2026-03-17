const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class AuthController {
    // ===============================
    // 🔐 ADMIN LOGIN
    // ===============================
   static async adminLogin(req, res) {
        try {
            const { username, password } = req.body;
            

            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required' });
            }

            // Try username or email
            let user = await User.findByUsername(username);
            if (!user) user = await User.findByEmail(username);
            if (!user) return res.status(401).json({ error: 'Invalid credentials' });

            // ✅ Only admins and super_admins allowed
            if (!['admin', 'super_admin'].includes(user.role)) {
                return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
            }


            // Verify password
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

            // Generate token
            const token = jwt.sign(
                { userId: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            
            res.json({
                message: 'Admin login successful',
                token,
                user: { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name }
            });

        } catch (error) {
            // console.error('❌ Admin login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }


static async login(req, res) {
    try {
        const { username, email, password } = req.body;
        const loginId = username || email;
   

        if (!loginId || !password) {
            return res.status(400).json({ error: 'Username/email and password are required' });
        }

        let user = await User.findByUsername(loginId);
        if (!user) user = await User.findByEmail(loginId);
        if (!user) return res.status(401).json({ error: 'Invalid username or password' });

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid username or password' });

        // Generate JWT
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                role: user.role 
            },
            process.env.JWT_SECRET || '12345',
            { expiresIn: '24h' }
        );

       
        
        // 🚨 FIX: Return consistent response format
        res.json({
            message: 'Login successful',
            token,
            user: { 
                id: user.id,
                userId: user.id,
                username: user.username, 
                email: user.email, 
                role: user.role, 
                name: user.name || user.username 
            }
        });

    } catch (error) {
        // console.error('❌ User login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

    // ===============================
    // 🧪 DEBUG HASH CREATION
    // ===============================
    static async debugUserCreation(req, res) {
        try {
            const { username, password } = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
            res.json({
                inputPassword: password,
                hashedPassword,
                hashLength: hashedPassword.length
            });
        } catch (error) {
            res.status(500).json({ error: 'Debug failed' });
        }
    }


    // ===============================
    // 🙍‍♂️ PROFILE
    // ===============================
    
    static async getProfile(req, res) {
    
    res.json({ user: req.user });
}

}

module.exports = AuthController;
