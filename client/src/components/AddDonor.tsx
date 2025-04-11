import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddDonor: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    contactNumber: '', 
    cnicNumber: '',
    address: '',
    city: '',
    bloodGroup: '',
    department: '',
    semester: '',
    lastDonation: '',
    nextAvailableDate: '',
  });

  const formatCNIC = (value: string): string => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, '');
    
    // Format as XXXXX-XXXXXXX-X
    if (numbers.length <= 5) {
      return numbers;
    } else if (numbers.length <= 12) {
      return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
    } else {
      return `${numbers.slice(0, 5)}-${numbers.slice(5, 12)}-${numbers.slice(12, 13)}`;
    }
  };

  const formatContactNumber = (value: string): string => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, '');
    
    // Format as 03XX-XXXXXXX
    if (numbers.length <= 4) {
      return numbers;
    } else {
      return `${numbers.slice(0, 4)}-${numbers.slice(4, 11)}`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for CNIC number
    if (name === 'cnicNumber') {
      const formattedValue = formatCNIC(value);
      setFormData({
        ...formData,
        [name]: formattedValue
      });
    }
    // Special handling for contact number
    else if (name === 'contactNumber') {
      const formattedValue = formatContactNumber(value);
      setFormData({
        ...formData,
        [name]: formattedValue
      });
    }
    // Special handling for last donation date
    else if (name === 'lastDonation') {
      const lastDonationDate = new Date(value);
      const nextAvailableDate = new Date(lastDonationDate);
      nextAvailableDate.setMonth(nextAvailableDate.getMonth() + 3);
      
      setFormData({
        ...formData,
        [name]: value,
        nextAvailableDate: nextAvailableDate.toISOString().split('T')[0]
      });
    }
    else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate CNIC format
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnicRegex.test(formData.cnicNumber)) {
      toast.error('CNIC must be in the format XXXXX-XXXXXXX-X');
      return;
    }

    // Validate contact number format
    const contactRegex = /^03\d{2}-\d{7}$/;
    if (!contactRegex.test(formData.contactNumber)) {
      toast.error('Contact number must be in the format 03XX-XXXXXXX');
      return;
    }

    // Validate last donation date is not in the future
    if (formData.lastDonation) {
      const lastDonationDate = new Date(formData.lastDonation);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for comparison
      
      if (lastDonationDate > today) {
        toast.error('Last donation date cannot be in the future');
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/donors', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      toast.success('Donor added successfully!');
      navigate('/dashboard');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;
        if (errorData.validationErrors) {
          // Format validation errors for display
          const errorMessages = Object.entries(errorData.validationErrors)
            .map(([field, message]) => `${field}: ${message}`)
            .join('\n');
          toast.error(errorMessages);
        } else {
          toast.error(errorData.message || 'Error adding donor');
        }
      } else {
        toast.error('Error adding donor. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Donor</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="fatherName" className="block text-sm font-medium text-gray-700">
              Father's Name
            </label>
            <input
              type="text"
              id="fatherName"
              name="fatherName"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.fatherName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
              Contact Number
            </label>
            <input
              type="text"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="03XX-XXXXXXX"
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Format: 03XX-XXXXXXX (e.g., 0312-3456789)
            </p>
          </div>

          <div>
            <label htmlFor="cnicNumber" className="block text-sm font-medium text-gray-700">
              CNIC Number
            </label>
            <input
              type="text"
              id="cnicNumber"
              name="cnicNumber"
              value={formData.cnicNumber}
              onChange={handleChange}
              placeholder="XXXXX-XXXXXXX-X"
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Format: XXXXX-XXXXXXX-X (e.g., 12345-1234567-1)
            </p>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700">
              Blood Group
            </label>
            <select
              id="bloodGroup"
              name="bloodGroup"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.bloodGroup}
              onChange={handleChange}
            >
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">
              Department
            </label>
            <input
              type="text"
              id="department"
              name="department"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.department}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
              Semester
            </label>
            <select
              id="semester"
              name="semester"
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.semester}
              onChange={handleChange}
              required
            >
              <option value="">Select Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="lastDonation" className="block text-sm font-medium text-gray-700">
              Last Donation Date
            </label>
            <input
              type="date"
              id="lastDonation"
              name="lastDonation"
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.lastDonation}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="nextAvailableDate" className="block text-sm font-medium text-gray-700">
              Next Available Date
            </label>
            <input
              type="date"
              id="nextAvailableDate"
              name="nextAvailableDate"
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-100"
              value={formData.nextAvailableDate}
              readOnly
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Add Donor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDonor; 