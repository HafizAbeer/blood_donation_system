import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { Donor } from './models/Donor';

declare module 'express' {
  interface Request {
    user?: any;
  }
}

interface MongoError extends Error {
  code?: number;
  errors?: Record<string, any>;
}

const app = express();

app.use(cors());
app.use(express.json());


// Connect to MongoDB
mongoose.connect(config.mongoUri, {
  serverSelectionTimeoutMS: 5000, 
  socketTimeoutMS: 45000, 
  family: 4 
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Authentication middleware
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, config.jwtSecret, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Login route
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (username === config.adminUsername && password === config.adminPassword) {
    const token = jwt.sign({ username }, config.jwtSecret, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Donor routes
app.get('/api/donors', authenticateToken, async (req, res) => {
  try {
    const donors = await Donor.find().sort({ createdAt: -1 });
    res.json(donors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donors' });
  }
});

app.get('/api/donors/:id', authenticateToken, async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }
    res.json(donor);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donor' });
  }
});

app.post('/api/donors', authenticateToken, async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['name', 'contactNumber', 'address', 'city', 'bloodGroup', 'department', 'semester'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        missingFields,
        validationErrors: Object.assign({}, ...missingFields.map(field => ({ [field]: `${field} is required` })))
      });
    }

    // Validate last donation date is not in the future
    if (req.body.lastDonation) {
      const lastDonationDate = new Date(req.body.lastDonation);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for comparison
      
      if (lastDonationDate > today) {
        return res.status(400).json({
          message: 'Invalid last donation date',
          validationErrors: {
            lastDonation: 'Last donation date cannot be in the future'
          }
        });
      }
    }

    // Normalize city name (first letter capital, rest lowercase)
    if (req.body.city) {
      req.body.city = req.body.city
        .toLowerCase()
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    // Validate blood group
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(req.body.bloodGroup)) {
      return res.status(400).json({
        message: 'Invalid blood group',
        validationErrors: {
          bloodGroup: 'Blood group must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-'
        }
      });
    }

    // Check if contact number is already registered
    // const existingDonorByContact = await Donor.findOne({ contactNumber: req.body.contactNumber });
    // if (existingDonorByContact) {
    //   return res.status(400).json({
    //     message: 'Contact number already registered',
    //     validationErrors: {
    //       contactNumber: 'This contact number is already registered'
    //     }
    //   });
    // }

    // Format the data before creating the donor
    const donorData = {
      ...req.body,
      lastDonation: req.body.lastDonation ? new Date(req.body.lastDonation) : null,
      nextAvailableDate: req.body.lastDonation 
        ? new Date(new Date(req.body.lastDonation).setMonth(new Date(req.body.lastDonation).getMonth() + 3))
        : null
    };

    const donor = new Donor(donorData);
    await donor.save();
    res.status(201).json(donor);
  } catch (error) {
    console.error('Error creating donor:', error);
    const mongoError = error as MongoError;
    
    if (mongoError.code === 11000) { // MongoDB duplicate key error
      return res.status(400).json({
        message: 'Duplicate entry found',
        validationErrors: {
          contactNumber: 'This contact number is already registered',
        }
      });
    }

    res.status(400).json({
      message: 'Error creating donor',
      error: mongoError.message,
      validationErrors: mongoError.errors || {}
    });
  }
});

app.delete('/api/donors/:id', authenticateToken, async (req, res) => {
  try {
    await Donor.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: 'Error deleting donor' });
  }
});

app.put('/api/donors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // If lastDonation is being updated, calculate nextAvailableDate
    if (updateData.lastDonation) {
      const lastDonationDate = new Date(updateData.lastDonation);
      const nextAvailableDate = new Date(lastDonationDate);
      nextAvailableDate.setMonth(nextAvailableDate.getMonth() + 3);
      updateData.nextAvailableDate = nextAvailableDate;
    }

    const donor = await Donor.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    res.json(donor);
  } catch (error) {
    console.error('Error updating donor:', error);
    res.status(500).json({ message: 'Error updating donor' });
  }
}); 

export default app