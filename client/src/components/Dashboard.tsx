import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import API_BASE_URL from '../config';

interface Donor {
  _id: string;
  name: string;
  contactNumber: string;
  address: string;
  city: string;
  bloodGroup: string;
  department: string;
  semester: string;
  lastDonation: string;
  nextAvailableDate: string;
}

interface Stats {
  totalDonors: number;
  bloodGroupCount: Record<string, number>;
  cityCount: Record<string, number>;
  recentDonations: number;
}

interface ChartData {
  name: string;
  value: number;
}

interface PieChartData {
  name: string;
  value: number;
  percent?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Dashboard: React.FC = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [filteredDonors, setFilteredDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('name');
  const [stats, setStats] = useState<Stats>({
    totalDonors: 0,
    bloodGroupCount: {},
    cityCount: {},
    recentDonations: 0
  });
  const [showCharts, setShowCharts] = useState(true);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [exportData, setExportData] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchDonors = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/donors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(response.data)) {
        setDonors(response.data);
        setFilteredDonors(response.data);
        calculateStats(response.data);
      } else {
        console.error('Expected array of donors but got:', response.data);
        setDonors([]);
        setFilteredDonors([]);
        setStats({
          totalDonors: 0,
          bloodGroupCount: {},
          cityCount: {},
          recentDonations: 0
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching donors:', error);
      setLoading(false);
    }
  }, []);

  const filterDonors = useCallback(() => {
    if (!searchTerm.trim()) {
      setFilteredDonors(donors);
      return;
    }

    const filtered = donors.filter(donor => {
      const searchTermLower = searchTerm.toLowerCase();
      const filterValue = donor[filterBy as keyof typeof donor]?.toString().toLowerCase() || '';

      // Special handling for city search
      if (filterBy === 'city') {
        return filterValue.includes(searchTermLower);
      }

      return filterValue.includes(searchTermLower);
    });

    setFilteredDonors(filtered);
  }, [searchTerm, filterBy, donors]);

  const prepareExportData = useCallback(() => {
    const data = filteredDonors.map(donor => ({
      Name: donor.name,
      'Contact Number': donor.contactNumber,
      Address: donor.address,
      City: donor.city,
      'Blood Group': donor.bloodGroup,
      Department: donor.department,
      Semester: donor.semester,
      'Last Donation': donor.lastDonation ? new Date(donor.lastDonation).toLocaleDateString() : 'Never',
      'Next Available': donor.nextAvailableDate ? new Date(donor.nextAvailableDate).toLocaleDateString() : 'N/A'
    }));
    setExportData(data);
  }, [filteredDonors]);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  useEffect(() => {
    filterDonors();
  }, [filterDonors]);

  useEffect(() => {
    prepareExportData();
  }, [prepareExportData]);

  const calculateStats = (donors: Donor[]) => {
    const bloodGroupCount: Record<string, number> = {};
    const cityCount: Record<string, number> = {};
    let recentDonations = 0;

    donors.forEach(donor => {
      bloodGroupCount[donor.bloodGroup] = (bloodGroupCount[donor.bloodGroup] || 0) + 1;
      cityCount[donor.city] = (cityCount[donor.city] || 0) + 1;

      if (donor.lastDonation) {
        const donationDate = new Date(donor.lastDonation);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (donationDate >= thirtyDaysAgo) {
          recentDonations++;
        }
      }
    });

    setStats({
      totalDonors: donors.length,
      bloodGroupCount,
      cityCount,
      recentDonations
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedDonors = [...filteredDonors].sort((a, b) => {
    const aValue = a[sortBy as keyof Donor]?.toString().toLowerCase() || '';
    const bValue = b[sortBy as keyof Donor]?.toString().toLowerCase() || '';
    return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
  });

  const bloodGroupData = Object.entries(stats.bloodGroupCount).map(([name, value]) => ({
    name,
    value
  })) as ChartData[];

  const cityData = Object.entries(stats.cityCount).map(([name, value]) => ({
    name,
    value
  })) as ChartData[];

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <img
                    src="/images/logo.jpg"
                    alt="Blood Donation Logo"
                    className="h-12 w-auto"
                  />
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:items-center">
                  <h1 className="text-xl font-bold text-gray-800">Riphah Blood Donation System</h1>
                </div>
              </div>

              {/* Mobile menu button */}
              <div className="flex items-center sm:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                >
                  <span className="sr-only">Open main menu</span>
                  {!isMenuOpen ? (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Desktop menu */}
              <div className="hidden sm:flex sm:items-center sm:space-x-4">
                <button
                  onClick={() => navigate('/add-donor')}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Add Donor
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              <div className="block px-3 py-2 text-base font-medium text-gray-700">
                Riphah Blood Donation System
              </div>
              <button
                onClick={() => navigate('/add-donor')}
                className="block w-full text-left px-3 py-2 text-base font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Add Donor
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 text-base font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <img
                  src="/images/logo.jpg"
                  alt="Blood Donation Logo"
                  className="h-12 w-auto"
                />
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <h1 className="text-xl font-bold text-gray-800">Riphah Blood Donation System</h1>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                <span className="sr-only">Open main menu</span>
                {!isMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>

            {/* Desktop menu */}
            <div className="hidden sm:flex sm:items-center sm:space-x-4">
              <button
                onClick={() => navigate('/add-donor')}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Add Donor
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <div className="block px-3 py-2 text-base font-medium text-gray-700">
              Riphah Blood Donation System
            </div>
            <button
              onClick={() => navigate('/add-donor')}
              className="block w-full text-left px-3 py-2 text-base font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Add Donor
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 text-base font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Stats Dashboard */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 transform hover:scale-105 transition-transform duration-200">
            <h3 className="text-lg font-semibold text-gray-700">Total Donors</h3>
            <p className="text-3xl font-bold text-indigo-600">{stats.totalDonors}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 transform hover:scale-105 transition-transform duration-200">
            <h3 className="text-lg font-semibold text-gray-700">Recent Donations</h3>
            <p className="text-3xl font-bold text-green-600">{stats.recentDonations}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 transform hover:scale-105 transition-transform duration-200">
            <h3 className="text-lg font-semibold text-gray-700">Blood Groups</h3>
            <p className="text-3xl font-bold text-red-600">{Object.keys(stats.bloodGroupCount).length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 transform hover:scale-105 transition-transform duration-200">
            <h3 className="text-lg font-semibold text-gray-700">Cities</h3>
            <p className="text-3xl font-bold text-blue-600">{Object.keys(stats.cityCount).length}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {showCharts && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Data Visualization</h2>
              <button
                onClick={() => setShowCharts(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-80">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Blood Group Distribution</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bloodGroupData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: PieChartData) => `${name} ${(percent! * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {bloodGroupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="h-80">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Donors by City</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={cityData}
                    margin={{ top: 20, right: 30, left: 20, bottom: cityData.length > 5 ? 100 : 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={cityData.length > 5 ? -45 : 0}
                      textAnchor={cityData.length > 5 ? "end" : "middle"}
                      height={cityData.length > 5 ? 100 : 60}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#333333" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Search donors..."
              />
            </div>
            <div className="w-full sm:w-48">
              <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter By
              </label>
              <select
                id="filter"
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="name">Name</option>
                <option value="city">City</option>
                <option value="bloodGroup">Blood Group</option>
                <option value="department">Department</option>
                <option value="contactNumber">Contact Number</option>
              </select>
            </div>
            <div className="w-full sm:w-48">
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="name">Name</option>
                <option value="city">City</option>
                <option value="bloodGroup">Blood Group</option>
                <option value="lastDonation">Last Donation</option>
                <option value="nextAvailableDate">Next Available</option>
              </select>
            </div>
            <div className="w-full sm:w-48 flex items-end">
              <CSVLink
                data={exportData}
                filename="donors.csv"
                className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors duration-200"
              >
                Export to CSV
              </CSVLink>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedDonors.map((donor) => (
            <div
              key={donor._id}
              className="bg-white rounded-lg shadow-md p-6 transform hover:scale-105 transition-transform duration-200"
            >
              <h2 className="text-xl font-semibold text-gray-800">{donor.name}</h2>
              <div className="mt-4 space-y-2">
                <p className="text-gray-600">
                  <span className="font-medium">Blood Group:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-sm ${donor.bloodGroup === 'O+' ? 'bg-red-100 text-red-800' :
                    donor.bloodGroup === 'A+' ? 'bg-blue-100 text-blue-800' :
                      donor.bloodGroup === 'B+' ? 'bg-green-100 text-green-800' :
                        donor.bloodGroup === 'AB+' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                    }`}>
                    {donor.bloodGroup}
                  </span>
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Contact:</span> {donor.contactNumber}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Address:</span> {donor.address}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">City:</span> {donor.city}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Department:</span> {donor.department}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Semester:</span> {donor.semester}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Last Donation:</span>
                  <span className={`ml-2 ${donor.lastDonation ?
                    new Date(donor.lastDonation) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ?
                      'text-green-600' : 'text-gray-600' : 'text-gray-400'
                    }`}>
                    {donor.lastDonation ? new Date(donor.lastDonation).toLocaleDateString() : 'Never'}
                  </span>
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Next Available:</span>
                  <span className={`ml-2 ${donor.nextAvailableDate &&
                    new Date(donor.nextAvailableDate) <= new Date() ?
                    'text-green-600' : 'text-gray-600'
                    }`}>
                    {donor.nextAvailableDate ? new Date(donor.nextAvailableDate).toLocaleDateString() : 'N/A'}
                  </span>
                </p>
              </div>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => navigate(`/edit-donor/${donor._id}`)}
                  className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      await axios.delete(`${API_BASE_URL}/api/donors/${donor._id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      fetchDonors();
                    } catch (error) {
                      console.error('Error deleting donor:', error);
                    }
                  }}
                  className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;