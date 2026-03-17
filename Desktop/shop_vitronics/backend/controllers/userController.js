
const db = require('../config/database');
const UserService = require('../services/userService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Add validation for JWT_SECRET
const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
;
}



class UserController {
  static async createAdmin(req, res) {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const userId = await UserService.createAdmin({ username, email, password });
      res.status(201).json({ message: 'Admin created successfully', userId });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getAllAdmins(req, res) {
    try {
      const admins = await UserService.getAllAdmins();
      res.json(admins);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!['customer', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      const success = await UserService.updateUserRole(userId, role);
      if (success) {
        res.json({ message: 'User role updated successfully' });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteAdmin(req, res) {
    try {
      const { userId } = req.params;
      const success = await UserService.deleteAdmin(userId);
      
      if (success) {
        res.json({ message: 'Admin deleted successfully' });
      } else {
        res.status(404).json({ error: 'Admin not found or cannot delete super admin' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  // deletw user
  static async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      const success = await UserService.deleteUser(userId);
      if (success) {
        res.json({ message: 'User deleted successfully' });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Fetch users
  static async getAllUsers(req, res) {
    try {
      const [users] = await db.pool.query(`
          SELECT id, username, email, phone_number, role, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(users);
  } catch (error) {
  
    res.status(500).json({ error: 'Error fetching users' });
  }
}


 
  // Registration & login handlers
  static async register(req, res) {
    try {
      const { name, email, phone, password } = req.body;
      if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: 'All fields required' });
      }

      const [existing] = await db.pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const hashed = await bcrypt.hash(password, 10);
      await db.pool.execute('INSERT INTO users (username, email, phone_number, password) VALUES (?, ?, ?, ?)', [name, email, phone, hashed]);

      res.json({ message: 'User registered successfully' });
    } catch (error) {
    
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async login(req, res) {
    try {
        const { email, password } = req.body;
        

        // Add JWT secret check
        if (!SECRET) {
            
            return res.status(500).json({ message: 'Server configuration error' });
        }

        if (!email || !password) {
            
            return res.status(400).json({ message: 'Email and password required' });
        }

        const [rows] = await db.pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
         
            return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];
        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
      
            return res.status(401).json({ message: 'Invalid password' });
        }

        

        const token = jwt.sign(
            { 
                userId: user.id,  // Use userId for consistency
                email: user.email, 
                role: user.role,
                username: user.username 
            },
            SECRET,
            { expiresIn: '7h' }
        );

      
        res.json({ 
            message: 'Login successful', // Fixed typo
            token,
            user: {
                id: user.id,
                userId: user.id, // Add userId for consistency
                email: user.email,
                username: user.username,
                role: user.role,
                name: user.name || user.username // Include name field
            }
        });
    } catch (error) {
      
        res.status(500).json({ message: 'Server error' });
    }
}
};

module.exports = UserController;

