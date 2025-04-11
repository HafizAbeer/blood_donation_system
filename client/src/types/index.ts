export interface Donor {
  _id?: string;
  name: string;
  fatherName: string;
  contactNumber: string;
  cnicNumber: string;
  address: string;
  city: string;
  bloodGroup: string;
  department: string; 
  semester: string;
  lastDonation: Date | null;
  nextAvailableDate: Date | null;
}

export interface Admin {
  _id?: string;
  username: string;
  password: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  admin: Admin;
} 