export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  avatar?: string;
  joinedAt: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  condition: Condition;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  college: string;
  createdAt: string;
  sold: boolean;
  likes: number;
}

export type Category =
  | "Arduino"
  | "Sensors"
  | "Motors"
  | "Tools"
  | "Displays"
  | "Communication"
  | "Power"
  | "Misc";

export type Condition = "New" | "Like New" | "Good" | "Fair";

export const CATEGORIES: Category[] = [
  "Arduino",
  "Sensors",
  "Motors",
  "Tools",
  "Displays",
  "Communication",
  "Power",
  "Misc",
];

export const CONDITIONS: Condition[] = ["New", "Like New", "Good", "Fair"];

export const COLLEGES: string[] = [
  // IITs
  "IIT Bombay", "IIT Delhi", "IIT Madras", "IIT Kanpur", "IIT Kharagpur",
  "IIT Roorkee", "IIT Guwahati", "IIT Hyderabad", "IIT Indore", "IIT BHU Varanasi",
  "IIT Mandi", "IIT Jodhpur", "IIT Patna", "IIT Ropar", "IIT Bhubaneswar",
  "IIT Gandhinagar", "IIT Tirupati", "IIT Palakkad", "IIT Dharwad", "IIT Jammu",
  "IIT Bhilai", "IIT Goa", "IIT (ISM) Dhanbad",

  // NITs
  "NIT Trichy", "NIT Warangal", "NIT Surathkal", "NIT Calicut", "NIT Rourkela",
  "NIT Allahabad (MNNIT)", "NIT Nagpur (VNIT)", "NIT Jaipur (MNIT)", "NIT Kurukshetra",
  "NIT Durgapur", "NIT Silchar", "NIT Hamirpur", "NIT Jalandhar", "NIT Srinagar",
  "NIT Jamshedpur", "NIT Patna", "NIT Raipur", "NIT Agartala", "NIT Meghalaya",
  "NIT Manipur", "NIT Mizoram", "NIT Nagaland", "NIT Sikkim", "NIT Arunachal Pradesh",
  "NIT Goa", "NIT Puducherry", "NIT Uttarakhand", "NIT Delhi", "NIT Andhra Pradesh",
  "NIT Surat (SVNIT)",

  // IIITs
  "IIIT Hyderabad", "IIIT Allahabad", "IIIT Bangalore", "IIIT Delhi",
  "IIIT Jabalpur", "IIIT Gwalior", "IIIT Kancheepuram", "IIIT Sri City",
  "IIIT Lucknow", "IIIT Kota", "IIIT Sonepat", "IIIT Nagpur", "IIIT Pune",
  "IIIT Ranchi", "IIIT Una", "IIIT Kalyani", "IIIT Dharwad", "IIIT Vadodara",
  "IIIT Tiruchirappalli", "IIIT Kottayam", "IIIT Manipur", "IIIT Bhagalpur",
  "IIIT Bhopal", "IIIT Surat", "IIIT Agartala",

  // BITS
  "BITS Pilani", "BITS Goa", "BITS Hyderabad",

  // Delhi
  "DTU Delhi", "NSUT Delhi", "IGDTUW Delhi", "IIIT Delhi", "Jamia Millia Islamia",
  "Delhi University (DU)",

  // Maharashtra
  "COEP Pune", "VJTI Mumbai", "ICT Mumbai", "SPIT Mumbai", "DJ Sanghvi Mumbai",
  "Thadomal Shahani Mumbai", "Sardar Patel Institute of Technology Mumbai",
  "KJ Somaiya Mumbai", "Fr. CRCE Mumbai", "Pune Institute of Computer Technology (PICT)",
  "MIT Pune", "Vishwakarma Institute of Technology Pune", "Walchand Sangli",
  "Government College of Engineering Aurangabad", "SGGSIE&T Nanded",

  // Karnataka
  "VIT Vellore", "RV College of Engineering Bangalore", "BMS College of Engineering Bangalore",
  "PES University Bangalore", "MS Ramaiah Institute Bangalore", "Dayananda Sagar Bangalore",
  "SIT Tumkur", "BMSCE Bangalore", "DSCE Bangalore", "NHCE Bangalore",
  "Manipal Institute of Technology", "JSS Science & Technology University Mysuru",

  // Tamil Nadu
  "Anna University Chennai", "PSG College of Technology Coimbatore",
  "SSN College of Engineering Chennai", "Thiagarajar College of Engineering Madurai",
  "Amrita Vishwa Vidyapeetham", "SRM Institute of Science & Technology",
  "Sathyabama University", "Saveetha Engineering College", "CEG Anna University",
  "Kumaraguru College of Technology Coimbatore", "Kongu Engineering College",
  "Mepco Schlenk Engineering College",

  // Telangana & Andhra Pradesh
  "JNTU Hyderabad", "Osmania University", "CBIT Hyderabad", "Vasavi College Hyderabad",
  "MVSR Engineering College Hyderabad", "Chaitanya Bharathi Institute Hyderabad",
  "GITAM University", "KL University", "VR Siddhartha Engineering College",
  "Andhra University Visakhapatnam", "JNTU Kakinada", "JNTU Anantapur",
  "Sri Venkateswara University Tirupati",

  // Kerala
  "CET Trivandrum", "GEC Thrissur", "TKM College Kollam", "MES College Kuttippuram",
  "NSS College of Engineering Palakkad", "Rajiv Gandhi Institute Kottayam",
  "Model Engineering College Kochi", "Mar Athanasius College Kothamangalam",

  // West Bengal
  "Jadavpur University", "IEM Kolkata", "Heritage Institute Kolkata",
  "Techno Main Salt Lake Kolkata", "IIEST Shibpur", "Kalyani Government Engineering College",
  "Haldia Institute of Technology", "Maulana Abul Kalam Azad University of Technology",

  // Rajasthan
  "MBM Engineering College Jodhpur", "Jaipur Engineering College",
  "Malaviya National Institute of Technology Jaipur", "Manipal University Jaipur",
  "Poornima College of Engineering Jaipur", "Arya College Jaipur",
  "LNMIIT Jaipur", "Birla Institute of Technology Mesra (Jaipur)",

  // Gujarat
  "LDCE Ahmedabad", "Nirma University Ahmedabad", "DAIICT Gandhinagar",
  "Charusat University", "BVM Engineering College Anand", "GEC Gandhinagar",
  "Sarvajanik College Surat", "PDEU Gandhinagar",

  // Madhya Pradesh
  "IET DAVV Indore", "SGSITS Indore", "MANIT Bhopal", "LNCT Bhopal",
  "Jabalpur Engineering College", "UIT RGPV Bhopal", "Oriental Institute Bhopal",
  "Medicaps University Indore", "Shri GS Institute Indore",

  // Uttar Pradesh
  "Harcourt Butler Technical University Kanpur", "KNIT Sultanpur",
  "BIET Jhansi", "GLA University Mathura", "Integral University Lucknow",
  "AKTU Lucknow", "SRMCEM Lucknow", "Amity University Noida",
  "Galgotias University Greater Noida", "Shiv Nadar University",
  "Bennett University Greater Noida", "JIIT Noida",

  // Punjab & Haryana
  "Thapar Institute Patiala", "PEC Chandigarh", "Chitkara University",
  "LPU Phagwara", "Guru Nanak Dev Engineering College Ludhiana",
  "UIET Chandigarh", "NITTTR Chandigarh", "Chandigarh University",
  "DCRUST Murthal", "YMCA Faridabad", "Manav Rachna University Faridabad",

  // Bihar & Jharkhand
  "BIT Mesra Ranchi", "NIT Jamshedpur", "NIT Patna", "BIT Sindri",
  "Muzaffarpur Institute of Technology", "Central University of Jharkhand",

  // Odisha
  "CET Bhubaneswar", "KIIT University", "Silicon Institute Bhubaneswar",
  "SOA University", "IIIT Bhubaneswar", "Veer Surendra Sai University Burla",

  // Northeast
  "Assam Engineering College Guwahati", "Tezpur University", "Jorhat Engineering College",
  "NIT Silchar", "NIT Meghalaya", "Manipur Institute of Technology",

  // Other
  "Chandigarh College of Engineering", "PEC University of Technology",
  "University of Petroleum & Energy Studies Dehradun", "Graphic Era University Dehradun",
  "DIT University Dehradun", "GEU Dehradun",
  "Cochin University of Science and Technology (CUSAT)",
  "Bharati Vidyapeeth Pune", "Symbiosis Institute of Technology Pune",
  "Lovely Professional University", "SRM AP", "VIT AP", "VIT Bhopal", "VIT Chennai",
  "Kalinga Institute of Industrial Technology (KIIT)",
  "Woxsen University Hyderabad", "ICFAI Foundation Hyderabad",
  "Christ University Bangalore", "Jain University Bangalore",
].sort();
