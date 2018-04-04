create database comp5322;

CREATE USER 'root'@'%' IDENTIFIED BY 'qwerqwer';

GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

CREATE USER 'comp5322'@'localhost' IDENTIFIED BY 'comp5322project';

GRANT ALL PRIVILEGES ON *.* TO 'comp5322'@'localhost' WITH GRANT OPTION;

CREATE USER 'comp5322'@'%' IDENTIFIED BY 'comp5322project';

GRANT ALL PRIVILEGES ON *.* TO 'comp5322'@'%' WITH GRANT OPTION;

flush privileges;

CREATE TABLE IF NOT EXISTS `comp5322`.`users` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(20) NOT NULL,
  `last_name` varchar(20) NOT NULL,
  `mob_no` varchar(20),
  `user_name` varchar(20) NOT NULL,
  `password` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
);

insert into `comp5322`.`users` values(1, 'Peter', 'Chan', '91239123', 'demo', password('demo'));

CREATE TABLE `videos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `datetime` datetime DEFAULT CURRENT_TIMESTAMP,
  `name` varchar(255) DEFAULT NULL,
  `userid` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
);