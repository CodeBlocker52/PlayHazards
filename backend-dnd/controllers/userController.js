const User = require('../models/User');

/**
 * Get user profile by wallet address
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserProfile = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'Wallet address is required' 
      });
    }
    
    let user = await User.findOne({ 
      walletAddress: walletAddress.toLowerCase().trim() 
    });
    
    // If user doesn't exist, create a new profile
    if (!user) {
      user = await User.create({ 
        walletAddress: walletAddress.toLowerCase().trim(),
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user profile', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { name, email, avatar, bio } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'Wallet address is required' 
      });
    }
    
    // Validate input data
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Build update object with only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;
    updateData.updatedAt = Date.now();
    
    // Find user and update
    const updatedUser = await User.findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase().trim() },
      updateData,
      { 
        new: true, // Return updated document
        upsert: true, // Create if doesn't exist
        runValidators: true, // Run schema validators
        setDefaultsOnInsert: true // Apply default values on new document
      }
    );
    
    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A user with this information already exists',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user profile', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

/**
 * Update game stats
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateGameStats = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { nftsOwned } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'Wallet address is required' 
      });
    }
    
    // Validate nftsOwned is a non-negative number if provided
    if (nftsOwned !== undefined && (isNaN(nftsOwned) || nftsOwned < 0)) {
      return res.status(400).json({
        success: false,
        message: 'nftsOwned must be a non-negative number'
      });
    }
    
    // Build update object
    const updateData = {
      'gameStats.lastPlayed': Date.now(),
      updatedAt: Date.now()
    };
    
    if (nftsOwned !== undefined) {
      updateData['gameStats.nftsOwned'] = nftsOwned;
    }
    
    const updatedUser = await User.findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase().trim() },
      updateData,
      { 
        new: true, 
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating game stats:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update game stats', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};