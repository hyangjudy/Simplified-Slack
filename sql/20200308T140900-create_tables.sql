-- mysql -u root -p your_database_database_name < 20200308T140900-create_tables.sql

create table users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL
);

create table channels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  creator_id INT NOT NULL,
  name VARCHAR(30) UNIQUE,
  FOREIGN KEY(creator_id) REFERENCES users(id)
);

create table messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  channel_id INT NOT NULL,
  content TEXT NOT NULL,
  is_reply BOOL,
  parent_message_id INT, 
  created_time DATETIME NOT NULL,
  FOREIGN KEY(sender_id) REFERENCES users(id),
  FOREIGN KEY(channel_id) REFERENCES channels(id)
);