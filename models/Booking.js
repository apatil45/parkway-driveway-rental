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
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'expired'),
      defaultValue: 'pending'
    },
    specialInstructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded', 'failed'),
      defaultValue: 'pending'
    },
    paymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    stripeSessionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    userId: {
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
      { fields: ['userId'] },
      { fields: ['drivewayId'] },
      { fields: ['status'] },
      { fields: ['paymentStatus'] },
      { fields: ['startTime', 'endTime'] },
      { fields: ['paymentIntentId'] }
    ]
  });

  return Booking;
};
