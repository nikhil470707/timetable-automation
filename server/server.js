const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors'); 

dotenv.config();

const timetableRoutes = require('./routes/timetableRoutes');
const dataRoutes = require('./routes/dataRoutes'); 

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); 

app.use(bodyParser.json());
app.use(express.json());


const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/timetabledb';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connection established successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use('/api', dataRoutes);

app.use('/api/timetable', timetableRoutes);

app.get('/', (req, res) => {
    res.send('Timetable Backend API is running.');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});