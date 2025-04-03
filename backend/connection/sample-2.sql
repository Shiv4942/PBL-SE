USE mydata;

CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    path TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


SELECT * FROM documents;

CREATE TABLE land_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  survey_number VARCHAR(50) NOT NULL,
  owner_name VARCHAR(100),
  area DECIMAL(10,2),
  land_type VARCHAR(50)
);

INSERT INTO land_records(survey_number , owner_name , area , land_type) VALUES('83/5' , 'arun gayakwad' , '5' , 'Residential');
SELECT * FROM land_records;
SET SQL_SAFE_UPDATES = 0;
DELETE FROM land_records WHERE owner_name = 'Arun Gaikwad';
SET SQL_SAFE_UPDATES = 1;
