const { DataTypes } = require('sequelize');
const sequelize = require('./database');

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
    defaultValue: ['small', 'medium']
  },
  drivewaySize: {
    type: DataTypes.ENUM('small', 'medium', 'large', 'extra-large'),
    defaultValue: 'medium'
  }
}, {
  timestamps: true,
  tableName: 'driveways'
});

module.exports = Driveway;
