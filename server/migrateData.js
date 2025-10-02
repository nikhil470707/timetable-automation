const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const Teacher = require('./models/Teacher');
const Room = require('./models/Room');
const Course = require('./models/Course');
const Slot = require('./models/Slot');
const Group = require('./models/Group'); 
const User = require('./models/User'); 


const MONGO_URI = process.env.MONGO_URI; 
if (!MONGO_URI) {
    console.error("🚨 MONGO_URI is not defined. Please check your server/.env file.");
    process.exit(1); 
}

const CSV_DIR = path.join(__dirname, '..', 'solver', 'data'); 

const cleanArray = (value) => value ? value.split(',').map(s => s.trim()).filter(s => s) : [];
const cleanNumberArray = (value) => cleanArray(value).map(Number).filter(n => !isNaN(n));

const importData = async (model, filename, transformFn = (data) => data) => {
    const filePath = path.join(CSV_DIR, filename);
    const collectionName = model.collection.name;
    
    console.log(`\nStarting import for ${collectionName} from ${filename}...`);
    
    await model.deleteMany({});
    console.log(`Cleared existing ${collectionName} data.`);

    const dataRecords = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                dataRecords.push(transformFn(data));
            })
            .on('end', async () => {
                try {
                    const result = await model.insertMany(dataRecords);
                    console.log(`Successfully imported ${result.length} ${collectionName} records.`);
                    resolve();
                } catch (error) {
                    console.error(`Error inserting data into ${collectionName}:`, error);
                    reject(error);
                }
            })
            .on('error', reject);
    });
};

const runMigration = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected successfully.');

        // Teachers
        await importData(Teacher, 'teachers.csv', (data) => ({
            id: data.id,
            name: data.name,
            qualified_courses: cleanArray(data.qualified_courses),
            available_days: cleanArray(data.available_days),
            preferred_periods: cleanNumberArray(data.preferred_periods)
        }));

        // Rooms
        await importData(Room, 'rooms.csv', (data) => ({
            id: data.id,
            name: data.name,
            capacity: parseInt(data.capacity, 10)
        }));

        // Courses
        await importData(Course, 'courses.csv', (data) => ({
            id: data.id,
            course: data.course,
            hours: parseInt(data.hours, 10),
            group: data.group,
            size: parseInt(data.size, 10)
        }));
        
        // Slots
        await importData(Slot, 'slots.csv', (data) => ({
            id: data.id,
            day: data.day,
            period: parseInt(data.period, 10)
        }));

        // Groups
        await importData(Group, 'groups.csv', (data) => ({
            id: data.id,
            name: data.name
        }));
        
        // Users 
        await importData(User, 'users.csv', (data) => ({
            id: data.id,
            username: data.username,
            password: data.password,
            role: data.role,
        }));
        
        console.log('\n✅ All data migration completed successfully.');

    } catch (error) {
        console.error('\n🚨 FATAL ERROR during migration:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB connection closed.');
    }
};

runMigration();