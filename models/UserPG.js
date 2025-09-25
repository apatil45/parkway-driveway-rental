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
    type: DataTypes.ARRAY(DataTypes.ENUM('driver', 'owner', 'admin')),
    allowNull: false,
    defaultValue: ['driver']
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
