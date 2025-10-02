const express = require('express');
const Course = require('../models/Course'); 
const User = require('../models/User'); 

const getAll = async (Model, req, res) => {
    try {
        let query = Model.find({});
        
        if (Model.modelName === 'User') {
            query = query.select('-password -__v');
        }

        const items = await query.exec();
        res.status(200).json(items);
    } catch (error) {
        console.error(`Error fetching all ${Model.modelName}:`, error);
        res.status(500).json({ message: `Failed to fetch ${Model.modelName} data.`, error: error.message });
    }
};

const getOne = async (Model, req, res) => {
    try {
        const { id } = req.params;
        let query = Model.findOne({ id: id });
        
        if (Model.modelName === 'User') {
            query = query.select('-password -__v');
        }

        const item = await query.exec();

        if (!item) {
            return res.status(404).json({ message: `${Model.modelName} with ID ${id} not found.` });
        }
        res.status(200).json(item);
    } catch (error) {
        console.error(`Error fetching one ${Model.modelName}:`, error);
        res.status(500).json({ message: `Failed to fetch ${Model.modelName} by ID.`, error: error.message });
    }
};

const createItem = async (Model, req, res) => {
    try {
        if (req.body.id && await Model.findOne({ id: req.body.id })) {
            return res.status(400).json({ message: `${Model.modelName} with ID ${req.body.id} already exists.` });
        }
        
        if (Model.modelName === 'User' && !req.body.password) {
            return res.status(400).json({ message: "Password is required for user creation." });
        }

        const newItem = new Model(req.body);
        await newItem.save();
        
        if (Model.modelName === 'User') {
            const user = newItem.toObject();
            delete user.password;
            return res.status(201).json(user);
        }
        
        res.status(201).json(newItem);
    } catch (error) {
        console.error(`Error creating ${Model.modelName}:`, error);
        res.status(400).json({ message: `Failed to create ${Model.modelName}.`, error: error.message });
    }
};

const updateItem = async (Model, req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        if (Model.modelName === 'User') {
            if (!updateData.password) {
                delete updateData.password;
            }
        }
        
        const updatedItem = await Model.findOneAndUpdate(
            { id: id }, 
            updateData, 
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ message: `${Model.modelName} with ID ${id} not found.` });
        }
        
        if (Model.modelName === 'User') {
            const user = updatedItem.toObject();
            delete user.password;
            return res.status(200).json(user);
        }
        
        res.status(200).json(updatedItem);
    } catch (error) {
        console.error(`Error updating ${Model.modelName}:`, error);
        res.status(400).json({ message: `Failed to update ${Model.modelName}.`, error: error.message });
    }
};

const deleteItem = async (Model, req, res) => {
    try {
        const { id } = req.params;

        if (Model.modelName === 'Group') {
            const courseCount = await Course.countDocuments({ group: id });
            if (courseCount > 0) {
                return res.status(409).json({
                    message: `Cannot delete Group ID ${id}. It is currently associated with ${courseCount} courses.`,
                });
            }
        }

        const result = await Model.findOneAndDelete({ id: id });

        if (!result) {
            return res.status(404).json({ message: `${Model.modelName} with ID ${id} not found.` });
        }
        
        res.status(200).json({ message: `${Model.modelName} with ID ${id} successfully deleted.`, deletedItem: result });
    } catch (error) {
        console.error(`Error deleting ${Model.modelName}:`, error);
        res.status(500).json({ message: `Failed to delete ${Model.modelName}.`, error: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { id, password } = req.body;
        
        if (!id || !password) {
            return res.status(400).json({ message: "ID and password are required." });
        }

        const user = await User.findOne({ id: { $regex: new RegExp(`^${id}$`, 'i') } });

        if (!user) {
            return res.status(401).json({ message: "Invalid User ID or Password." });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: "Invalid User ID or Password." });
        }

        const userData = user.toObject();
        delete userData.password;
        
        res.status(200).json({ message: "Login successful.", user: userData });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: "An unexpected error occurred during login." });
    }
};


module.exports = {
    getAll,
    getOne,
    createItem,
    updateItem,
    deleteItem,
    loginUser, 
};