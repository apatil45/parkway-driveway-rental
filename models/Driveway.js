const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Driveway = sequelize.define('Driveway', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [10, 1000]
      }
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 255]
      }
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    amenities: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    carSize: {
      type: DataTypes.ENUM('small', 'medium', 'large', 'xl'),
      allowNull: false,
      defaultValue: 'medium'
    },
    accessInstructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    restrictions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    indexes: [
      { fields: ['ownerId'] },
      { fields: ['isActive'] },
      { fields: ['isAvailable'] },
      { fields: ['price'] },
      { fields: ['latitude', 'longitude'] },
      { fields: ['carSize'] }
    ]
  });

  return Driveway;
};
