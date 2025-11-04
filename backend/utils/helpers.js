import Chef from '../models/Chef.js';

// Assign order to chef with least orders
const assignChefToOrder = async () =>{
    try {
        const chefs = await Chef.find({status: 'active'}).sort({currentOrderCount:1});

        if(chefs.length === 0) {
            throw new Error('No active chefs available');
        }

        // Get chefs with minimum order count
        const minOrderCount = chefs[0].currentOrderCount;
        const availableChefs = chefs.filter(chef=> chef.currentOrderCount === minOrderCount);

        // Random selection if multiple chefs have same order count
        const randomIndex = Math.floor(Math.random()*availableChefs.length);
        const selectedChef = availableChefs[randomIndex];

        // Increment chef's order count
        selectedChef.currentOrderCount += 1;
        await selectedChef.save();

        return selectedChef._id;
    } catch (error) {
      console.log("chef couldn't be assigned");
      console.log(error.message);
        throw error;
    }
};

// Calculate average preparation time for order items
const calculatePreparationTime = (items)=>{
    const maxTime = Math.max(...items.map(item=> item.averagePreparationTime || 0));
    return maxTime;
}

// Get date range for filters
 const getDateRange = (filter) => {
  const now = new Date();
  let startDate;

  switch (filter.toLowerCase()) {
    case 'daily':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'weekly':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'monthly':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'yearly':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setHours(0, 0, 0, 0));
  }

  return startDate;
};


export {
    assignChefToOrder,
    calculatePreparationTime,
    getDateRange
};