const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

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
  }
}, {
  timestamps: true,
  tableName: 'users',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = User;
