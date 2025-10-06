const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Driveway = sequelize.define('Driveway', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
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
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    amenities: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: []
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: []
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    carSize: {
      type: DataTypes.STRING,
      allowNull: false
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
      { fields: ['isAvailable'] },
      { fields: ['price'] },
      { fields: ['latitude', 'longitude'] },
      { fields: ['carSize'] }
    ]
  });

  return Driveway;
};
