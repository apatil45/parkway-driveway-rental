const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  roles: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '["driver"]',
    get() {
      const value = this.getDataValue('roles');
      return value ? JSON.parse(value) : ['driver'];
    },
    set(value) {
      this.setDataValue('roles', JSON.stringify(value));
    }
  },
  carSize: {
    type: DataTypes.ENUM('small', 'medium', 'large', 'extra-large'),
    allowNull: true,
    field: 'car_size'
  },
  drivewaySize: {
    type: DataTypes.ENUM('small', 'medium', 'large', 'extra-large'),
    allowNull: true,
    field: 'driveway_size'
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'phone_number'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  onboardingCompleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'onboarding_completed'
  }
}, {
  timestamps: true,
  tableName: 'users',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const saltRounds = 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const saltRounds = 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

// Associations are set up in models/associations.js

module.exports = User;
