const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LupinMap Backend is running!' });
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
