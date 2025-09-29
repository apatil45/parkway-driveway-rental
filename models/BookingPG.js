const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  driver: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  driveway: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'driveways',
      key: 'id'
    }
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'end_date'
  },
  startTime: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'start_time'
  },
  endTime: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'end_time'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_amount'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
    defaultValue: 'pending'
  },
  driverLocation: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'driver_location'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending',
    field: 'payment_status'
  },
  stripePaymentId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'stripe_payment_id'
  },
  specialRequests: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'special_requests'
  }
}, {
  timestamps: true,
  tableName: 'bookings',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = Booking;
