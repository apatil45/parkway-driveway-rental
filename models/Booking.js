const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Booking = sequelize.define('Booking', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    },
    paymentStatus: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    },
    paymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    drivewayId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Driveways',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    indexes: [
      { fields: ['driverId'] },
      { fields: ['drivewayId'] },
      { fields: ['status'] },
      { fields: ['startTime', 'endTime'] }
    ]
  });

  return Booking;
};
