CREATE TABLE IF NOT EXISTS `User` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'pegawai',
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `User_email_key` (`email`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Stock` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `quantity` DOUBLE NOT NULL DEFAULT 0,
  `minLevel` DOUBLE NOT NULL DEFAULT 0,
   `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Note` (
  `id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `content` TEXT NOT NULL,
  `authorId` VARCHAR(36) NOT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_note_title` (`title`),
  KEY `idx_note_authorId` (`authorId`),
  CONSTRAINT `fk_note_author` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `StockLog` (
  `id` VARCHAR(36) NOT NULL,
  `stockId` VARCHAR(36) NULL,
  `action` VARCHAR(50) NOT NULL,
  `quantity` DOUBLE NOT NULL,
  `note` TEXT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_stocklog_stockId` (`stockId`),
  KEY `idx_stocklog_userId` (`userId`),
  CONSTRAINT `fk_stocklog_stock` FOREIGN KEY (`stockId`) REFERENCES `Stock`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_stocklog_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Recipe` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `price` DOUBLE NOT NULL DEFAULT 0,
  `description` TEXT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `Recipe_name_key` (`name`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `RecipeIngredient` (
  `id` VARCHAR(36) NOT NULL,
  `recipeId` VARCHAR(36) NOT NULL,
  `stockId` VARCHAR(36) NOT NULL,
  `quantity` DOUBLE NOT NULL,
  `unit` VARCHAR(50) NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_recipeingredient_recipeId` (`recipeId`),
  KEY `idx_recipeingredient_stockId` (`stockId`),
  CONSTRAINT `fk_recipeingredient_recipe` FOREIGN KEY (`recipeId`) REFERENCES `Recipe`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_recipeingredient_stock` FOREIGN KEY (`stockId`) REFERENCES `Stock`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `SalesOrder` (
  `id` VARCHAR(36) NOT NULL,
  `customerName` VARCHAR(191) NULL,
  `total` DOUBLE NOT NULL DEFAULT 0,
  `paid` TINYINT(1) NOT NULL DEFAULT 0,
  `userId` VARCHAR(36) NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_salesorder_userId` (`userId`),
  CONSTRAINT `fk_salesorder_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `SalesOrderItem` (
  `id` VARCHAR(36) NOT NULL,
  `orderId` VARCHAR(36) NOT NULL,
  `recipeId` VARCHAR(36) NULL,
  `name` VARCHAR(191) NOT NULL,
  `unit` VARCHAR(50) NULL,
  `price` DOUBLE NOT NULL DEFAULT 0,
  `quantity` DOUBLE NOT NULL DEFAULT 0,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_sorderitem_orderId` (`orderId`),
  KEY `idx_sorderitem_recipeId` (`recipeId`),
  CONSTRAINT `fk_sorderitem_order` FOREIGN KEY (`orderId`) REFERENCES `SalesOrder`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_sorderitem_recipe` FOREIGN KEY (`recipeId`) REFERENCES `Recipe`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `PurchaseOrder` (
  `id` VARCHAR(36) NOT NULL,
  `place` VARCHAR(191) NULL,
  `userId` VARCHAR(36) NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_purchaseorder_userId` (`userId`),
  CONSTRAINT `fk_purchaseorder_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `PurchaseItem` (
  `id` VARCHAR(36) NOT NULL,
  `orderId` VARCHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `unit` VARCHAR(50) NULL,
  `qtyItems` DOUBLE NOT NULL DEFAULT 0,
  `net` DOUBLE NOT NULL DEFAULT 0,
  `pricePerItem` DOUBLE NOT NULL DEFAULT 0,
  `totalPrice` DOUBLE NOT NULL DEFAULT 0,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_purchaseitem_orderId` (`orderId`),
  CONSTRAINT `fk_purchaseitem_order` FOREIGN KEY (`orderId`) REFERENCES `PurchaseOrder`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `CalendarEvent` (
  `id` VARCHAR(36) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `timeLabel` VARCHAR(50) NOT NULL,
  `time24` VARCHAR(50) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `location` VARCHAR(191) NULL,
  `details` TEXT NULL,
  `userId` VARCHAR(36) NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_calendar_userId` (`userId`),
  CONSTRAINT `fk_calendar_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
ALTER TABLE `User` ADD KEY `idx_user_createdAt` (`createdAt`);
ALTER TABLE `User` ADD KEY `idx_user_isActive` (`isActive`);
ALTER TABLE `Stock` ADD KEY `idx_stock_name` (`name`), ADD KEY `idx_stock_createdAt` (`createdAt`);
ALTER TABLE `Stock` ADD KEY `idx_stock_isActive` (`isActive`);
ALTER TABLE `Note` ADD FULLTEXT KEY `ft_note_title_content` (`title`, `content`), ADD KEY `idx_note_createdAt` (`createdAt`);
ALTER TABLE `Note` ADD KEY `idx_note_isActive` (`isActive`);
ALTER TABLE `StockLog` ADD KEY `idx_stocklog_createdAt` (`createdAt`);
ALTER TABLE `Recipe` ADD KEY `idx_recipe_createdAt` (`createdAt`);
ALTER TABLE `Recipe` ADD KEY `idx_recipe_isActive` (`isActive`);
ALTER TABLE `RecipeIngredient` ADD UNIQUE KEY `uniq_recipeingredient_pair` (`recipeId`,`stockId`), ADD KEY `idx_recipeingredient_createdAt` (`createdAt`);
ALTER TABLE `RecipeIngredient` ADD KEY `idx_recipeingredient_isActive` (`isActive`);
ALTER TABLE `SalesOrder` ADD KEY `idx_salesorder_createdAt` (`createdAt`), ADD KEY `idx_salesorder_paid` (`paid`);
ALTER TABLE `SalesOrder` ADD KEY `idx_salesorder_isActive` (`isActive`);
ALTER TABLE `SalesOrderItem` ADD KEY `idx_sorderitem_createdAt` (`createdAt`);
ALTER TABLE `SalesOrderItem` ADD KEY `idx_sorderitem_isActive` (`isActive`);
ALTER TABLE `PurchaseOrder` ADD KEY `idx_purchaseorder_createdAt` (`createdAt`);
ALTER TABLE `PurchaseOrder` ADD KEY `idx_purchaseorder_isActive` (`isActive`);
ALTER TABLE `PurchaseItem` ADD KEY `idx_purchaseitem_name` (`name`), ADD KEY `idx_purchaseitem_createdAt` (`createdAt`);
ALTER TABLE `PurchaseItem` ADD KEY `idx_purchaseitem_isActive` (`isActive`);
ALTER TABLE `CalendarEvent` ADD KEY `idx_calendar_createdAt` (`createdAt`);
ALTER TABLE `CalendarEvent` ADD KEY `idx_calendar_isActive` (`isActive`);

DROP VIEW IF EXISTS `purchase_order_totals`;
CREATE VIEW `purchase_order_totals` AS
SELECT p.id AS orderId,
       COALESCE(SUM(i.totalPrice), 0) AS totalPrice,
       COUNT(i.id) AS itemCount
FROM `PurchaseOrder` p
LEFT JOIN `PurchaseItem` i ON i.orderId = p.id AND i.isActive = 1
WHERE p.isActive = 1
GROUP BY p.id;

DROP VIEW IF EXISTS `sales_order_totals`;
CREATE VIEW `sales_order_totals` AS
SELECT s.id AS orderId,
       COALESCE(SUM(si.price * si.quantity), 0) AS computedTotal,
       COUNT(si.id) AS itemCount
FROM `SalesOrder` s
LEFT JOIN `SalesOrderItem` si ON si.orderId = s.id AND si.isActive = 1
WHERE s.isActive = 1
GROUP BY s.id;

DROP VIEW IF EXISTS `stock_purchase_summary`;
CREATE VIEW `stock_purchase_summary` AS
SELECT i.name AS stockName,
       i.unit AS unit,
       COALESCE(SUM(i.qtyItems), 0) AS totalQty,
       COALESCE(SUM(i.totalPrice), 0) AS totalSpent
FROM `PurchaseItem` i
WHERE i.isActive = 1
GROUP BY i.name, i.unit;

DROP VIEW IF EXISTS `low_stock`;
CREATE VIEW `low_stock` AS
SELECT s.id AS id,
       s.name AS name,
       s.unit AS unit,
       s.quantity AS quantity,
       s.minLevel AS minLevel,
       (s.minLevel - s.quantity) AS deficit
FROM `Stock` s
WHERE s.quantity < s.minLevel AND s.isActive = 1;

DROP VIEW IF EXISTS `auto_finance_transactions`;
CREATE VIEW `auto_finance_transactions` AS
SELECT s.id AS id, 'income' AS type, s.total AS amount, s.createdAt AS date, 'Penjualan' AS description, 'cash' AS source, NULL AS category, NULL AS subCategory, NULL AS method, s.userId AS userId
FROM `SalesOrder` s
WHERE s.paid = 1 AND s.isActive = 1
UNION ALL
SELECT po.id AS id, 'expense' AS type, COALESCE(SUM(pi.totalPrice), 0) AS amount, po.createdAt AS date, 'Pembelian' AS description, 'inventory' AS source, NULL AS category, NULL AS subCategory, NULL AS method, po.userId AS userId
FROM `PurchaseOrder` po
LEFT JOIN `PurchaseItem` pi ON pi.orderId = po.id AND pi.isActive = 1
WHERE po.isActive = 1
GROUP BY po.id, po.createdAt, po.userId;

DROP VIEW IF EXISTS `finance_transactions_all`;
CREATE VIEW `finance_transactions_all` AS
SELECT * FROM `auto_finance_transactions`;
DROP VIEW IF EXISTS `unpaid_sales_orders`;
CREATE VIEW `unpaid_sales_orders` AS
SELECT s.id AS orderId,
       s.createdAt AS createdAt,
       COALESCE(SUM(si.price * si.quantity), 0) AS computedTotal,
       COUNT(si.id) AS itemCount
FROM `SalesOrder` s
LEFT JOIN `SalesOrderItem` si ON si.orderId = s.id AND si.isActive = 1
WHERE s.paid = 0 AND s.isActive = 1
GROUP BY s.id, s.createdAt;
DROP VIEW IF EXISTS `daily_sales_summary`;
CREATE VIEW `daily_sales_summary` AS
SELECT DATE(s.createdAt) AS day,
       COUNT(s.id) AS ordersCount,
       COALESCE(SUM(si.price * si.quantity), 0) AS totalAmount
FROM `SalesOrder` s
LEFT JOIN `SalesOrderItem` si ON si.orderId = s.id AND si.isActive = 1
WHERE s.paid = 1 AND s.isActive = 1
GROUP BY DATE(s.createdAt);
DROP VIEW IF EXISTS `daily_purchase_summary`;
CREATE VIEW `daily_purchase_summary` AS
SELECT DATE(po.createdAt) AS day,
       COUNT(DISTINCT po.id) AS ordersCount,
       COALESCE(SUM(pi.totalPrice), 0) AS totalAmount
FROM `PurchaseOrder` po
LEFT JOIN `PurchaseItem` pi ON pi.orderId = po.id AND pi.isActive = 1
WHERE po.isActive = 1
GROUP BY DATE(po.createdAt);
DROP VIEW IF EXISTS `recipe_sales_summary`;
CREATE VIEW `recipe_sales_summary` AS
SELECT r.id AS recipeId,
       r.name AS recipeName,
       COALESCE(SUM(si.quantity), 0) AS totalQty,
       COALESCE(SUM(si.price * si.quantity), 0) AS totalRevenue
FROM `Recipe` r
LEFT JOIN `SalesOrderItem` si ON si.recipeId = r.id AND si.isActive = 1
WHERE r.isActive = 1
GROUP BY r.id, r.name;
DROP VIEW IF EXISTS `stock_movement_summary`;
CREATE VIEW `stock_movement_summary` AS
SELECT s.id AS stockId,
       s.name AS stockName,
       COALESCE(SUM(CASE WHEN sl.action = 'increase' THEN sl.quantity ELSE 0 END), 0) AS increasedQty,
       COALESCE(SUM(CASE WHEN sl.action = 'decrease' THEN sl.quantity ELSE 0 END), 0) AS decreasedQty,
       COALESCE(SUM(CASE WHEN sl.action = 'increase' THEN sl.quantity ELSE -sl.quantity END), 0) AS netChange
FROM `Stock` s
LEFT JOIN `StockLog` sl ON sl.stockId = s.id
WHERE s.isActive = 1
GROUP BY s.id, s.name;
DROP VIEW IF EXISTS `recent_stock_logs`;
CREATE VIEW `recent_stock_logs` AS
SELECT sl.*
FROM `StockLog` sl
WHERE sl.createdAt >= NOW() - INTERVAL 30 DAY;

DELIMITER $$

DROP FUNCTION IF EXISTS `fn_purchase_total` $$
CREATE FUNCTION `fn_purchase_total`(p_orderId VARCHAR(36)) RETURNS DOUBLE
DETERMINISTIC READS SQL DATA
BEGIN
  DECLARE t DOUBLE;
  SELECT COALESCE(SUM(totalPrice), 0) INTO t FROM `PurchaseItem` WHERE `orderId` = p_orderId AND `isActive` = 1;
  RETURN COALESCE(t, 0);
END $$

DROP FUNCTION IF EXISTS `fn_sales_total` $$
CREATE FUNCTION `fn_sales_total`(p_orderId VARCHAR(36)) RETURNS DOUBLE
DETERMINISTIC READS SQL DATA
BEGIN
  DECLARE t DOUBLE;
  SELECT COALESCE(SUM(price * quantity), 0) INTO t FROM `SalesOrderItem` WHERE `orderId` = p_orderId AND `isActive` = 1;
  RETURN COALESCE(t, 0);
END $$

DROP FUNCTION IF EXISTS `fn_stock_below_min` $$
CREATE FUNCTION `fn_stock_below_min`(p_stockId VARCHAR(36)) RETURNS TINYINT(1)
DETERMINISTIC READS SQL DATA
BEGIN
  DECLARE q DOUBLE;
  DECLARE m DOUBLE;
  SELECT `quantity`, `minLevel` INTO q, m FROM `Stock` WHERE `id` = p_stockId AND `isActive` = 1;
  RETURN CASE WHEN COALESCE(q,0) < COALESCE(m,0) THEN 1 ELSE 0 END;
END $$

DROP PROCEDURE IF EXISTS `sp_get_purchase_total` $$
CREATE PROCEDURE `sp_get_purchase_total`(IN p_orderId VARCHAR(36))
BEGIN
  SELECT p.id AS orderId,
         COALESCE(SUM(i.totalPrice), 0) AS totalPrice,
         COUNT(i.id) AS itemCount
  FROM `PurchaseOrder` p
  LEFT JOIN `PurchaseItem` i ON i.orderId = p.id AND i.isActive = 1
  WHERE p.id = p_orderId AND p.isActive = 1
  GROUP BY p.id;
END $$

DROP PROCEDURE IF EXISTS `sp_get_sales_total` $$
CREATE PROCEDURE `sp_get_sales_total`(IN p_orderId VARCHAR(36))
BEGIN
  SELECT s.id AS orderId,
         COALESCE(SUM(si.price * si.quantity), 0) AS total,
         COUNT(si.id) AS itemCount
  FROM `SalesOrder` s
  LEFT JOIN `SalesOrderItem` si ON si.orderId = s.id AND si.isActive = 1
  WHERE s.id = p_orderId AND s.isActive = 1
  GROUP BY s.id;
END $$

DROP PROCEDURE IF EXISTS `sp_adjust_stock` $$
CREATE PROCEDURE `sp_adjust_stock`(IN p_stockId VARCHAR(36), IN p_delta DOUBLE, IN p_userId VARCHAR(36), IN p_note TEXT)
BEGIN
  UPDATE `Stock`
  SET `quantity` = COALESCE(`quantity`,0) + COALESCE(p_delta,0)
  WHERE `id` = p_stockId AND `isActive` = 1;
  INSERT INTO `StockLog` (`id`, `stockId`, `action`, `quantity`, `note`, `userId`)
  VALUES (UUID(), p_stockId,
          CASE WHEN COALESCE(p_delta,0) >= 0 THEN 'increase' ELSE 'decrease' END,
          ABS(COALESCE(p_delta,0)),
          p_note,
          p_userId);
END $$
DROP FUNCTION IF EXISTS `fn_order_item_count` $$
CREATE FUNCTION `fn_order_item_count`(p_orderId VARCHAR(36)) RETURNS INT
DETERMINISTIC READS SQL DATA
BEGIN
  DECLARE c INT;
  SELECT COUNT(*) INTO c FROM `SalesOrderItem` WHERE `orderId` = p_orderId;
  RETURN COALESCE(c, 0);
END $$
DROP PROCEDURE IF EXISTS `sp_mark_sales_paid` $$
CREATE PROCEDURE `sp_mark_sales_paid`(IN p_orderId VARCHAR(36))
BEGIN
  UPDATE `SalesOrder`
  SET `paid` = 1,
      `total` = (SELECT COALESCE(SUM(`price` * `quantity`),0) FROM `SalesOrderItem` WHERE `orderId` = p_orderId)
  WHERE `id` = p_orderId;
END $$

DROP TRIGGER IF EXISTS `bi_purchaseitem_totalPrice` $$
CREATE TRIGGER `bi_purchaseitem_totalPrice`
BEFORE INSERT ON `PurchaseItem`
FOR EACH ROW
BEGIN
  SET NEW.totalPrice = COALESCE(NEW.pricePerItem,0) * COALESCE(NEW.qtyItems,0);
END $$

DROP TRIGGER IF EXISTS `bu_purchaseitem_totalPrice` $$
CREATE TRIGGER `bu_purchaseitem_totalPrice`
BEFORE UPDATE ON `PurchaseItem`
FOR EACH ROW
BEGIN
  SET NEW.totalPrice = COALESCE(NEW.pricePerItem,0) * COALESCE(NEW.qtyItems,0);
END $$

DROP TRIGGER IF EXISTS `ai_salesorderitem_update_total` $$
CREATE TRIGGER `ai_salesorderitem_update_total`
AFTER INSERT ON `SalesOrderItem`
FOR EACH ROW
BEGIN
  UPDATE `SalesOrder`
  SET `total` = (SELECT COALESCE(SUM(`price` * `quantity`),0) FROM `SalesOrderItem` WHERE `orderId` = NEW.orderId AND `isActive` = 1)
  WHERE `id` = NEW.orderId;
END $$

DROP TRIGGER IF EXISTS `au_salesorderitem_update_total` $$
CREATE TRIGGER `au_salesorderitem_update_total`
AFTER UPDATE ON `SalesOrderItem`
FOR EACH ROW
BEGIN
  UPDATE `SalesOrder`
  SET `total` = (SELECT COALESCE(SUM(`price` * `quantity`),0) FROM `SalesOrderItem` WHERE `orderId` = NEW.orderId AND `isActive` = 1)
  WHERE `id` = NEW.orderId;
END $$

DROP TRIGGER IF EXISTS `ad_salesorderitem_update_total` $$
CREATE TRIGGER `ad_salesorderitem_update_total`
AFTER DELETE ON `SalesOrderItem`
FOR EACH ROW
BEGIN
  UPDATE `SalesOrder`
  SET `total` = (SELECT COALESCE(SUM(`price` * `quantity`),0) FROM `SalesOrderItem` WHERE `orderId` = OLD.orderId AND `isActive` = 1)
  WHERE `id` = OLD.orderId;
END $$

DELIMITER ;
