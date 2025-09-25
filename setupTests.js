const mongoose = require('mongoose');

beforeAll(async () => {
  // Connect to a test database
  await mongoose.connect(process.env.MONGO_URI_TEST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  // Disconnect from the test database
  await mongoose.connection.close();
});

afterEach(async () => {
  // Clean up the database after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});
