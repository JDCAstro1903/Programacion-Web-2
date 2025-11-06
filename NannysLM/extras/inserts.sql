-- Users (id 1..20)
INSERT INTO users (id,email,password_hash,first_name,last_name,phone_number,address,user_type,is_verified,is_active,profile_image,created_at,updated_at)
VALUES
(1,'client1@example.com','hash1','Ana','Gonzalez','6690000001','Calle 1','client',1,1,NULL,NOW(),NOW()),
(2,'client2@example.com','hash2','Luis','Martinez','6690000002','Calle 2','client',1,1,NULL,NOW(),NOW()),
(3,'client3@example.com','hash3','María','Pérez','6690000003','Calle 3','client',0,1,NULL,NOW(),NOW()),
(4,'client4@example.com','hash4','Carlos','Ruiz','6690000004','Calle 4','client',1,1,NULL,NOW(),NOW()),
(5,'client5@example.com','hash5','Sofía','Ramirez','6690000005','Calle 5','client',0,1,NULL,NOW(),NOW()),
(6,'client6@example.com','hash6','Diego','Flores','6690000006','Calle 6','client',1,1,NULL,NOW(),NOW()),
(7,'client7@example.com','hash7','Lucía','Santos','6690000007','Calle 7','client',1,1,NULL,NOW(),NOW()),
(8,'client8@example.com','hash8','Miguel','Ortega','6690000008','Calle 8','client',0,1,NULL,NOW(),NOW()),
(9,'client9@example.com','hash9','Paula','Vega','6690000009','Calle 9','client',1,1,NULL,NOW(),NOW()),
(10,'client10@example.com','hash10','Jorge','Molina','6690000010','Calle 10','client',1,1,NULL,NOW(),NOW()),
(11,'nanny1@example.com','hash11','María','López','6690000011','Calle N1','nanny',1,1,NULL,NOW(),NOW()),
(12,'nanny2@example.com','hash12','Carmen','Hernández','6690000012','Calle N2','nanny',1,1,NULL,NOW(),NOW()),
(13,'nanny3@example.com','hash13','Verónica','Sánchez','6690000013','Calle N3','nanny',1,1,NULL,NOW(),NOW()),
(14,'nanny4@example.com','hash14','Patricia','Gómez','6690000014','Calle N4','nanny',1,1,NULL,NOW(),NOW()),
(15,'nanny5@example.com','hash15','Elena','Ramos','6690000015','Calle N5','nanny',1,1,NULL,NOW(),NOW()),
(16,'nanny6@example.com','hash16','Isabel','Castro','6690000016','Calle N6','nanny',1,1,NULL,NOW(),NOW()),
(17,'nanny7@example.com','hash17','Andrea','Navarro','6690000017','Calle N7','nanny',1,1,NULL,NOW(),NOW()),
(18,'nanny8@example.com','hash18','Claudia','Herrera','6690000018','Calle N8','nanny',1,1,NULL,NOW(),NOW()),
(19,'nanny9@example.com','hash19','Rosa','Mendez','6690000019','Calle N9','nanny',1,1,NULL,NOW(),NOW()),
(20,'nanny10@example.com','hash20','Anaí','Diaz','6690000020','Calle N10','nanny',1,1,NULL,NOW(),NOW());

-- Clients (id 1..10) -> user_id 1..10
INSERT INTO clients (id,user_id,identification_document,verification_status,verification_date,emergency_contact_name,emergency_contact_phone,number_of_children,special_requirements,created_at)
VALUES
(1,1,'uploads/id_1.pdf','verified','2025-01-10 10:00:00','Marta Ruiz','6691110001',1,'Ninguna',NOW()),
(2,2,'uploads/id_2.pdf','pending',NULL,'Raúl Pérez','6691110002',2,'Alergia a nueces',NOW()),
(3,3,'uploads/id_3.pdf','verified','2025-02-15 14:30:00','Ana Torres','6691110003',1,NULL,NOW()),
(4,4,'uploads/id_4.pdf','rejected',NULL,'Luis Moreno','6691110004',3,'Necesita silla alta',NOW()),
(5,5,'uploads/id_5.pdf','verified','2025-03-20 09:00:00','Clara Ruiz','6691110005',2,NULL,NOW()),
(6,6,'uploads/id_6.pdf','pending',NULL,'Pedro Salas','6691110006',1,'Alergia a lactosa',NOW()),
(7,7,'uploads/id_7.pdf','verified','2025-04-05 11:15:00','Ana Gómez','6691110007',2,NULL,NOW()),
(8,8,'uploads/id_8.pdf','verified','2025-05-12 16:00:00','Rosa Blanco','6691110008',4,NULL,NOW()),
(9,9,'uploads/id_9.pdf','pending',NULL,'Sergio Ruiz','6691110009',1,NULL,NOW()),
(10,10,'uploads/id_10.pdf','verified','2025-06-01 08:45:00','Laura Peña','6691110010',3,'Necesita medicación puntual',NOW());

-- Nannys (id 1..10) -> user_id 11..20
INSERT INTO nannys (id,user_id,description,experience_years,hourly_rate,rating_average,total_ratings,services_completed,status,created_at)
VALUES
(1,11,'Especialista en bebés y primeros auxilios',5,120.00,4.8,24,150,'active',NOW()),
(2,12,'Niñera con enfoque educativo',3,100.00,4.6,18,80,'active',NOW()),
(3,13,'Experiencia con niños con necesidades especiales',7,150.00,4.9,40,220,'active',NOW()),
(4,14,'Disponible fines de semana',4,110.00,4.4,12,60,'active',NOW()),
(5,15,'Cuidado nocturno y viajes',6,180.00,4.7,30,140,'active',NOW()),
(6,16,'Tutora y cuidado escolar',2,90.00,4.2,8,30,'active',NOW()),
(7,17,'Niñera bilingüe (es/en)',8,160.00,4.85,50,300,'active',NOW()),
(8,18,'Pediatra certificada (asistente)',10,200.00,5.00,75,500,'active',NOW()),
(9,19,'Experiencia en actividades al aire libre',3,95.00,4.1,6,25,'active',NOW()),
(10,20,'Cuidadora flexible por horas',1,80.00,3.9,3,10,'active',NOW());

-- Services (id 1..10) -> client_id 1..10, nanny_id 1..10
INSERT INTO services (id,client_id,nanny_id,title,service_type,description,start_date,end_date,start_time,end_time,total_hours,total_amount,number_of_children,special_instructions,address,status,created_at)
VALUES
(1,1,1,'Tarde entre semana','hourly','Cuidado de 2 niños después de la escuela','2025-11-05',NULL,'15:00:00','19:00:00',4.00,480.00,2,'Dar merienda','Calle 1 #10','completed',NOW()),
(2,2,2,'Cuidado por la mañana','hourly','Media jornada por la mañana','2025-11-06',NULL,'08:00:00','12:00:00',4.00,400.00,1,NULL,'Calle 2 #22','completed',NOW()),
(3,3,3,'Noche especial','overnight','Cuidado nocturno','2025-11-15','2025-11-16','22:00:00','08:00:00',10.00,1500.00,1,NULL,'Av. Secundaria 45','confirmed',NOW()),
(4,4,4,'Cumpleaños (evento)','event','Cuidado durante fiesta infantil','2025-12-01',NULL,'10:00:00','14:00:00',4.00,440.00,3,'Supervisar juegos','Calle 4 #5','completed',NOW()),
(5,5,5,'Semana intensiva','daily','Cuidado diario por 5 días','2025-11-10','2025-11-14','09:00:00','17:00:00',40.00,7200.00,2,NULL,'Calle 5 #100','in_progress',NOW()),
(6,6,6,'Clases y cuidado','hourly','Apoyo con tareas y cuidado','2025-11-07',NULL,'15:00:00','18:00:00',3.00,270.00,1,NULL,'Calle 6 #6','pending',NOW()),
(7,7,7,'Viaje familiar','travel','Cuidado durante viaje de fin de semana','2025-12-20','2025-12-22','08:00:00','20:00:00',36.00,5760.00,2,NULL,'Ruta 7 km 12','pending',NOW()),
(8,8,8,'Cuidado por horas','hourly','Servicio por horas según necesidad','2025-11-09',NULL,'13:00:00','17:00:00',4.00,800.00,2,NULL,'Calle 8 #8','confirmed',NOW()),
(9,9,9,'Clases de apoyo','hourly','Apoyo escolar y tareas','2025-11-11',NULL,'16:00:00','19:00:00',3.00,285.00,1,NULL,'Calle 9 #9','completed',NOW()),
(10,10,10,'Tarde puntual','hourly','Cuidado puntual por emergencia','2025-11-12',NULL,'18:00:00','21:00:00',3.00,240.00,1,NULL,'Calle 10 #10','completed',NOW());

-- Ratings (id 1..10) -> service_id 1..10
INSERT INTO ratings (id,service_id,client_id,nanny_id,rating,review,punctuality_rating,communication_rating,care_quality_rating,would_recommend,created_at)
VALUES
(1,1,1,1,4.5,'Muy profesional y cariñosa',5,5,4,1,NOW()),
(2,2,2,2,4.0,'Cuidó muy bien al niño',4,4,4,1,NOW()),
(3,3,3,3,5.0,'Excelente atención nocturna',5,5,5,1,NOW()),
(4,4,4,4,4.2,'Buen manejo en evento',4,4,4,1,NOW()),
(5,5,5,5,4.7,'Cumplió con todo lo solicitado',5,5,4,1,NOW()),
(6,6,6,6,3.8,'Necesita mejorar comunicación',3,3,4,0,NOW()),
(7,7,7,7,4.9,'Muy puntual y didáctica',5,5,5,1,NOW()),
(8,8,8,8,5.0,'Excelente profesional',5,5,5,1,NOW()),
(9,9,9,9,4.1,'Buen apoyo escolar',4,4,4,1,NOW()),
(10,10,10,10,3.9,'Atención aceptable',4,3,4,1,NOW());

-- Payments (id 1..10) -> service_id 1..10
INSERT INTO payments (id,service_id,client_id,nanny_id,amount,payment_status,transaction_id,platform_fee,nanny_amount,payment_date,receipt_url,created_at)
VALUES
(1,1,1,1,480.00,'completed','TXN001',48.00,432.00,'2025-11-05 19:05:00','/receipts/txn001.pdf',NOW()),
(2,2,2,2,400.00,'completed','TXN002',40.00,360.00,'2025-11-06 12:05:00','/receipts/txn002.pdf',NOW()),
(3,3,3,3,1500.00,'processing','TXN003',150.00,1350.00,NULL,NULL,NOW()),
(4,4,4,4,440.00,'completed','TXN004',44.00,396.00,'2025-12-01 14:30:00','/receipts/txn004.pdf',NOW()),
(5,5,5,5,7200.00,'pending','TXN005',720.00,6480.00,NULL,NULL,NOW()),
(6,6,6,6,270.00,'completed','TXN006',27.00,243.00,'2025-11-07 18:30:00','/receipts/txn006.pdf',NOW()),
(7,7,7,7,5760.00,'pending','TXN007',576.00,5184.00,NULL,NULL,NOW()),
(8,8,8,8,800.00,'completed','TXN008',80.00,720.00,'2025-11-09 17:00:00','/receipts/txn008.pdf',NOW()),
(9,9,9,9,285.00,'completed','TXN009',28.50,256.50,'2025-11-11 19:10:00','/receipts/txn009.pdf',NOW()),
(10,10,10,10,240.00,'completed','TXN010',24.00,216.00,'2025-11-12 21:05:00','/receipts/txn010.pdf',NOW());

-- Bank details (solo 1) -> nanny_id 1
INSERT INTO bank_details (id,nanny_id,account_holder_name,bank_name,account_number,clabe,account_type,is_primary,is_active,created_at)
VALUES
(1,1,'María López','BBVA','0123456789','012345678901234567','checking',1,1,NOW());

-- Notifications (id 1..10) -> user_id (mix clients and nannys)
INSERT INTO notifications (id,user_id,title,message,type,is_read,action_url,related_id,related_type,created_at)
VALUES
(1,1,'Servicio completado','Tu servicio "Tarde entre semana" fue completado','success',0,'/services/1',1,'service',NOW()),
(2,2,'Nueva confirmación','Tu servicio fue confirmado por la niñera','info',0,'/services/2',2,'service',NOW()),
(3,11,'Nueva solicitud','Tienes una nueva solicitud de servicio','service',0,'/services/3',3,'service',NOW()),
(4,5,'Verificación requerida','Sube tu identificación para verificar tu cuenta','warning',0,'/profile/documents',NULL,NULL,NOW()),
(5,8,'Pago recibido','Tu pago ha sido procesado correctamente','payment',0,'/payments/1',1,'payment',NOW()),
(6,12,'Mensaje nuevo','Has recibido un mensaje de un cliente','info',0,'/messages',NULL,NULL,NOW()),
(7,3,'Recordatorio','Recordatorio: servicio mañana a las 15:00','info',0,'/services/6',6,'service',NOW()),
(8,15,'Cuenta verificada','Tu cuenta ha sido verificada con éxito','success',0,'/profile',NULL,NULL,NOW()),
(9,9,'Encuesta','Por favor califica el servicio reciente','info',0,'/ratings/1',1,'service',NOW()),
(10,20,'Sistema','Mantenimiento programado el domingo','warning',0,NULL,NULL,NULL,NOW());

-- Client favorites (id 1..10) -> client_id 1..10, nanny_id various (unique pairs)
INSERT INTO client_favorites (id,client_id,nanny_id,created_at)
VALUES
(1,1,1,NOW()),
(2,2,2,NOW()),
(3,3,3,NOW()),
(4,4,4,NOW()),
(5,5,5,NOW()),
(6,6,6,NOW()),
(7,7,7,NOW()),
(8,8,8,NOW()),
(9,9,9,NOW()),
(10,10,10,NOW());

-- Nanny availability (id 1..10) -> nanny_id 1..10
INSERT INTO nanny_availability (id,nanny_id,date,start_time,end_time,is_available,reason,created_at)
VALUES
(1,1,'2025-11-06','09:00:00','17:00:00',1,NULL,NOW()),
(2,2,'2025-11-06','08:00:00','12:00:00',1,NULL,NOW()),
(3,3,'2025-11-15','22:00:00','08:00:00',1,NULL,NOW()),
(4,4,'2025-12-01','10:00:00','14:00:00',1,NULL,NOW()),
(5,5,'2025-11-10','09:00:00','17:00:00',0,'Vacaciones',NOW()),
(6,6,'2025-11-07','15:00:00','18:00:00',1,NULL,NOW()),
(7,7,'2025-12-20','08:00:00','20:00:00',0,'Viaje',NOW()),
(8,8,'2025-11-09','13:00:00','17:00:00',1,NULL,NOW()),
(9,9,'2025-11-11','16:00:00','19:00:00',1,NULL,NOW()),
(10,10,'2025-11-12','18:00:00','21:00:00',1,NULL,NOW());

JSON

{
  "users": [
    {"id":1,"email":"client1@example.com","password_hash":"hash1","first_name":"Ana","last_name":"Gonzalez","phone_number":"6690000001","address":"Calle 1","user_type":"client","is_verified":true,"is_active":true,"profile_image":null,"created_at":"2025-01-01T00:00:00Z"},
    {"id":2,"email":"client2@example.com","password_hash":"hash2","first_name":"Luis","last_name":"Martinez","phone_number":"6690000002","address":"Calle 2","user_type":"client","is_verified":true,"is_active":true,"profile_image":null,"created_at":"2025-01-02T00:00:00Z"},
    {"id":3,"email":"client3@example.com","password_hash":"hash3","first_name":"María","last_name":"Pérez","phone_number":"6690000003","address":"Calle 3","user_type":"client","is_verified":false,"is_active":true,"profile_image":null,"created_at":"2025-01-03T00:00:00Z"},
    {"id":4,"email":"client4@example.com","password_hash":"hash4","first_name":"Carlos","last_name":"Ruiz","phone_number":"6690000004","address":"Calle 4","user_type":"client","is_verified":true,"is_active":true,"profile_image":null,"created_at":"2025-01-04T00:00:00Z"},
    {"id":5,"email":"client5@example.com","password_hash":"hash5","first_name":"Sofía","last_name":"Ramirez","phone_number":"6690000005","address":"Calle 5","user_type":"client","is_verified":false,"is_active":true,"profile_image":null,"created_at":"2025-01-05T00:00:00Z"},
    {"id":6,"email":"client6@example.com","password_hash":"hash6","first_name":"Diego","last_name":"Flores","phone_number":"6690000006","address":"Calle 6","user_type":"client","is_verified":true,"is_active":true,"profile_image":null,"created_at":"2025-01-06T00:00:00Z"},
    {"id":7,"email":"client7@example.com","password_hash":"hash7","first_name":"Lucía","last_name":"Santos","phone_number":"6690000007","address":"Calle 7","user_type":"client","is_verified":true,"is_active":true,"profile_image":null,"created_at":"2025-01-07T00:00:00Z"},
    {"id":8,"email":"client8@example.com","password_hash":"hash8","first_name":"Miguel","last_name":"Ortega","phone_number":"6690000008","address":"Calle 8","user_type":"client","is_verified":false,"is_active":true,"profile_image":null,"created_at":"2025-01-08T00:00:00Z"},
    {"id":9,"email":"client9@example.com","password_hash":"hash9","first_name":"Paula","last_name":"Vega","phone_number":"6690000009","address":"Calle 9","user_type":"client","is_verified":true,"is_active":true,"profile_image":null,"created_at":"2025-01-09T00:00:00Z"},
    {"id":10,"email":"client10@example.com","password_hash":"hash10","first_name":"Jorge","last_name":"Molina","phone_number":"6690000010","address":"Calle 10","user_type":"client","is_verified":true,"is_active":true,"profile_image":null,"created_at":"2025-01-10T00:00:00Z"},
    {"id":11,"email":"nanny1@example.com","password_hash":"hash11","first_name":"María","last_name":"López","phone_number":"6690000011","address":"Calle N1","user_type":"nanny","is_verified":true,"is_active":true,"profile_image":null,"created_at":"2025-01-11T00:00:00Z"},
    {"id":12,"email":"nanny2@example.com","password_hash":"hash12","first_name":"Carmen","last_name":"Hernández","phone_number":"6690000012","address":"Calle N2","user_type":"nanny","is_verified":true,"is_active":true,"profile_image":null,"created_at":"2025-01-12T00:00:00Z"},
    {"id":13,"email":"nanny3@example.com","password_hash":"hash13","first_name":"Verónica","last_name":"Sánchez","phone_number":"6690000013","address":"Calle N3","user_type":"nanny","is_verified":true,"is_active":true,"profile_image":null,"created_at":"2025-01-13T00:00:00Z"},
    {"id":14,"email":"nanny4@example.com","password_hash":"hash14","first_name":"Patricia","last_name":"Gómez","phone_number":"6690000014","address":"Calle N4","user_type":"nanny","is_verified":true,"is_active":true,"profile_image":null,"created_at":"2025-01-14T00:00:00Z"},
    {"id":15,"email":"nanny5@example.com","password_hash":"hash15","first_name":"Elena","last_name":"Ramos","phone_number":"6690000015","address":"Calle N5","user_type":"nanny","is_verified":true,"is_active":true,"profile_image":null,"created_at":"2025-01-15T00:00:00Z"},
    {"id":16,"email":"nanny6@example.com","password_hash":"hash16","first_name":"Isabel","last_name":"Castro","phone_number":"6690000016","address":"Calle N6","user_type":"nanny","is_verified":true,"is_active":true,"profile_image":null,"created_at":"2025-01-16T00:00:00Z"},
    {"id":17,"email":"nanny7@example.com","password_hash":"hash17","first_name":"Andrea","last_name":"Navarro","phone_number":"6690000017","address":"Calle N7","user_type":"nanny","is_verified":true,"is_active":true,"profile_image":null,"created_at":"2025-01-17T00:00:00Z"},
    {"id":18,"email":"nanny8@example.com","password_hash":"hash18","first_name":"Claudia","last_name":"Herrera","phone_number":"6690000018","address":"Calle N8","user_type":"nanny","is_verified":true,"is_active":true,"profile_image":null,"created_at":"2025-01-18T00:00:00Z"},
    {"id":19,"email":"nanny9@example.com","password_hash":"hash19","first_name":"Rosa","last_name":"Mendez","phone_number":"6690000019","address":"Calle N9","user_type":"nanny","is_verified":true,"is_active":true,"profile_image":null,"created_at":"2025-01-19T00:00:00Z"},
    {"id":20,"email":"nanny10@example.com","password_hash":"hash20","first_name":"Anaí","last_name":"Diaz","phone_number":"6690000020","address":"Calle N10","user_type":"nanny","is_verified":true,"is_active":true,"profile_image":null,"created_at":"2025-01-20T00:00:00Z"}
  ],
  "clients": [
    {"id":1,"user_id":1,"identification_document":"uploads/id_1.pdf","verification_status":"verified","verification_date":"2025-01-10T10:00:00Z","emergency_contact_name":"Marta Ruiz","emergency_contact_phone":"6691110001","number_of_children":1,"special_requirements":"Ninguna","created_at":"2025-01-10T10:00:00Z"},
    {"id":2,"user_id":2,"identification_document":"uploads/id_2.pdf","verification_status":"pending","verification_date":null,"emergency_contact_name":"Raúl Pérez","emergency_contact_phone":"6691110002","number_of_children":2,"special_requirements":"Alergia a nueces","created_at":"2025-01-11T10:00:00Z"},
    {"id":3,"user_id":3,"identification_document":"uploads/id_3.pdf","verification_status":"verified","verification_date":"2025-02-15T14:30:00Z","emergency_contact_name":"Ana Torres","emergency_contact_phone":"6691110003","number_of_children":1,"special_requirements":null,"created_at":"2025-02-15T14:30:00Z"},
    {"id":4,"user_id":4,"identification_document":"uploads/id_4.pdf","verification_status":"rejected","verification_date":null,"emergency_contact_name":"Luis Moreno","emergency_contact_phone":"6691110004","number_of_children":3,"special_requirements":"Necesita silla alta","created_at":"2025-03-01T09:00:00Z"},
    {"id":5,"user_id":5,"identification_document":"uploads/id_5.pdf","verification_status":"verified","verification_date":"2025-03-20T09:00:00Z","emergency_contact_name":"Clara Ruiz","emergency_contact_phone":"6691110005","number_of_children":2,"special_requirements":null,"created_at":"2025-03-20T09:00:00Z"},
    {"id":6,"user_id":6,"identification_document":"uploads/id_6.pdf","verification_status":"pending","verification_date":null,"emergency_contact_name":"Pedro Salas","emergency_contact_phone":"6691110006","number_of_children":1,"special_requirements":"Alergia a lactosa","created_at":"2025-04-01T11:00:00Z"},
    {"id":7,"user_id":7,"identification_document":"uploads/id_7.pdf","verification_status":"verified","verification_date":"2025-04-05T11:15:00Z","emergency_contact_name":"Ana Gómez","emergency_contact_phone":"6691110007","number_of_children":2,"special_requirements":null,"created_at":"2025-04-05T11:15:00Z"},
    {"id":8,"user_id":8,"identification_document":"uploads/id_8.pdf","verification_status":"verified","verification_date":"2025-05-12T16:00:00Z","emergency_contact_name":"Rosa Blanco","emergency_contact_phone":"6691110008","number_of_children":4,"special_requirements":null,"created_at":"2025-05-12T16:00:00Z"},
    {"id":9,"user_id":9,"identification_document":"uploads/id_9.pdf","verification_status":"pending","verification_date":null,"emergency_contact_name":"Sergio Ruiz","emergency_contact_phone":"6691110009","number_of_children":1,"special_requirements":null,"created_at":"2025-05-20T10:00:00Z"},
    {"id":10,"user_id":10,"identification_document":"uploads/id_10.pdf","verification_status":"verified","verification_date":"2025-06-01T08:45:00Z","emergency_contact_name":"Laura Peña","emergency_contact_phone":"6691110010","number_of_children":3,"special_requirements":"Necesita medicación puntual","created_at":"2025-06-01T08:45:00Z"}
  ],
  "nannys": [
    {"id":1,"user_id":11,"description":"Especialista en bebés y primeros auxilios","experience_years":5,"hourly_rate":120.00,"rating_average":4.8,"total_ratings":24,"services_completed":150,"status":"active","created_at":"2025-01-11T00:00:00Z"},
    {"id":2,"user_id":12,"description":"Niñera con enfoque educativo","experience_years":3,"hourly_rate":100.00,"rating_average":4.6,"total_ratings":18,"services_completed":80,"status":"active","created_at":"2025-01-12T00:00:00Z"},
    {"id":3,"user_id":13,"description":"Experiencia con niños con necesidades especiales","experience_years":7,"hourly_rate":150.00,"rating_average":4.9,"total_ratings":40,"services_completed":220,"status":"active","created_at":"2025-01-13T00:00:00Z"},
    {"id":4,"user_id":14,"description":"Disponible fines de semana","experience_years":4,"hourly_rate":110.00,"rating_average":4.4,"total_ratings":12,"services_completed":60,"status":"active","created_at":"2025-01-14T00:00:00Z"},
    {"id":5,"user_id":15,"description":"Cuidado nocturno y viajes","experience_years":6,"hourly_rate":180.00,"rating_average":4.7,"total_ratings":30,"services_completed":140,"status":"active","created_at":"2025-01-15T00:00:00Z"},
    {"id":6,"user_id":16,"description":"Tutora y cuidado escolar","experience_years":2,"hourly_rate":90.00,"rating_average":4.2,"total_ratings":8,"services_completed":30,"status":"active","created_at":"2025-01-16T00:00:00Z"},
    {"id":7,"user_id":17,"description":"Niñera bilingüe (es/en)","experience_years":8,"hourly_rate":160.00,"rating_average":4.85,"total_ratings":50,"services_completed":300,"status":"active","created_at":"2025-01-17T00:00:00Z"},
    {"id":8,"user_id":18,"description":"Pediatra certificada (asistente)","experience_years":10,"hourly_rate":200.00,"rating_average":5.00,"total_ratings":75,"services_completed":500,"status":"active","created_at":"2025-01-18T00:00:00Z"},
    {"id":9,"user_id":19,"description":"Experiencia en actividades al aire libre","experience_years":3,"hourly_rate":95.00,"rating_average":4.1,"total_ratings":6,"services_completed":25,"status":"active","created_at":"2025-01-19T00:00:00Z"},
    {"id":10,"user_id":20,"description":"Cuidadora flexible por horas","experience_years":1,"hourly_rate":80.00,"rating_average":3.9,"total_ratings":3,"services_completed":10,"status":"active","created_at":"2025-01-20T00:00:00Z"}
  ],
  "services": [
    {"id":1,"client_id":1,"nanny_id":1,"title":"Tarde entre semana","service_type":"hourly","description":"Cuidado de 2 niños después de la escuela","start_date":"2025-11-05","end_date":null,"start_time":"15:00:00","end_time":"19:00:00","total_hours":4.00,"total_amount":480.00,"number_of_children":2,"special_instructions":"Dar merienda","address":"Calle 1 #10","status":"completed","created_at":"2025-11-05T15:00:00Z"},
    {"id":2,"client_id":2,"nanny_id":2,"title":"Cuidado por la mañana","service_type":"hourly","description":"Media jornada por la mañana","start_date":"2025-11-06","end_date":null,"start_time":"08:00:00","end_time":"12:00:00","total_hours":4.00,"total_amount":400.00,"number_of_children":1,"special_instructions":null,"address":"Calle 2 #22","status":"completed","created_at":"2025-11-06T08:00:00Z"},
    {"id":3,"client_id":3,"nanny_id":3,"title":"Noche especial","service_type":"overnight","description":"Cuidado nocturno","start_date":"2025-11-15","end_date":"2025-11-16","start_time":"22:00:00","end_time":"08:00:00","total_hours":10.00,"total_amount":1500.00,"number_of_children":1,"special_instructions":null,"address":"Av. Secundaria 45","status":"confirmed","created_at":"2025-11-15T22:00:00Z"},
    {"id":4,"client_id":4,"nanny_id":4,"title":"Cumpleaños (evento)","service_type":"event","description":"Cuidado durante fiesta infantil","start_date":"2025-12-01","end_date":null,"start_time":"10:00:00","end_time":"14:00:00","total_hours":4.00,"total_amount":440.00,"number_of_children":3,"special_instructions":"Supervisar juegos","address":"Calle 4 #5","status":"completed","created_at":"2025-12-01T10:00:00Z"},
    {"id":5,"client_id":5,"nanny_id":5,"title":"Semana intensiva","service_type":"daily","description":"Cuidado diario por 5 días","start_date":"2025-11-10","end_date":"2025-11-14","start_time":"09:00:00","end_time":"17:00:00","total_hours":40.00,"total_amount":7200.00,"number_of_children":2,"special_instructions":null,"address":"Calle 5 #100","status":"in_progress","created_at":"2025-11-10T09:00:00Z"},
    {"id":6,"client_id":6,"nanny_id":6,"title":"Clases y cuidado","service_type":"hourly","description":"Apoyo con tareas y cuidado","start_date":"2025-11-07","end_date":null,"start_time":"15:00:00","end_time":"18:00:00","total_hours":3.00,"total_amount":270.00,"number_of_children":1,"special_instructions":null,"address":"Calle 6 #6","status":"pending","created_at":"2025-11-07T15:00:00Z"},
    {"id":7,"client_id":7,"nanny_id":7,"title":"Viaje familiar","service_type":"travel","description":"Cuidado durante viaje de fin de semana","start_date":"2025-12-20","end_date":"2025-12-22","start_time":"08:00:00","end_time":"20:00:00","total_hours":36.00,"total_amount":5760.00,"number_of_children":2,"special_instructions":null,"address":"Ruta 7 km 12","status":"pending","created_at":"2025-12-20T08:00:00Z"},
    {"id":8,"client_id":8,"nanny_id":8,"title":"Cuidado por horas","service_type":"hourly","description":"Servicio por horas según necesidad","start_date":"2025-11-09","end_date":null,"start_time":"13:00:00","end_time":"17:00:00","total_hours":4.00,"total_amount":800.00,"number_of_children":2,"special_instructions":null,"address":"Calle 8 #8","status":"confirmed","created_at":"2025-11-09T13:00:00Z"},
    {"id":9,"client_id":9,"nanny_id":9,"title":"Clases de apoyo","service_type":"hourly","description":"Apoyo escolar y tareas","start_date":"2025-11-11","end_date":null,"start_time":"16:00:00","end_time":"19:00:00","total_hours":3.00,"total_amount":285.00,"number_of_children":1,"special_instructions":null,"address":"Calle 9 #9","status":"completed","created_at":"2025-11-11T16:00:00Z"},
    {"id":10,"client_id":10,"nanny_id":10,"title":"Tarde puntual","service_type":"hourly","description":"Cuidado puntual por emergencia","start_date":"2025-11-12","end_date":null,"start_time":"18:00:00","end_time":"21:00:00","total_hours":3.00,"total_amount":240.00,"number_of_children":1,"special_instructions":null,"address":"Calle 10 #10","status":"completed","created_at":"2025-11-12T18:00:00Z"}
  ],
  "ratings": [
    {"id":1,"service_id":1,"client_id":1,"nanny_id":1,"rating":4.5,"review":"Muy profesional y cariñosa","punctuality_rating":5,"communication_rating":5,"care_quality_rating":4,"would_recommend":true,"created_at":"2025-11-05T19:10:00Z"},
    {"id":2,"service_id":2,"client_id":2,"nanny_id":2,"rating":4.0,"review":"Cuidó muy bien al niño","punctuality_rating":4,"communication_rating":4,"care_quality_rating":4,"would_recommend":true,"created_at":"2025-11-06T12:10:00Z"},
    {"id":3,"service_id":3,"client_id":3,"nanny_id":3,"rating":5.0,"review":"Excelente atención nocturna","punctuality_rating":5,"communication_rating":5,"care_quality_rating":5,"would_recommend":true,"created_at":"2025-11-16T08:10:00Z"},
    {"id":4,"service_id":4,"client_id":4,"nanny_id":4,"rating":4.2,"review":"Buen manejo en evento","punctuality_rating":4,"communication_rating":4,"care_quality_rating":4,"would_recommend":true,"created_at":"2025-12-01T14:40:00Z"},
    {"id":5,"service_id":5,"client_id":5,"nanny_id":5,"rating":4.7,"review":"Cumplió con todo lo solicitado","punctuality_rating":5,"communication_rating":5,"care_quality_rating":4,"would_recommend":true,"created_at":"2025-11-14T17:10:00Z"},
    {"id":6,"service_id":6,"client_id":6,"nanny_id":6,"rating":3.8,"review":"Necesita mejorar comunicación","punctuality_rating":3,"communication_rating":3,"care_quality_rating":4,"would_recommend":false,"created_at":"2025-11-07T18:35:00Z"},
    {"id":7,"service_id":7,"client_id":7,"nanny_id":7,"rating":4.9,"review":"Muy puntual y didáctica","punctuality_rating":5,"communication_rating":5,"care_quality_rating":5,"would_recommend":true,"created_at":"2025-12-22T20:10:00Z"},
    {"id":8,"service_id":8,"client_id":8,"nanny_id":8,"rating":5.0,"review":"Excelente profesional","punctuality_rating":5,"communication_rating":5,"care_quality_rating":5,"would_recommend":true,"created_at":"2025-11-09T17:05:00Z"},
    {"id":9,"service_id":9,"client_id":9,"nanny_id":9,"rating":4.1,"review":"Buen apoyo escolar","punctuality_rating":4,"communication_rating":4,"care_quality_rating":4,"would_recommend":true,"created_at":"2025-11-11T19:15:00Z"},
    {"id":10,"service_id":10,"client_id":10,"nanny_id":10,"rating":3.9,"review":"Atención aceptable","punctuality_rating":4,"communication_rating":3,"care_quality_rating":4,"would_recommend":true,"created_at":"2025-11-12T21:10:00Z"}
  ],
  "payments": [
    {"id":1,"service_id":1,"client_id":1,"nanny_id":1,"amount":480.00,"payment_status":"completed","transaction_id":"TXN001","platform_fee":48.00,"nanny_amount":432.00,"payment_date":"2025-11-05T19:05:00Z","receipt_url":"/receipts/txn001.pdf","created_at":"2025-11-05T19:05:00Z"},
    {"id":2,"service_id":2,"client_id":2,"nanny_id":2,"amount":400.00,"payment_status":"completed","transaction_id":"TXN002","platform_fee":40.00,"nanny_amount":360.00,"payment_date":"2025-11-06T12:05:00Z","receipt_url":"/receipts/txn002.pdf","created_at":"2025-11-06T12:05:00Z"},
    {"id":3,"service_id":3,"client_id":3,"nanny_id":3,"amount":1500.00,"payment_status":"processing","transaction_id":"TXN003","platform_fee":150.00,"nanny_amount":1350.00,"payment_date":null,"receipt_url":null,"created_at":"2025-11-15T22:10:00Z"},
    {"id":4,"service_id":4,"client_id":4,"nanny_id":4,"amount":440.00,"payment_status":"completed","transaction_id":"TXN004","platform_fee":44.00,"nanny_amount":396.00,"payment_date":"2025-12-01T14:30:00Z","receipt_url":"/receipts/txn004.pdf","created_at":"2025-12-01T14:30:00Z"},
    {"id":5,"service_id":5,"client_id":5,"nanny_id":5,"amount":7200.00,"payment_status":"pending","transaction_id":"TXN005","platform_fee":720.00,"nanny_amount":6480.00,"payment_date":null,"receipt_url":null,"created_at":"2025-11-14T17:20:00Z"},
    {"id":6,"service_id":6,"client_id":6,"nanny_id":6,"amount":270.00,"payment_status":"completed","transaction_id":"TXN006","platform_fee":27.00,"nanny_amount":243.00,"payment_date":"2025-11-07T18:30:00Z","receipt_url":"/receipts/txn006.pdf","created_at":"2025-11-07T18:30:00Z"},
    {"id":7,"service_id":7,"client_id":7,"nanny_id":7,"amount":5760.00,"payment_status":"pending","transaction_id":"TXN007","platform_fee":576.00,"nanny_amount":5184.00,"payment_date":null,"receipt_url":null,"created_at":"2025-12-22T20:20:00Z"},
    {"id":8,"service_id":8,"client_id":8,"nanny_id":8,"amount":800.00,"payment_status":"completed","transaction_id":"TXN008","platform_fee":80.00,"nanny_amount":720.00,"payment_date":"2025-11-09T17:00:00Z","receipt_url":"/receipts/txn008.pdf","created_at":"2025-11-09T17:00:00Z"},
    {"id":9,"service_id":9,"client_id":9,"nanny_id":9,"amount":285.00,"payment_status":"completed","transaction_id":"TXN009","platform_fee":28.50,"nanny_amount":256.50,"payment_date":"2025-11-11T19:10:00Z","receipt_url":"/receipts/txn009.pdf","created_at":"2025-11-11T19:10:00Z"},
    {"id":10,"service_id":10,"client_id":10,"nanny_id":10,"amount":240.00,"payment_status":"completed","transaction_id":"TXN010","platform_fee":24.00,"nanny_amount":216.00,"payment_date":"2025-11-12T21:05:00Z","receipt_url":"/receipts/txn010.pdf","created_at":"2025-11-12T21:05:00Z"}
  ],
  "bank_details": [
    {"id":1,"nanny_id":1,"account_holder_name":"María López","bank_name":"BBVA","account_number":"0123456789","clabe":"012345678901234567","account_type":"checking","is_primary":true,"is_active":true,"created_at":"2025-01-11T00:00:00Z"}
  ],
  "notifications": [
    {"id":1,"user_id":1,"title":"Servicio completado","message":"Tu servicio \"Tarde entre semana\" fue completado","type":"success","is_read":false,"action_url":"/services/1","related_id":1,"related_type":"service","created_at":"2025-11-05T19:12:00Z"},
    {"id":2,"user_id":2,"title":"Nueva confirmación","message":"Tu servicio fue confirmado por la niñera","type":"info","is_read":false,"action_url":"/services/2","related_id":2,"related_type":"service","created_at":"2025-11-06T12:12:00Z"},
    {"id":3,"user_id":11,"title":"Nueva solicitud","message":"Tienes una nueva solicitud de servicio","type":"service","is_read":false,"action_url":"/services/3","related_id":3,"related_type":"service","created_at":"2025-11-15T22:15:00Z"},
    {"id":4,"user_id":5,"title":"Verificación requerida","message":"Sube tu identificación para verificar tu cuenta","type":"warning","is_read":false,"action_url":"/profile/documents","related_id":null,"related_type":null,"created_at":"2025-03-20T09:05:00Z"},
    {"id":5,"user_id":8,"title":"Pago recibido","message":"Tu pago ha sido procesado correctamente","type":"payment","is_read":false,"action_url":"/payments/1","related_id":1,"related_type":"payment","created_at":"2025-11-05T19:07:00Z"},
    {"id":6,"user_id":12,"title":"Mensaje nuevo","message":"Has recibido un mensaje de un cliente","type":"info","is_read":false,"action_url":"/messages","related_id":null,"related_type":null,"created_at":"2025-11-06T13:00:00Z"},
    {"id":7,"user_id":3,"title":"Recordatorio","message":"Recordatorio: servicio mañana a las 15:00","type":"info","is_read":false,"action_url":"/services/6","related_id":6,"related_type":"service","created_at":"2025-11-06T10:00:00Z"},
    {"id":8,"user_id":15,"title":"Cuenta verificada","message":"Tu cuenta ha sido verificada con éxito","type":"success","is_read":false,"action_url":"/profile","related_id":null,"related_type":null,"created_at":"2025-01-15T09:00:00Z"},
    {"id":9,"user_id":9,"title":"Encuesta","message":"Por favor califica el servicio reciente","type":"info","is_read":false,"action_url":"/ratings/1","related_id":1,"related_type":"service","created_at":"2025-11-05T20:00:00Z"},
    {"id":10,"user_id":20,"title":"Sistema","message":"Mantenimiento programado el domingo","type":"warning","is_read":false,"action_url":null,"related_id":null,"related_type":null,"created_at":"2025-10-28T00:00:00Z"}
  ],
  "client_favorites": [
    {"id":1,"client_id":1,"nanny_id":1,"created_at":"2025-01-20T00:00:00Z"},
    {"id":2,"client_id":2,"nanny_id":2,"created_at":"2025-01-21T00:00:00Z"},
    {"id":3,"client_id":3,"nanny_id":3,"created_at":"2025-01-22T00:00:00Z"},
    {"id":4,"client_id":4,"nanny_id":4,"created_at":"2025-01-23T00:00:00Z"},
    {"id":5,"client_id":5,"nanny_id":5,"created_at":"2025-01-24T00:00:00Z"},
    {"id":6,"client_id":6,"nanny_id":6,"created_at":"2025-01-25T00:00:00Z"},
    {"id":7,"client_id":7,"nanny_id":7,"created_at":"2025-01-26T00:00:00Z"},
    {"id":8,"client_id":8,"nanny_id":8,"created_at":"2025-01-27T00:00:00Z"},
    {"id":9,"client_id":9,"nanny_id":9,"created_at":"2025-01-28T00:00:00Z"},
    {"id":10,"client_id":10,"nanny_id":10,"created_at":"2025-01-29T00:00:00Z"}
  ],
  "nanny_availability": [
    {"id":1,"nanny_id":1,"date":"2025-11-06","start_time":"09:00:00","end_time":"17:00:00","is_available":true,"reason":null,"created_at":"2025-11-06T09:00:00Z"},
    {"id":2,"nanny_id":2,"date":"2025-11-06","start_time":"08:00:00","end_time":"12:00:00","is_available":true,"reason":null,"created_at":"2025-11-06T08:00:00Z"},
    {"id":3,"nanny_id":3,"date":"2025-11-15","start_time":"22:00:00","end_time":"08:00:00","is_available":true,"reason":null,"created_at":"2025-11-15T22:00:00Z"},
    {"id":4,"nanny_id":4,"date":"2025-12-01","start_time":"10:00:00","end_time":"14:00:00","is_available":true,"reason":null,"created_at":"2025-12-01T10:00:00Z"},
    {"id":5,"nanny_id":5,"date":"2025-11-10","start_time":"09:00:00","end_time":"17:00:00","is_available":false,"reason":"Vacaciones","created_at":"2025-11-01T09:00:00Z"},
    {"id":6,"nanny_id":6,"date":"2025-11-07","start_time":"15:00:00","end_time":"18:00:00","is_available":true,"reason":null,"created_at":"2025-11-07T15:00:00Z"},
    {"id":7,"nanny_id":7,"date":"2025-12-20","start_time":"08:00:00","end_time":"20:00:00","is_available":false,"reason":"Viaje","created_at":"2025-12-10T08:00:00Z"},
    {"id":8,"nanny_id":8,"date":"2025-11-09","start_time":"13:00:00","end_time":"17:00:00","is_available":true,"reason":null,"created_at":"2025-11-09T13:00:00Z"},
    {"id":9,"nanny_id":9,"date":"2025-11-11","start_time":"16:00:00","end_time":"19:00:00","is_available":true,"reason":null,"created_at":"2025-11-11T16:00:00Z"},
    {"id":10,"nanny_id":10,"date":"2025-11-12","start_time":"18:00:00","end_time":"21:00:00","is_available":true,"reason":null,"created_at":"2025-11-12T18:00:00Z"}
  ]
}

