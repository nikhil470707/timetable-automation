const { exec } = require('child_process');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const Room = require('../models/Room');
const Slot = require('../models/Slot');
const TimetableSolution = require('../models/TimetableSolution'); 

const SOLVER_DIR = path.join(__dirname, '..', '..', 'solver');
const DATA_DIR = path.join(SOLVER_DIR, 'data');

async function writeDataToCSV(model, filename, headerMap) {
    const data = await model.find().lean();
    
    const records = data.map(item => {
        const transformedItem = { ...item };
        if (item.qualified_courses) transformedItem.qualified_courses = item.qualified_courses.join(',');
        if (item.available_days) transformedItem.available_days = item.available_days.join(',');
        if (item.preferred_periods) transformedItem.preferred_periods = item.preferred_periods.join(',');
        return transformedItem;
    });

    const csvWriter = createCsvWriter({
        path: path.join(DATA_DIR, filename),
        header: headerMap,
    });
    
    await csvWriter.writeRecords(records);
    console.log(`[CSV Writer] Wrote ${records.length} records to ${filename}`);
}


exports.generateTimetable = async (req, res) => {
    try {
        console.log('--- Timetable Generation Started ---');

        const courses = await Course.find().lean();
        const teachers = await Teacher.find().lean();
        const rooms = await Room.find().lean();
        const slots = await Slot.find().lean();
        const totalSlots = slots.length; 
        const maxRoomCapacity = rooms.reduce((max, room) => Math.max(max, room.capacity), 0);
        const oversizedGroup = courses.find(course => course.size > maxRoomCapacity);
        const overscheduledCourse = courses.find(course => course.hours > totalSlots);
        
        if (oversizedGroup) {
            console.error('Room Capacity Conflict');
            return res.status(400).json({ 
                message: "Validation Failed: Room Capacity Conflict.", 
                details: `Course group ${oversizedGroup.group} (Size: ${oversizedGroup.size}) requires more capacity than the largest room available (Max Capacity: ${maxRoomCapacity}).`
            });
        }
        
        if (overscheduledCourse) {
            console.error('Course Hours Conflict');
            return res.status(400).json({ 
                message: "Validation Failed: Course Hours Conflict.", 
                details: `Course ${overscheduledCourse.course} requires ${overscheduledCourse.hours} hours/week, which exceeds the total ${totalSlots} available time slots.`
            });
        }
        
        for (const teacher of teachers) {
            const qualifiedCourseHours = courses
                .filter(course => teacher.qualified_courses.includes(course.course))
                .reduce((sum, course) => sum + course.hours, 0);
            
            if (qualifiedCourseHours > totalSlots) {
                console.error('Teacher Max Load Conflict');
                return res.status(400).json({ 
                    message: "Validation Failed: Teacher Load Conflict (Absolute Max).", 
                    details: `Teacher ${teacher.name} is qualified for courses requiring a total of ${qualifiedCourseHours} hours, which exceeds the absolute maximum of ${totalSlots} slots per week. The problem is guaranteed to be infeasible.`
                });
            }
        };

        
        await writeDataToCSV(Teacher, 'teachers.csv', [
            { id: 'id', title: 'id' }, { id: 'name', title: 'name' }, 
            { id: 'qualified_courses', title: 'qualified_courses' }, 
            { id: 'available_days', title: 'available_days' }, 
            { id: 'preferred_periods', title: 'preferred_periods' }
        ]);
        
        await writeDataToCSV(Room, 'rooms.csv', [
            { id: 'id', title: 'id' }, { id: 'name', title: 'name' }, 
            { id: 'capacity', title: 'capacity' }
        ]);
        
        await writeDataToCSV(Course, 'courses.csv', [
            { id: 'id', title: 'id' }, { id: 'course', title: 'course' }, 
            { id: 'hours', title: 'hours' }, { id: 'group', title: 'group' }, 
            { id: 'size', title: 'size' }
        ]);

        await writeDataToCSV(Slot, 'slots.csv', [
            { id: 'id', title: 'id' }, { id: 'day', title: 'day' }, 
            { id: 'period', title: 'period' }
        ]);
        
        const pythonExecutable = path.join(SOLVER_DIR, 'venv', 'Scripts', 'python.exe');
        const solverScript = path.join(SOLVER_DIR, 'solver.py');
        const command = `${pythonExecutable} ${solverScript}`;
        
        exec(command, { cwd: SOLVER_DIR }, (error, stdout, stderr) => {
            
            if (error) {
                console.error(`Process Execution failed: ${error.message}`);
                return res.status(500).json({ 
                    message: "Timetable generation failed (System Error).", 
                    details: stderr || error.message 
                });
            }

            if (stderr) {
                console.warn(`stderr: ${stderr.trim()}`);
                
                if (stderr.toUpperCase().includes('INFEASIBLE')) {
                    return res.status(422).json({ 
                        message: "Timetable generation failed: The problem is INFEASIBLE.", 
                        details: "The solver could not find a solution that satisfies all constraints. Check your hard rules and input data." 
                    });
                }
            }

            try {
                const solution = JSON.parse(stdout.trim());
                
                console.log('--- Timetable Generation Succeeded ---');
                
                return res.status(200).json({ 
                    message: "Timetable generated successfully.", 
                    timetable: solution 
                });

            } catch (parseError) {
                console.error("Failed to parse solver output as JSON:", stdout);
                return res.status(500).json({ 
                    message: "Solver ran but returned an invalid JSON format.", 
                    details: parseError.message 
                });
            }
        });

    } catch (dbError) {
        console.error('Database/File Preparation Error:', dbError.message);
        return res.status(500).json({ 
            message: "Failed to prepare data for the solver.", 
            details: dbError.message 
        });
    }
};

exports.saveTimetable = async (req, res) => {
    try {
        const { timetable, isLocked = false } = req.body; 
        
        if (!timetable || timetable.length === 0) {
            return res.status(400).json({ message: "No timetable data provided to save." });
        }

        const newSolution = new TimetableSolution({ solutionData: timetable, isLocked: isLocked });
        await newSolution.save();
        
        res.status(201).json({ 
            message: "Timetable saved successfully.", 
            timestamp: newSolution.timestamp 
        });
    } catch (error) {
        console.error('Error saving timetable:', error);
        res.status(500).json({ message: "Failed to save timetable solution.", details: error.message });
    }
};

exports.loadLastTimetable = async (req, res) => {
    try {
        const lastSolution = await TimetableSolution.findOne()
            .sort({ timestamp: -1 }) 
            .limit(1);

        if (!lastSolution) {
            return res.status(404).json({ message: "No saved timetables found." });
        }

        res.status(200).json({
            message: "Last saved timetable loaded successfully.",
            timestamp: lastSolution.timestamp,
            timetable: lastSolution.solutionData,
            isLocked: lastSolution.isLocked 
        });
    } catch (error) {
        console.error('Error loading last timetable:', error);
        res.status(500).json({ message: "Failed to load last timetable solution.", details: error.message });
    }
};

exports.loadLastLockedTimetable = async (req, res) => {
    try {
        const lockedSolution = await TimetableSolution.findOne({ isLocked: true })
            .sort({ timestamp: -1 })
            .limit(1);

        if (!lockedSolution) {
            return res.status(404).json({ message: "Final timetable not yet published." }); 
        }

        res.status(200).json({
            message: "Last locked timetable loaded successfully.",
            timestamp: lockedSolution.timestamp,
            timetable: lockedSolution.solutionData,
            isLocked: lockedSolution.isLocked 
        });
    } catch (error) {
        console.error('Error loading last locked timetable:', error);
        res.status(500).json({ message: "Failed to load last locked timetable solution.", details: error.message });
    }
};

exports.getAllSolutions = async (req, res) => {
    try {
        const solutions = await TimetableSolution.find({})
            .select('_id timestamp isLocked')
            .sort({ timestamp: -1 }); 

        res.status(200).json(solutions);
    } catch (error) {
        console.error('Error fetching all solutions:', error);
        res.status(500).json({ message: "Failed to retrieve solution history.", details: error.message });
    }
};

exports.loadSpecificTimetable = async (req, res) => {
    try {
        const { id } = req.params;
        const solution = await TimetableSolution.findById(id);

        if (!solution) {
            return res.status(404).json({ message: `Solution with ID ${id} not found.` });
        }

        res.status(200).json({
            message: `Solution ${id} loaded successfully.`,
            timestamp: solution.timestamp,
            timetable: solution.solutionData,
            isLocked: solution.isLocked
        });
    } catch (error) {
        console.error('Error loading specific timetable:', error);
        res.status(500).json({ message: "Failed to load specific timetable solution.", details: error.message });
    }
};

exports.toggleLockStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const solution = await TimetableSolution.findById(id);

        if (!solution) {
            return res.status(404).json({ message: `Solution with ID ${id} not found.` });
        }

        const newLockStatus = !solution.isLocked;
        solution.isLocked = newLockStatus;
        await solution.save();

        res.status(200).json({
            message: `Solution ${id} lock status updated to ${newLockStatus ? 'LOCKED' : 'UNLOCKED'}.`,
            isLocked: newLockStatus
        });

    } catch (error) {
        console.error('Error toggling lock status:', error);
        res.status(500).json({ message: "Failed to toggle solution lock status.", details: error.message });
    }
};
