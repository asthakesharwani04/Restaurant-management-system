import Table from '../models/Table.js';
//Get all tables
export const getTables = async(req, res)=>{
    try {
        const tables = await Table.find().sort({tableNumber:1});
        res.json({success:true, tables});
    } catch (error) {
        console.error("Get Tables Error:", error);
        res.status(500).json({success:false, message:error.message});
    }
};

// Get available tables by size
export const getAvailableTablesBySize = async(req, res)=>{
    try {
        const {size, members} = req.query;

        let query = {isReserved:false};

        if(size){
            query.size = parseInt(size);
        }
        if(members){
            query.size = {$gte: parseInt(members) };
        }

        const tables = await Table.find(query).sort({tableNumber: 1});
        res.json({success:true, data: tables});
    } catch (error) {
        res.status(500).json({success:false, message:error.message});
    }
};

//Create a new table
export const createTable = async (req, res) =>{
    try {
        const totalTables = await Table.countDocuments();

        if(totalTables>= 30){
            return res.status(400).json({success:false, message:'Maximum table limit reached'});
        }

        //Get next table number
        const lastTable = await Table.findOne().sort({tableNumber:-1});
        const nextTableNumber = lastTable ? lastTable.tableNumber + 1 : 1;

        const table = await Table.create({
            ...req.body,
            tableNumber: nextTableNumber
        });
        res.status(201).json({success:true, data: table});
    } catch (error) {
        res.status(400).json({success:false, message:error.message});
    }
};

//Update table
export const updateTable = async (req, res) =>{
    try {
        const table = await Table.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new:true, runValidators:true}
        );
        if(!table){
            return res.status(404).json({success:false, message:'Table not found'});
        }
        res.json({success:true, data: table});
    } catch (error) {
        res.status(400).json({success:false, message:error.message});   
    }
};

//Release table
export const releaseTable = async (req, res) =>{
    try {
        const table = await Table.findById(req.params.id);

        if(!table){
            return res.status(404).json({success:false, message:'Table not found'});
        }

        table.isReserved = false;
        table.reservedBy = '';
        table.numberOfMembers = 0;
        await table.save();

        res.json({success:true, data: table});
    } catch (error) {
        res.status(400).json({success:false, message:error.message});   
    }
};

// Delete table and reshuffle numbers
export const deleteTable = async (req, res) =>{
    try {
        const table = await Table.findById(req.params.id);

        if(!table){
            return res.status(404).json({success:false, message:'Table not found'});
        }

         // Cannot delete reserved table
        if(table.isReserved){
            return res.status(400).json({success:false, message:'Cannot delete a reserved table'});
        }
        const deletedTableNumber = table.tableNumber;
        await table.deleteOne();

        // Reshuffle table numbers (decrease all tables with higher numbers)
        await Table.updateMany(
            {tableNumber: {$gt: deletedTableNumber}},
            {$inc: {tableNumber: -1}}
        );

        res.json({success:true, message:'Table deleted and numbers reshuffled'});
    } catch (error) {
        res.status(500).json({success:false, message:error.message});
    }
};

//Reserve table
export const reserveTable = async (req, res) =>{
    try {
        const {customerPhone, numberOfMembers} = req.body;
        const table = await Table.findById(req.params.id);

        if(!table){
            return res.status(404).json({success:false, message:'Table not found'});
        }
        if(table.isReserved){
            return res.status(400).json({success:false, message:'Table is already reserved'});
        }

        if(numberOfMembers > table.size){
            return res.status(400).json({success:false, message:'Table size is too small for number of members'});
        }

        table.isReserved = true;
        table.reservedBy = customerPhone;
        table.numberOfMembers = numberOfMembers;
        await table.save();
        res.json({success:true, data: table});
    } catch (error) {
        res.status(500).json({success:false, message:error.message});
    }
};