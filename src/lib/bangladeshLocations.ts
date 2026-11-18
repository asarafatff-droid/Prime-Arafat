import type { ShippingSettingsData } from '../types';

export interface BangladeshDistrict {
  name: string;
  division: string;
  defaultAreas: string[];
  defaultFee: number;
}

export const BANGLADESH_DISTRICTS: readonly BangladeshDistrict[] = [
  // Dhaka Division
  {
    name: 'Dhaka',
    division: 'Dhaka',
    defaultAreas: [
      'Mirpur',
      'Uttara',
      'Dhanmondi',
      'Gulshan',
      'Banani',
      'Mohammadpur',
      'Motijheel',
      'Badda',
      'Rampura',
      'Jatrabari',
      'Khilgaon',
      'Bashundhara R/A',
      'Farmgate',
      'Old Dhaka',
      'Savar',
      'Keraniganj',
      'Dhamrai',
      'Dohar',
      'Nawabganj',
    ],
    defaultFee: 80,
  },
  { name: 'Gazipur', division: 'Dhaka', defaultAreas: ['Gazipur Sadar', 'Tongi', 'Kaliakair', 'Kapasia', 'Sreepur', 'Kaliganj'], defaultFee: 120 },
  { name: 'Narayanganj', division: 'Dhaka', defaultAreas: ['Narayanganj Sadar', 'Fatullah', 'Siddhirganj', 'Rupganj', 'Sonargaon', 'Bandar', 'Araihazar'], defaultFee: 120 },
  { name: 'Narsingdi', division: 'Dhaka', defaultAreas: ['Narsingdi Sadar', 'Madhabdi', 'Palash', 'Shibpur', 'Belabo', 'Raipura', 'Monohardi'], defaultFee: 120 },
  {
    name: 'Tangail',
    division: 'Dhaka',
    defaultAreas: [
      'Tangail Sadar',
      'Mirzapur',
      'Kalihati',
      'Sakhipur',
      'Gopalpur',
      'Madhupur',
      'Ghatail',
      'Basail',
      'Nagarpur',
      'Delduar',
      'Bhuapur',
      'Dhanbari',
    ],
    defaultFee: 120,
  },
  { name: 'Manikganj', division: 'Dhaka', defaultAreas: ['Manikganj Sadar', 'Singair', 'Saturia', 'Ghior', 'Shivalaya', 'Harirampur'], defaultFee: 120 },
  { name: 'Munshiganj', division: 'Dhaka', defaultAreas: ['Munshiganj Sadar', 'Sreenagar', 'Lohajang', 'Sirajdikhan', 'Tongibari', 'Gazaria'], defaultFee: 120 },
  { name: 'Kishoreganj', division: 'Dhaka', defaultAreas: ['Kishoreganj Sadar', 'Bhairab', 'Bajitpur', 'Katiadi', 'Karimganj', 'Pakundia'], defaultFee: 120 },
  { name: 'Faridpur', division: 'Dhaka', defaultAreas: ['Faridpur Sadar', 'Bhanga', 'Boalmari', 'Alfadanga', 'Madhukhali', 'Nagarkanda'], defaultFee: 120 },
  { name: 'Gopalganj', division: 'Dhaka', defaultAreas: ['Gopalganj Sadar', 'Tungipara', 'Kotalipara', 'Kashiani', 'Muksudpur'], defaultFee: 120 },
  { name: 'Madaripur', division: 'Dhaka', defaultAreas: ['Madaripur Sadar', 'Shibchar', 'Kalkini', 'Rajoir'], defaultFee: 120 },
  { name: 'Rajbari', division: 'Dhaka', defaultAreas: ['Rajbari Sadar', 'Pangsha', 'Goalanda', 'Baliakandi', 'Kalukhali'], defaultFee: 120 },
  { name: 'Shariatpur', division: 'Dhaka', defaultAreas: ['Shariatpur Sadar', 'Zajira', 'Naria', 'Bhedarganj', 'Damudya', 'Gosairhat'], defaultFee: 120 },

  // Chattogram Division
  { name: 'Chattogram', division: 'Chattogram', defaultAreas: ['Agrabad', 'Nasirabad', 'GEC Circle', 'Halishahar', 'Pahartali', 'Patenga', 'Panchlaish', 'Sitakunda', 'Patiya', 'Hathazari', 'Mirsharai'], defaultFee: 120 },
  { name: "Cox's Bazar", division: 'Chattogram', defaultAreas: ["Cox's Bazar Sadar", 'Teknaf', 'Ukhiya', 'Chakaria', 'Ramu', 'Moheshkhali'], defaultFee: 120 },
  { name: 'Cumilla', division: 'Chattogram', defaultAreas: ['Cumilla Sadar', 'Kandirpar', 'Daudkandi', 'Chandina', 'Laksam', 'Chauddagram', 'Debidwar'], defaultFee: 120 },
  { name: 'Brahmanbaria', division: 'Chattogram', defaultAreas: ['Brahmanbaria Sadar', 'Ashuganj', 'Kasba', 'Nabinagar', 'Bancharampur', 'Sarail'], defaultFee: 120 },
  { name: 'Chandpur', division: 'Chattogram', defaultAreas: ['Chandpur Sadar', 'Hajiganj', 'Matlab', 'Shahrasti', 'Kachua', 'Faridganj'], defaultFee: 120 },
  { name: 'Feni', division: 'Chattogram', defaultAreas: ['Feni Sadar', 'Chhagalnaiya', 'Daganbhuiyan', 'Parshuram', 'Sonagazi', 'Fulgazi'], defaultFee: 120 },
  { name: 'Noakhali', division: 'Chattogram', defaultAreas: ['Maijdee', 'Noakhali Sadar', 'Chowmuhani', 'Begumganj', 'Chatkhil', 'Senbagh', 'Companiganj'], defaultFee: 120 },
  { name: 'Lakshmipur', division: 'Chattogram', defaultAreas: ['Lakshmipur Sadar', 'Raipur', 'Ramganj', 'Ramgati', 'Kamalnagar'], defaultFee: 120 },
  { name: 'Rangamati', division: 'Chattogram', defaultAreas: ['Rangamati Sadar', 'Kaptai', 'Baghaichhari', 'Barkal', 'Rajasthali'], defaultFee: 120 },
  { name: 'Bandarban', division: 'Chattogram', defaultAreas: ['Bandarban Sadar', 'Lama', 'Thanchi', 'Ruma', 'Naikhongchhari'], defaultFee: 120 },
  { name: 'Khagrachhari', division: 'Chattogram', defaultAreas: ['Khagrachhari Sadar', 'Dighinala', 'Panchhari', 'Ramgarh', 'Matiranga'], defaultFee: 120 },

  // Sylhet Division
  { name: 'Sylhet', division: 'Sylhet', defaultAreas: ['Zindabazar', 'Amberkhana', 'Sylhet Sadar', 'Shahjalal Upashahar', 'Beanibazar', 'Golapganj', 'Companiganj'], defaultFee: 120 },
  { name: 'Moulvibazar', division: 'Sylhet', defaultAreas: ['Moulvibazar Sadar', 'Sreemangal', 'Kulaura', 'Kamalganj', 'Barlekha', 'Rajnagar'], defaultFee: 120 },
  { name: 'Habiganj', division: 'Sylhet', defaultAreas: ['Habiganj Sadar', 'Shaistaganj', 'Madhabpur', 'Chunarughat', 'Nabiganj', 'Bahubal'], defaultFee: 120 },
  { name: 'Sunamganj', division: 'Sylhet', defaultAreas: ['Sunamganj Sadar', 'Chhatak', 'Jagannathpur', 'Derai', 'Tahirpur'], defaultFee: 120 },

  // Rajshahi Division
  { name: 'Rajshahi', division: 'Rajshahi', defaultAreas: ['Rajshahi Sadar', 'Shaheb Bazar', 'Boalia', 'Motihar', 'Paba', 'Godagari', 'Bagha', 'Charghat'], defaultFee: 120 },
  { name: 'Bogura', division: 'Rajshahi', defaultAreas: ['Bogura Sadar', 'Sherpur', 'Shajahanpur', 'Dupchanchia', 'Shibganj', 'Gabtali'], defaultFee: 120 },
  { name: 'Pabna', division: 'Rajshahi', defaultAreas: ['Pabna Sadar', 'Ishwardi', 'Bera', 'Santhia', 'Sujanagar', 'Chatmohar'], defaultFee: 120 },
  { name: 'Sirajganj', division: 'Rajshahi', defaultAreas: ['Sirajganj Sadar', 'Ullapara', 'Shahjadpur', 'Belkuchi', 'Kazipur', 'Raiganj'], defaultFee: 120 },
  { name: 'Natore', division: 'Rajshahi', defaultAreas: ['Natore Sadar', 'Singra', 'Baraigram', 'Lalpur', 'Bagatipara', 'Gurudaspur'], defaultFee: 120 },
  { name: 'Naogaon', division: 'Rajshahi', defaultAreas: ['Naogaon Sadar', 'Mohadevpur', 'Patnitala', 'Sapahar', 'Manda', 'Raninagar'], defaultFee: 120 },
  { name: 'Chapainawabganj', division: 'Rajshahi', defaultAreas: ['Chapainawabganj Sadar', 'Shibganj', 'Gomastapur', 'Nachole', 'Bholahat'], defaultFee: 120 },
  { name: 'Joypurhat', division: 'Rajshahi', defaultAreas: ['Joypurhat Sadar', 'Panchbibi', 'Kalai', 'Akkelpur', 'Khetlal'], defaultFee: 120 },

  // Khulna Division
  { name: 'Khulna', division: 'Khulna', defaultAreas: ['Khulna Sadar', 'Sonadanga', 'Khalishpur', 'Daulatpur', 'Dumuria', 'Batiaghata', 'Rupsha'], defaultFee: 120 },
  { name: 'Jashore', division: 'Khulna', defaultAreas: ['Jashore Sadar', 'Benapole', 'Jhikargachha', 'Abhaynagar', 'Manirampur', 'Keshabpur'], defaultFee: 120 },
  { name: 'Kushtia', division: 'Khulna', defaultAreas: ['Kushtia Sadar', 'Kumarkhali', 'Bheramara', 'Daulatpur', 'Mirpur', 'Khoksa'], defaultFee: 120 },
  { name: 'Satkhira', division: 'Khulna', defaultAreas: ['Satkhira Sadar', 'Tala', 'Kalaroa', 'Kaliganj', 'Shyamnagar', 'Assasuni'], defaultFee: 120 },
  { name: 'Bagerhat', division: 'Khulna', defaultAreas: ['Bagerhat Sadar', 'Mongla', 'Fakirhat', 'Morrelganj', 'Rampal', 'Chitalmari'], defaultFee: 120 },
  { name: 'Jhenaidah', division: 'Khulna', defaultAreas: ['Jhenaidah Sadar', 'Kaliganj', 'Kotchandpur', 'Shailkupa', 'Harinakunda', 'Maheshpur'], defaultFee: 120 },
  { name: 'Magura', division: 'Khulna', defaultAreas: ['Magura Sadar', 'Sreepur', 'Shalikha', 'Mohammadpur'], defaultFee: 120 },
  { name: 'Narail', division: 'Khulna', defaultAreas: ['Narail Sadar', 'Lohagara', 'Kalia'], defaultFee: 120 },
  { name: 'Chuadanga', division: 'Khulna', defaultAreas: ['Chuadanga Sadar', 'Alamdanga', 'Damurhuda', 'Jibannagar'], defaultFee: 120 },
  { name: 'Meherpur', division: 'Khulna', defaultAreas: ['Meherpur Sadar', 'Gangni', 'Mujibnagar'], defaultFee: 120 },

  // Barishal Division
  { name: 'Barishal', division: 'Barishal', defaultAreas: ['Barishal Sadar', 'Nathullabad', 'Rupatali', 'Bakerganj', 'Gournadi', 'Banaripara'], defaultFee: 120 },
  { name: 'Patuakhali', division: 'Barishal', defaultAreas: ['Patuakhali Sadar', 'Kalapara', 'Kuakata', 'Galachipa', 'Bauphal', 'Dashmina'], defaultFee: 120 },
  { name: 'Bhola', division: 'Barishal', defaultAreas: ['Bhola Sadar', 'Char Fasson', 'Lalmohan', 'Borhanuddin', 'Daulatkhan', 'Tazumuddin'], defaultFee: 120 },
  { name: 'Pirojpur', division: 'Barishal', defaultAreas: ['Pirojpur Sadar', 'Mathbaria', 'Bhandaria', 'Nazirpur', 'Nesarabad'], defaultFee: 120 },
  { name: 'Jhalokathi', division: 'Barishal', defaultAreas: ['Jhalokathi Sadar', 'Nalchity', 'Rajapur', 'Kathalia'], defaultFee: 120 },
  { name: 'Barguna', division: 'Barishal', defaultAreas: ['Barguna Sadar', 'Amtali', 'Patharghata', 'Betagi', 'Bamna', 'Taltali'], defaultFee: 120 },

  // Rangpur Division
  { name: 'Rangpur', division: 'Rangpur', defaultAreas: ['Rangpur Sadar', 'Jahaj Company More', 'Pirganj', 'Mithapukur', 'Badarganj', 'Kaunia'], defaultFee: 120 },
  { name: 'Dinajpur', division: 'Rangpur', defaultAreas: ['Dinajpur Sadar', 'Birganj', 'Parbatipur', 'Phulbari', 'Setabganj', 'Hakimpur'], defaultFee: 120 },
  { name: 'Gaibandha', division: 'Rangpur', defaultAreas: ['Gaibandha Sadar', 'Gobindaganj', 'Palashbari', 'Sundarganj', 'Sadullapur'], defaultFee: 120 },
  { name: 'Kurigram', division: 'Rangpur', defaultAreas: ['Kurigram Sadar', 'Ulipur', 'Nageshwari', 'Bhurungamari', 'Rajarhat'], defaultFee: 120 },
  { name: 'Nilphamari', division: 'Rangpur', defaultAreas: ['Nilphamari Sadar', 'Saidpur', 'Jaldhaka', 'Domar', 'Kishoreganj'], defaultFee: 120 },
  { name: 'Lalmonirhat', division: 'Rangpur', defaultAreas: ['Lalmonirhat Sadar', 'Hatibandha', 'Patgram', 'Kaliganj', 'Aditmari'], defaultFee: 120 },
  { name: 'Thakurgaon', division: 'Rangpur', defaultAreas: ['Thakurgaon Sadar', 'Pirganj', 'Ranisankail', 'Baliadangi', 'Haripur'], defaultFee: 120 },
  { name: 'Panchagarh', division: 'Rangpur', defaultAreas: ['Panchagarh Sadar', 'Tetulia', 'Boda', 'Debiganj', 'Atwari'], defaultFee: 120 },

  // Mymensingh Division
  { name: 'Mymensingh', division: 'Mymensingh', defaultAreas: ['Mymensingh Sadar', 'Ganginarpar', 'Valuka', 'Trishal', 'Muktagachha', 'Gaffargaon', 'Ishwarganj'], defaultFee: 120 },
  { name: 'Jamalpur', division: 'Mymensingh', defaultAreas: ['Jamalpur Sadar', 'Sarishabari', 'Islampur', 'Melandaha', 'Dewanganj', 'Madarganj'], defaultFee: 120 },
  { name: 'Netrokona', division: 'Mymensingh', defaultAreas: ['Netrokona Sadar', 'Kendua', 'Mohanganj', 'Durgapur', 'Purbadhala', 'Madan'], defaultFee: 120 },
  { name: 'Sherpur', division: 'Mymensingh', defaultAreas: ['Sherpur Sadar', 'Nalitabari', 'Nakla', 'Sreebardi', 'Jhenaigati'], defaultFee: 120 },
] as const;

export function getDistrictAreas(districtName: string): string[] {
  const found = BANGLADESH_DISTRICTS.find(
    (d) => d.name.toLowerCase() === districtName.trim().toLowerCase()
  );
  return found ? [...found.defaultAreas] : [];
}

export function computeDeliveryFeeForArea(
  shippingSettings: ShippingSettingsData,
  districtName: string,
  subtotal: number
): number {
  if (subtotal <= 0) return 0;
  if (
    shippingSettings.freeShippingThreshold > 0 &&
    subtotal >= shippingSettings.freeShippingThreshold
  ) {
    return 0;
  }

  const trimmed = districtName.trim();
  if (trimmed && shippingSettings.areaRates) {
    const exactRate = shippingSettings.areaRates[trimmed];
    if (typeof exactRate === 'number' && !Number.isNaN(exactRate) && exactRate >= 0) {
      return exactRate;
    }
    const lowerKey = Object.keys(shippingSettings.areaRates).find(
      (k) => k.toLowerCase() === trimmed.toLowerCase()
    );
    if (lowerKey !== undefined) {
      return Math.max(0, Number(shippingSettings.areaRates[lowerKey]) || 0);
    }
  }

  const lower = trimmed.toLowerCase();
  if (lower === 'dhaka' || lower === 'dhaka city' || lower === 'dhaka metro') {
    return shippingSettings.insideDhakaFee > 0
      ? shippingSettings.insideDhakaFee
      : shippingSettings.defaultFee || 80;
  }
  if (lower) {
    return shippingSettings.outsideDhakaFee > 0
      ? shippingSettings.outsideDhakaFee
      : shippingSettings.defaultFee || 120;
  }
  return shippingSettings.defaultFee || 120;
}

export function isDistrictDeliveryEnabled(
  shippingSettings: ShippingSettingsData,
  districtName: string
): boolean {
  const disabled = shippingSettings.disabledAreas || [];
  return !disabled.some((d) => d.toLowerCase() === districtName.trim().toLowerCase());
}
