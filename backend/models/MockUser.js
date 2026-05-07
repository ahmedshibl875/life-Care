const crypto = require('crypto');

// In-memory array acting as the database
const usersDB = [];

class MockUser {
    constructor(data) {
        Object.assign(this, data);
        if (!this._id) {
            this._id = crypto.randomBytes(12).toString('hex');
        }
    }

    async save() {
        // If it exists, update it, else push
        const index = usersDB.findIndex(u => u._id === this._id);
        if (index > -1) {
            usersDB[index] = this;
        } else {
            usersDB.push(this);
        }
        return this;
    }

    async comparePassword(candidatePassword) {
        // In this mock, we are just comparing raw text because we don't apply bcrypt pre-save hooks in mock
        // If password_hash equals exactly the candidate, return true
        return this.password_hash === candidatePassword;
    }

    markModified() {
        // No-op for mock
    }

    static async findOne(query) {
        const keys = Object.keys(query);
        const user = usersDB.find(u => {
            return keys.every(k => {
                if (typeof query[k] === 'object' && query[k].$gt) {
                    return u[k] > query[k].$gt;
                }
                return u[k] === query[k];
            });
        });
        return user ? new MockUser(user) : null;
    }

    static async findById(id) {
        const user = usersDB.find(u => u._id === id);
        if (!user) return null;
        
        // Return a mock user with a specific select() method mock
        const mockUser = new MockUser(user);
        mockUser.select = function() { return this; }; // Dummy select
        return mockUser;
    }

    static async findByIdAndUpdate(id, updateObj, options) {
        const index = usersDB.findIndex(u => u._id === id);
        if (index === -1) return null;
        
        const updates = updateObj.$set || updateObj;
        usersDB[index] = { ...usersDB[index], ...updates };
        
        const mockUser = new MockUser(usersDB[index]);
        mockUser.select = function() { return this; };
        return mockUser;
    }

    static async find(query) {
        const keys = Object.keys(query);
        const results = usersDB.filter(u => {
            return keys.every(k => u[k] === query[k]);
        });
        
        const mockResults = results.map(r => new MockUser(r));
        mockResults.select = function() { return this; };
        return mockResults;
    }
}

module.exports = MockUser;
