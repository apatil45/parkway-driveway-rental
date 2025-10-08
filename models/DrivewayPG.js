const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const Driveway = sequelize.define('Driveway', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  owner: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  availability: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  carSizeCompatibility: {
    type: DataTypes.JSON,
    defaultValue: ['small', 'medium'],
    field: 'car_size_compatibility'
  },
  drivewaySize: {
    type: DataTypes.ENUM('small', 'medium', 'large', 'extra-large'),
    defaultValue: 'medium',
    field: 'driveway_size'
  },
  amenities: {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: true
  },
  pricePerHour: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 5.00,
    allowNull: true,
    field: 'price_per_hour'
  },
  specificSlots: {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: true,
    field: 'specific_slots'
  }
}, {
  timestamps: true,
  tableName: 'driveways',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

// Associations are set up in models/associations.js

module.exports = Driveway;
