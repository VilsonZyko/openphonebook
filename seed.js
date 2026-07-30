const db = require('./database');

const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'Chris', 'Jessica', 'Matthew', 'Ashley', 'David', 'Sarah', 'James', 'Amanda', 'Robert', 'Brittany', 'William', 'Megan', 'Joseph', 'Rachel', 'Richard', 'Lauren'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const departments = ['Cardiology', 'Neurology', 'Pediatrics', 'Oncology', 'Emergency', 'Orthopedics', 'Radiology', 'Surgery', 'Pharmacy', 'IT Support'];

for (let i = 0; i < 100; i++) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const dept = departments[Math.floor(Math.random() * departments.length)];
  const ext = '5' + Math.floor(100 + Math.random() * 900);
  const phone = `(555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  db.addContact({
    name: `${firstName} ${lastName}`,
    department: dept,
    extension: ext,
    phone: phone,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@hospital.local`
  });
}

console.log("100 synthetic contacts seeded successfully!");
