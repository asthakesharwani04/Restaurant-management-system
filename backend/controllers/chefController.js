import Chef from '../models/Chef.js';

// Get all chefs
export const getChefs = async (req, res)=>{
    try {
        const chefs = (await Chef.find()).toSorted({name:1});
        res.json({ success: true, data: chefs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });   
    }
};

//Get single chef
export const getChefById = async (req, res)=>{
    try {
        const chef= await Chef.findById(req.params.id);
        if(!chef){
            return res.status(404).json({ success: false, message: 'Chef not found' });
        }
        res.json({ success: true, data: chef });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

//Create new chef
export const createChef = async (req, res)=>{
    try {
       const totalChefs = await Chef.countDocuments({status: 'active'}); 

       if(totalChefs >=4){
        return res.status(400).json({ success: false, message: 'Maximum of 4 active chefs allowed' });
       }

       const chef = await Chef.create(req.body);
         res.status(201).json({ success: true, data: chef });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update chef
export const updateChef = async (req, res)=>{
    try {
        const chef = await Chef.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if(!chef){
            return res.status(404).json({ success: false, message: 'Chef not found' });
        }
        res.json({ success: true, data: chef });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete chef
export const deleteChef = async (req, res)=>{
    try {
        const chef = await Chef.findById(req.params.id);

        if(!chef){
            return res.status(404).json({ success: false, message: 'Chef not found' });
        }

        if(chef.currentOrderCount > 0){
            return res.status(400).json({ success: false, message: 'Cannot delete chef with active orders' });
        }

        await chef.deleteOne();
        res.json({ success: true, message: 'Chef deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};