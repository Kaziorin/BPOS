
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `Brand`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Brand` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Brand_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Brand` WRITE;
/*!40000 ALTER TABLE `Brand` DISABLE KEYS */;
/*!40000 ALTER TABLE `Brand` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Category` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Category_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Category` WRITE;
/*!40000 ALTER TABLE `Category` DISABLE KEYS */;
/*!40000 ALTER TABLE `Category` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Customer` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creditLimit` decimal(12,2) NOT NULL DEFAULT '0.00',
  `totalDue` decimal(12,2) NOT NULL DEFAULT '0.00',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Customer_phone_key` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Customer` WRITE;
/*!40000 ALTER TABLE `Customer` DISABLE KEYS */;
/*!40000 ALTER TABLE `Customer` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Product` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoryId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `brandId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pcs',
  `purchasePrice` decimal(12,2) NOT NULL,
  `sellingPrice` decimal(12,2) NOT NULL,
  `stockQty` decimal(12,2) NOT NULL DEFAULT '0.00',
  `alertQty` decimal(12,2) NOT NULL DEFAULT '5.00',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Product_sku_key` (`sku`),
  UNIQUE KEY `Product_barcode_key` (`barcode`),
  KEY `Product_categoryId_idx` (`categoryId`),
  KEY `Product_brandId_idx` (`brandId`),
  CONSTRAINT `Product_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Product` WRITE;
/*!40000 ALTER TABLE `Product` DISABLE KEYS */;
/*!40000 ALTER TABLE `Product` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Purchase`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Purchase` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `referenceNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplierId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `discount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tax` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total` decimal(12,2) NOT NULL,
  `paid` decimal(12,2) NOT NULL DEFAULT '0.00',
  `due` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` enum('RECEIVED','DUE','RETURNED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RECEIVED',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Purchase_referenceNo_key` (`referenceNo`),
  KEY `Purchase_supplierId_idx` (`supplierId`),
  KEY `Purchase_createdAt_idx` (`createdAt`),
  KEY `Purchase_userId_fkey` (`userId`),
  CONSTRAINT `Purchase_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Purchase_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Purchase` WRITE;
/*!40000 ALTER TABLE `Purchase` DISABLE KEYS */;
/*!40000 ALTER TABLE `Purchase` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `PurchaseItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PurchaseItem` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purchaseId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `total` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `PurchaseItem_purchaseId_idx` (`purchaseId`),
  KEY `PurchaseItem_productId_idx` (`productId`),
  CONSTRAINT `PurchaseItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `PurchaseItem_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `Purchase` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `PurchaseItem` WRITE;
/*!40000 ALTER TABLE `PurchaseItem` DISABLE KEYS */;
/*!40000 ALTER TABLE `PurchaseItem` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Sale`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Sale` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoiceNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `discount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tax` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total` decimal(12,2) NOT NULL,
  `paid` decimal(12,2) NOT NULL DEFAULT '0.00',
  `due` decimal(12,2) NOT NULL DEFAULT '0.00',
  `paymentMethod` enum('CASH','CARD','BANK','MOBILE_BANKING','CREDIT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CASH',
  `status` enum('COMPLETED','DUE','RETURNED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COMPLETED',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Sale_invoiceNo_key` (`invoiceNo`),
  KEY `Sale_customerId_idx` (`customerId`),
  KEY `Sale_createdAt_idx` (`createdAt`),
  KEY `Sale_userId_fkey` (`userId`),
  CONSTRAINT `Sale_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Sale_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Sale` WRITE;
/*!40000 ALTER TABLE `Sale` DISABLE KEYS */;
/*!40000 ALTER TABLE `Sale` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `SaleItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SaleItem` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `saleId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `total` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `SaleItem_saleId_idx` (`saleId`),
  KEY `SaleItem_productId_idx` (`productId`),
  CONSTRAINT `SaleItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `SaleItem_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `Sale` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `SaleItem` WRITE;
/*!40000 ALTER TABLE `SaleItem` DISABLE KEYS */;
/*!40000 ALTER TABLE `SaleItem` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `StockMovement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `StockMovement` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('PURCHASE','SALE','ADJUSTMENT','RETURN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `StockMovement_productId_idx` (`productId`),
  CONSTRAINT `StockMovement_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `StockMovement` WRITE;
/*!40000 ALTER TABLE `StockMovement` DISABLE KEYS */;
/*!40000 ALTER TABLE `StockMovement` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Supplier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Supplier` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `totalDue` decimal(12,2) NOT NULL DEFAULT '0.00',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Supplier` WRITE;
/*!40000 ALTER TABLE `Supplier` DISABLE KEYS */;
/*!40000 ALTER TABLE `Supplier` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','MANAGER','CASHIER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CASHIER',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accountType` enum('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `parentAccountId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isGroup` tinyint(1) NOT NULL DEFAULT '0',
  `openingBalance` decimal(14,2) NOT NULL DEFAULT '0.00',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accounts_tenantId_code_key` (`tenantId`,`code`),
  KEY `accounts_tenantId_idx` (`tenantId`),
  KEY `accounts_parentAccountId_idx` (`parentAccountId`),
  CONSTRAINT `accounts_parentAccountId_fkey` FOREIGN KEY (`parentAccountId`) REFERENCES `accounts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;
INSERT INTO `accounts` VALUES ('27315cd4-9111-4667-be38-373d2652450f','1798fdaa-84d9-4bd4-903d-02784a398676','2000','Accounts Payable','LIABILITY',NULL,0,0.00,'ACTIVE','2026-09-04 18:06:45.522','2026-09-04 18:06:45.522','538dd563-88aa-4c96-8213-f1ebc6664a49','538dd563-88aa-4c96-8213-f1ebc6664a49'),('32a8ef09-2f8b-4755-981c-d612e8eb8d3d','1798fdaa-84d9-4bd4-903d-02784a398676','3000','Owner\'s Equity','EQUITY',NULL,0,0.00,'ACTIVE','2026-09-04 18:06:45.524','2026-09-04 18:06:45.524','538dd563-88aa-4c96-8213-f1ebc6664a49','538dd563-88aa-4c96-8213-f1ebc6664a49'),('38b400a7-e6ec-45d7-9612-a14c5e492ffc','1798fdaa-84d9-4bd4-903d-02784a398676','5200','Rent Expense','EXPENSE',NULL,0,0.00,'ACTIVE','2026-09-04 18:06:45.526','2026-09-04 18:06:45.526','538dd563-88aa-4c96-8213-f1ebc6664a49','538dd563-88aa-4c96-8213-f1ebc6664a49'),('553264df-8d50-411d-bfc9-76a13aa10160','1798fdaa-84d9-4bd4-903d-02784a398676','4100','Sales Returns','REVENUE',NULL,0,0.00,'ACTIVE','2026-09-04 18:06:45.525','2026-09-04 18:06:45.525','538dd563-88aa-4c96-8213-f1ebc6664a49','538dd563-88aa-4c96-8213-f1ebc6664a49'),('5bf78ef0-66ac-4128-bc0b-a1516251cbba','1798fdaa-84d9-4bd4-903d-02784a398676','2120','VAT Receivable','ASSET',NULL,0,0.00,'ACTIVE','2026-09-04 18:06:45.523','2026-09-04 18:06:45.523','538dd563-88aa-4c96-8213-f1ebc6664a49','538dd563-88aa-4c96-8213-f1ebc6664a49'),('5f9fae6f-7cfa-40f1-952a-02fb6bfaa809','1798fdaa-84d9-4bd4-903d-02784a398676','5300','Utilities Expense','EXPENSE',NULL,0,0.00,'ACTIVE','2026-09-04 18:06:45.526','2026-09-04 18:06:45.526','538dd563-88aa-4c96-8213-f1ebc6664a49','538dd563-88aa-4c96-8213-f1ebc6664a49'),('780f3a57-4d16-45de-b082-b2b1f42ad1d2','1798fdaa-84d9-4bd4-903d-02784a398676','2200','Commission Payable','LIABILITY',NULL,0,0.00,'ACTIVE','2026-09-04 18:06:45.523','2026-09-04 18:06:45.523','538dd563-88aa-4c96-8213-f1ebc6664a49','538dd563-88aa-4c96-8213-f1ebc6664a49'),('92b341ba-95c0-40ca-8275-64faaeb39dd1','1798fdaa-84d9-4bd4-903d-02784a398676','2100','VAT Payable','LIABILITY',NULL,0,0.00,'ACTIVE','2026-09-04 18:06:45.522','2026-09-04 18:06:45.522','538dd563-88aa-4c96-8213-f1ebc6664a49','538dd563-88aa-4c96-8213-f1ebc6664a49'),('9b4df045-4a5d-4b05-9539-f1d2d20c25f2','1798fdaa-84d9-4bd4-903d-02784a398676','2110','Input VAT','ASSET',NULL,0,0.00,'ACTIVE','2026-09-04 18:06:45.522','2026-09-04 18:06:45.522','538dd563-88aa-4c96-8213-f1ebc6664a49','538dd563-88aa-4c96-8213-f1ebc6664a49'),('a561b92c-f664-43c0-b41e-34a97d048ed1','1798fdaa-84d9-4bd4-903d-02784a398676','1100','Accounts Receivable','ASSET',NULL,0,0.00,'ACTIVE','2026-09-04 18:06:45.521','2026-09-04 18:06:45.521','538dd563-88aa-4c96-8213-f1ebc6664a49','538dd563-88aa-4c96-8213-f1ebc6664a49'),('ab9bce77-809a-4ff3-abc7-944c5f3a4e86','1798fdaa-84d9-4bd4-903d-02784a398676','1000','Cash on Hand','ASSET',NULL,0,0.00,'ACTIVE','2026-09-04 18:06:45.520','2026-09-04 18:06:45.520','538dd563-88aa-4c96-8213-f1ebc6664a49','538dd563-88aa-4c96-8213-f1ebc6664a49'),('acc9b813-5f94-4659-8be2-09053546c87b','1798fdaa-84d9-4bd4-903d-02784a398676','4000','Sales Revenue','REVENUE',NULL,0,0.00,'ACTIVE','2026-09-04 18:06:45.525','2026-09-04 18:06:45.525','538dd563-88aa-4c96-8213-f1ebc6664a49','538dd563-88aa-4c96-8213-f1ebc6664a49'),('b4cf61e9-5e2a-4349-9f6a-3c7aae81bf8b','1798fdaa-84d9-4bd4-903d-02784a398676','5500','Commission Expense','EXPENSE',NULL,0,0.00,'ACTIVE','2026-09-04 18:06:45.527','2026-09-04 18:06:45.527','538dd563-88aa-4c96-8213-f1ebc6664a49','538dd563-88aa-4c96-8213-f1ebc6664a49'),('cfc36ee1-4989-4079-ac9c-15b3625f9499','1798fdaa-84d9-4bd4-903d-02784a398676','1010','Bank Account','ASSET',NULL,0,0.00,'ACTIVE','2026-09-04 18:06:45.521','2026-09-04 18:06:45.521','538dd563-88aa-4c96-8213-f1ebc6664a49','538dd563-88aa-4c96-8213-f1ebc6664a49'),('dc322431-9ec3-4c2e-8bb5-650d4f4a3f01','1798fdaa-84d9-4bd4-903d-02784a398676','5000','Cost of Goods Sold','EXPENSE',NULL,0,0.00,'ACTIVE','2026-09-04 18:06:45.525','2026-09-04 18:06:45.525','538dd563-88aa-4c96-8213-f1ebc6664a49','538dd563-88aa-4c96-8213-f1ebc6664a49'),('e45341e1-6630-4ce2-849d-7d11cc1c215d','1798fdaa-84d9-4bd4-903d-02784a398676','1200','Inventory','ASSET',NULL,0,0.00,'ACTIVE','2026-09-04 18:06:45.521','2026-09-04 18:06:45.521','538dd563-88aa-4c96-8213-f1ebc6664a49','538dd563-88aa-4c96-8213-f1ebc6664a49'),('efd1fb8d-a9fc-4505-a037-b7b95c651d6c','1798fdaa-84d9-4bd4-903d-02784a398676','5100','Salaries Expense','EXPENSE',NULL,0,0.00,'ACTIVE','2026-09-04 18:06:45.526','2026-09-04 18:06:45.526','538dd563-88aa-4c96-8213-f1ebc6664a49','538dd563-88aa-4c96-8213-f1ebc6664a49'),('fb1a143e-cbce-4e35-abfd-b9389abc31bb','1798fdaa-84d9-4bd4-903d-02784a398676','3100','Retained Earnings','EQUITY',NULL,0,0.00,'ACTIVE','2026-09-04 18:06:45.524','2026-09-04 18:06:45.524','538dd563-88aa-4c96-8213-f1ebc6664a49','538dd563-88aa-4c96-8213-f1ebc6664a49'),('fe7a62b3-d3b9-4271-9a08-5d9ec1f4af8a','1798fdaa-84d9-4bd4-903d-02784a398676','5400','Other Expenses','EXPENSE',NULL,0,0.00,'ACTIVE','2026-09-04 18:06:45.527','2026-09-04 18:06:45.527','538dd563-88aa-4c96-8213-f1ebc6664a49','538dd563-88aa-4c96-8213-f1ebc6664a49');
/*!40000 ALTER TABLE `accounts` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `ai_conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_conversations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sessionId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('USER','ASSISTANT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `metadata` json DEFAULT NULL COMMENT '{tokens, intent, entities}',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ac_session` (`tenantId`,`sessionId`),
  KEY `idx_ac_user` (`tenantId`,`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `ai_conversations` WRITE;
/*!40000 ALTER TABLE `ai_conversations` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_conversations` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `ai_insights`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_insights` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `insightType` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'DEMAND_FORECAST/REORDER/OVERSTOCK/DEAD_STOCK/EXPIRY_RISK/SALES_TREND/PROFIT_DECLINE/FRAUD_ALERT/CUSTOMER_LTV/CHURN_RISK/SUPPLIER_SCORE/PROCUREMENT',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary` text COLLATE utf8mb4_unicode_ci,
  `detail` json DEFAULT NULL COMMENT '{inputs, outputs, explanation, confidence}',
  `severity` enum('INFO','LOW','MEDIUM','HIGH','CRITICAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INFO',
  `entityType` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entityId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `isDismissed` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ai_tenant` (`tenantId`,`insightType`),
  KEY `idx_ai_severity` (`tenantId`,`severity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `ai_insights` WRITE;
/*!40000 ALTER TABLE `ai_insights` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_insights` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `ai_permissions_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_permissions_log` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `query` text COLLATE utf8mb4_unicode_ci,
  `permitted` tinyint(1) NOT NULL DEFAULT '1',
  `deniedReason` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requiredPermission` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_apt_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `ai_permissions_log` WRITE;
/*!40000 ALTER TABLE `ai_permissions_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_permissions_log` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `ai_suggestions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_suggestions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actionType` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'CREATE_PURCHASE_REQ/SEND_REMINDER/ADJUST_PRICE/REORDER_STOCK/UPDATE_REORDER_POINT',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `inputs` json DEFAULT NULL COMMENT '{avgDailySales, currentStock, leadTime, etc}',
  `recommendation` json DEFAULT NULL COMMENT '{suggested action params}',
  `confidence` decimal(5,2) DEFAULT NULL,
  `status` enum('PENDING','ACCEPTED','REJECTED','EXPIRED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `insightId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'NULL = AI-generated',
  `actedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_as_tenant_status` (`tenantId`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `ai_suggestions` WRITE;
/*!40000 ALTER TABLE `ai_suggestions` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_suggestions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `analytics_snapshots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analytics_snapshots` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `snapshotType` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'DAILY_SALES/DAILY_INVENTORY/MONTHLY_FINANCIAL',
  `snapshotDate` date NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data` json NOT NULL COMMENT 'aggregated snapshot data',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_snapshot` (`tenantId`,`snapshotType`,`snapshotDate`,`branchId`),
  KEY `idx_as_tenant` (`tenantId`,`snapshotType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `analytics_snapshots` WRITE;
/*!40000 ALTER TABLE `analytics_snapshots` DISABLE KEYS */;
/*!40000 ALTER TABLE `analytics_snapshots` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `api_key_usage_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_key_usage_log` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apiKeyId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `endpoint` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `method` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `responseStatus` int DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAgent` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_aku_tenant` (`tenantId`,`apiKeyId`),
  KEY `idx_aku_time` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `api_key_usage_log` WRITE;
/*!40000 ALTER TABLE `api_key_usage_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `api_key_usage_log` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `api_keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_keys` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Friendly name, e.g. Zapier Integration',
  `keyHash` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'SHA-256 hash of the raw key',
  `keyPrefix` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'First 8 chars for display: omni_xxxx...',
  `scopes` json NOT NULL COMMENT '["sales.read","products.write"]',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `expiresAt` datetime DEFAULT NULL,
  `lastUsedAt` datetime DEFAULT NULL,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revokedAt` datetime DEFAULT NULL,
  `revokeReason` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ak_hash` (`tenantId`,`keyHash`),
  KEY `idx_ak_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `api_keys` WRITE;
/*!40000 ALTER TABLE `api_keys` DISABLE KEYS */;
/*!40000 ALTER TABLE `api_keys` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `appointmentNo` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `appointmentType` enum('GENERAL','SALON','REPAIR','CONSULT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GENERAL',
  `customerId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `serviceId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `serviceName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `staffId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `staffName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `startAt` datetime NOT NULL,
  `endAt` datetime NOT NULL,
  `durationMin` int NOT NULL DEFAULT '30',
  `price` decimal(14,2) NOT NULL DEFAULT '0.00',
  `status` enum('BOOKED','CONFIRMED','CHECKED_IN','IN_SERVICE','COMPLETED','NO_SHOW','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BOOKED',
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_appt_tenant_no` (`tenantId`,`appointmentNo`),
  KEY `idx_appt_tenant` (`tenantId`),
  KEY `idx_appt_type` (`appointmentType`),
  KEY `idx_appt_staff` (`staffId`),
  KEY `idx_appt_start` (`startAt`),
  KEY `idx_appt_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `approval_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approval_requests` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requestNo` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityType` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entityNo` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `summary` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `payload` json DEFAULT NULL COMMENT 'proposed change snapshot, applied on final approval',
  `status` enum('PENDING','APPROVED','REJECTED','ESCALATED','CANCELLED','EXPIRED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `currentLevel` int NOT NULL DEFAULT '1',
  `currentRole` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `submittedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `submittedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approvedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedAt` datetime DEFAULT NULL,
  `rejectedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rejectedAt` datetime DEFAULT NULL,
  `rejectionReason` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `escalatedAt` datetime DEFAULT NULL,
  `expiresAt` datetime DEFAULT NULL,
  `appliedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_apr_tenant` (`tenantId`),
  KEY `idx_apr_status` (`tenantId`,`status`),
  KEY `idx_apr_entity` (`entityType`,`entityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `approval_requests` WRITE;
/*!40000 ALTER TABLE `approval_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `approval_requests` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `approval_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approval_steps` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requestId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `level` int NOT NULL DEFAULT '1',
  `role` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','ESCALATED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `comment` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_as_request` (`requestId`),
  KEY `idx_as_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `approval_steps` WRITE;
/*!40000 ALTER TABLE `approval_steps` DISABLE KEYS */;
/*!40000 ALTER TABLE `approval_steps` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deviceId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `oldValues` json DEFAULT NULL,
  `newValues` json DEFAULT NULL,
  `ipAddress` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAgent` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `audit_logs_tenantId_idx` (`tenantId`),
  KEY `audit_logs_entity_entityId_idx` (`entity`,`entityId`),
  KEY `audit_logs_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `background_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `background_jobs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'webhook_deliver, email, sms, whatsapp, notification, report_generate, pdf_generate, import_process, export_process, sync_process, ai_process, recurring_expenses, scheduled_check',
  `status` enum('QUEUED','RUNNING','SUCCEEDED','FAILED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'QUEUED',
  `priority` int NOT NULL DEFAULT '5' COMMENT 'lower = sooner',
  `payload` json DEFAULT NULL,
  `attempts` int NOT NULL DEFAULT '0',
  `maxAttempts` int NOT NULL DEFAULT '3',
  `runAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'do not run before this',
  `startedAt` datetime DEFAULT NULL,
  `finishedAt` datetime DEFAULT NULL,
  `lastError` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `result` json DEFAULT NULL,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bj_queue` (`status`,`runAt`,`priority`),
  KEY `idx_bj_tenant` (`tenantId`,`status`,`createdAt`),
  KEY `idx_bj_type` (`type`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `background_jobs` WRITE;
/*!40000 ALTER TABLE `background_jobs` DISABLE KEYS */;
INSERT INTO `background_jobs` VALUES ('0090c543-083e-4984-8c43-02d8c186310c','1798fdaa-84d9-4bd4-903d-02784a398676','scheduled_check','SUCCEEDED',6,'{\"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',1,3,'2026-09-04 17:58:42','2026-09-04 17:58:43','2026-09-04 17:58:43',NULL,'{\"fired\": {}, \"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',NULL,'2026-09-04 17:58:42','2026-09-04 17:58:43'),('17c6fcd0-a264-4675-bd72-9343f631835b','1798fdaa-84d9-4bd4-903d-02784a398676','scheduled_check','SUCCEEDED',6,'{\"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',1,3,'2026-09-04 18:04:44','2026-09-04 18:04:45','2026-09-04 18:04:45',NULL,'{\"fired\": {}, \"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',NULL,'2026-09-04 18:04:44','2026-09-04 18:04:45'),('388b98ba-beae-4c90-9739-90cf09259d9b','1798fdaa-84d9-4bd4-903d-02784a398676','scheduled_check','SUCCEEDED',6,'{\"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',1,3,'2026-09-04 18:01:01','2026-09-04 18:01:02','2026-09-04 18:01:02',NULL,'{\"fired\": {}, \"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',NULL,'2026-09-04 18:01:01','2026-09-04 18:01:02'),('536281d1-5c21-4fa0-8ea9-2f3d98adb16f','1798fdaa-84d9-4bd4-903d-02784a398676','scheduled_check','SUCCEEDED',6,'{\"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',1,3,'2026-09-04 18:08:07','2026-09-04 18:08:08','2026-09-04 18:08:08',NULL,'{\"fired\": {}, \"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',NULL,'2026-09-04 18:08:07','2026-09-04 18:08:08'),('67fd0685-8e63-484a-aefd-9124a16fdfcd','1798fdaa-84d9-4bd4-903d-02784a398676','webhook_deliver','SUCCEEDED',3,'{\"eventId\": \"b0f15973-fffb-467f-9115-5fe00571704d\"}',1,3,'2026-09-04 17:53:55','2026-09-04 17:53:56','2026-09-04 17:53:56',NULL,'{\"reason\": \"subscription-missing\", \"status\": \"FAILED\", \"eventId\": \"b0f15973-fffb-467f-9115-5fe00571704d\", \"delivered\": false}',NULL,'2026-09-04 17:53:55','2026-09-04 17:53:56'),('7f0a63f3-5a33-419f-bf04-031d47e94bfc','1798fdaa-84d9-4bd4-903d-02784a398676','scheduled_check','SUCCEEDED',6,'{\"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',1,3,'2026-09-04 18:00:43','2026-09-04 18:00:44','2026-09-04 18:00:44',NULL,'{\"fired\": {}, \"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',NULL,'2026-09-04 18:00:43','2026-09-04 18:00:44'),('88b5905b-fc5b-40f1-9a8f-530e8f35c28c','1798fdaa-84d9-4bd4-903d-02784a398676','backup_full','SUCCEEDED',1,'{\"source\": \"manual\", \"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',1,3,'2026-09-04 18:06:25','2026-09-04 18:06:25','2026-09-04 18:06:26',NULL,'{\"backupId\": \"1b6ad9de-4573-4a22-b9f6-cfa1370c2188\", \"checksum\": \"676479afc63c3863a39e3d7d574cc358a591ec99c0ecf29597c62fc4752d284d\", \"fileName\": \"blue_ocean_pos_full_20260904_180625.sql\", \"sizeBytes\": 350571, \"tableCount\": 195}','538dd563-88aa-4c96-8213-f1ebc6664a49','2026-09-04 18:06:25','2026-09-04 18:06:26'),('92e08080-1ae4-4e07-be3d-4c5a003d1f3d','1798fdaa-84d9-4bd4-903d-02784a398676','backup_full','SUCCEEDED',1,'{\"source\": \"manual\", \"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',1,3,'2026-09-04 18:01:23','2026-09-04 18:01:24','2026-09-04 18:01:24',NULL,'{\"backupId\": \"6d4eeb89-c2a4-442b-9cab-a23268163024\", \"checksum\": \"9c63a2eb6f3f57767f89081633f39e1791e12164709d0c63e457039060abc207\", \"fileName\": \"blue_ocean_pos_full_20260904_180123.sql\", \"sizeBytes\": 340556, \"tableCount\": 195}','538dd563-88aa-4c96-8213-f1ebc6664a49','2026-09-04 18:01:23','2026-09-04 18:01:24'),('96daa88d-63a6-42ab-a7c2-452171341939','1798fdaa-84d9-4bd4-903d-02784a398676','scheduled_check','SUCCEEDED',6,'{\"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',1,3,'2026-09-04 18:06:46','2026-09-04 18:06:47','2026-09-04 18:06:47',NULL,'{\"fired\": {}, \"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',NULL,'2026-09-04 18:06:46','2026-09-04 18:06:47'),('9adcbe7f-2676-43de-9a4d-95f3a821f0e9','1798fdaa-84d9-4bd4-903d-02784a398676','backup_full','SUCCEEDED',1,'{\"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',1,3,'2026-09-04 18:01:01','2026-09-04 18:01:02','2026-09-04 18:01:02',NULL,'{\"backupId\": \"1c2c043f-daaf-4d11-a6de-69829d0ec160\", \"checksum\": \"358bf82c64e692534f5cebbb67ba6d2e5146331ba96e46026449f01abcbb849a\", \"fileName\": \"blue_ocean_pos_full_20260904_180101.sql\", \"sizeBytes\": 339186, \"tableCount\": 195}','system-scheduler','2026-09-04 18:01:01','2026-09-04 18:01:02'),('a3ad6290-e1d8-4725-a5b5-39a212ab83fe','1798fdaa-84d9-4bd4-903d-02784a398676','scheduled_check','SUCCEEDED',6,'{\"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',1,3,'2026-09-04 18:03:02','2026-09-04 18:03:03','2026-09-04 18:03:03',NULL,'{\"fired\": {}, \"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',NULL,'2026-09-04 18:03:03','2026-09-04 18:03:03'),('ab9235d9-4b20-4041-9ba2-5fd1d2b324ed','1798fdaa-84d9-4bd4-903d-02784a398676','backup_full','SUCCEEDED',1,'{\"source\": \"manual\", \"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',1,3,'2026-09-04 18:05:06','2026-09-04 18:05:07','2026-09-04 18:05:08',NULL,'{\"backupId\": \"4a583b22-2302-4a74-958c-c1c049ca3d76\", \"checksum\": \"b3dab93de5c7af75e5312663714d8d8979f6764e4281772d4dd548061270f56f\", \"fileName\": \"blue_ocean_pos_full_20260904_180506.sql\", \"sizeBytes\": 345742, \"tableCount\": 195}','538dd563-88aa-4c96-8213-f1ebc6664a49','2026-09-04 18:05:07','2026-09-04 18:05:08'),('c4ea180d-78a6-42dd-977a-02dcd00be458','1798fdaa-84d9-4bd4-903d-02784a398676','backup_full','RUNNING',1,'{\"source\": \"manual\", \"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',1,3,'2026-09-04 18:08:09','2026-09-04 18:08:09',NULL,NULL,NULL,'538dd563-88aa-4c96-8213-f1ebc6664a49','2026-09-04 18:08:09','2026-09-04 18:08:09'),('c7fbae57-7b51-497c-80a9-e46bdc10c554','1798fdaa-84d9-4bd4-903d-02784a398676','backup_full','SUCCEEDED',1,'{\"source\": \"manual\", \"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',1,3,'2026-09-04 18:04:54','2026-09-04 18:04:54','2026-09-04 18:04:55',NULL,'{\"backupId\": \"ded04abd-af45-49eb-8c7a-47500d65c911\", \"checksum\": \"116b04d2881131352bb5df454382f67b4ae3da4a45df4b10263708eeda0cf40f\", \"fileName\": \"blue_ocean_pos_full_20260904_180454.sql\", \"sizeBytes\": 344395, \"tableCount\": 195}','538dd563-88aa-4c96-8213-f1ebc6664a49','2026-09-04 18:04:54','2026-09-04 18:04:55'),('e2e6b42e-8680-4398-a458-581eea48546b','1798fdaa-84d9-4bd4-903d-02784a398676','scheduled_check','SUCCEEDED',6,'{\"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',1,3,'2026-09-04 17:56:41','2026-09-04 17:56:42','2026-09-04 17:56:42',NULL,'{\"fired\": {}, \"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',NULL,'2026-09-04 17:56:41','2026-09-04 17:56:42'),('eb1328ef-738d-4aaf-bbbe-7d8f60a6e82c','1798fdaa-84d9-4bd4-903d-02784a398676','scheduled_check','SUCCEEDED',6,'{\"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',1,3,'2026-09-04 17:54:40','2026-09-04 17:54:41','2026-09-04 17:54:41',NULL,'{\"fired\": {}, \"tenantId\": \"1798fdaa-84d9-4bd4-903d-02784a398676\"}',NULL,'2026-09-04 17:54:41','2026-09-04 17:54:41');
/*!40000 ALTER TABLE `background_jobs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `batches` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouseId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `batchNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mfgDate` date DEFAULT NULL,
  `expiryDate` date DEFAULT NULL,
  `qty` decimal(14,3) NOT NULL DEFAULT '0.000',
  `costPrice` decimal(14,2) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `batches_tenantId_productId_batchNo_key` (`tenantId`,`productId`,`batchNo`),
  KEY `batches_tenantId_idx` (`tenantId`),
  KEY `batches_expiryDate_idx` (`expiryDate`),
  KEY `batches_productId_fkey` (`productId`),
  CONSTRAINT `batches_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `batches` WRITE;
/*!40000 ALTER TABLE `batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `batches` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `companyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `branches_tenantId_code_key` (`tenantId`,`code`),
  KEY `branches_tenantId_idx` (`tenantId`),
  KEY `branches_companyId_idx` (`companyId`),
  CONSTRAINT `branches_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES ('ed473c6b-0351-4864-a23b-68125a1dcdc5','1798fdaa-84d9-4bd4-903d-02784a398676','seed-company','DHK-01','Dhanmondi Branch',NULL,NULL,NULL,'ACTIVE','2026-09-04 17:25:43.332','2026-09-04 17:25:43.332',NULL,NULL);
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brands` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `brands_tenantId_name_key` (`tenantId`,`name`),
  KEY `brands_tenantId_idx` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES ('2d1877e5-3b96-45ac-a5c0-501a360fd5db','1798fdaa-84d9-4bd4-903d-02784a398676','Local','ACTIVE','2026-09-04 17:25:43.396','2026-09-04 17:25:43.396',NULL,NULL);
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scopeType` enum('BRANCH','DEPARTMENT','CATEGORY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `scopeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `periodType` enum('MONTHLY','QUARTERLY','YEARLY','CUSTOM') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MONTHLY',
  `periodStart` date NOT NULL,
  `periodEnd` date NOT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `note` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('DRAFT','ACTIVE','CLOSED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_bd_scope_period` (`tenantId`,`scopeType`,`scopeId`,`periodStart`,`periodEnd`),
  KEY `idx_bd_tenant` (`tenantId`),
  KEY `idx_bd_scope` (`scopeType`,`scopeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `budgets` WRITE;
/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
/*!40000 ALTER TABLE `budgets` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `business_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `business_rules` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `triggerType` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'LOW_STOCK/SALE_DISCOUNT/VIP_CUSTOMER/CREDIT_SALE',
  `conditions` json DEFAULT NULL,
  `actions` json NOT NULL COMMENT 'actions JSON - list of type/params objects',
  `priority` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `lastFiredAt` datetime DEFAULT NULL,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_br_tenant` (`tenantId`),
  KEY `idx_br_trigger` (`triggerType`,`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `business_rules` WRITE;
/*!40000 ALTER TABLE `business_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `business_rules` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `cash_shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cash_shifts` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `terminalId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shiftNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `openingCash` decimal(14,2) NOT NULL DEFAULT '0.00',
  `expectedCash` decimal(14,2) DEFAULT NULL,
  `countedCash` decimal(14,2) DEFAULT NULL,
  `variance` decimal(14,2) DEFAULT NULL,
  `needsApproval` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN',
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `openedAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `closedAt` datetime(3) DEFAULT NULL,
  `approvedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_cs_tenant` (`tenantId`),
  KEY `idx_cs_branch` (`branchId`),
  KEY `idx_cs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `cash_shifts` WRITE;
/*!40000 ALTER TABLE `cash_shifts` DISABLE KEYS */;
INSERT INTO `cash_shifts` VALUES ('eafed509-a858-11f1-8c08-141333ebccfd','1798fdaa-84d9-4bd4-903d-02784a398676','ed473c6b-0351-4864-a23b-68125a1dcdc5',NULL,'538dd563-88aa-4c96-8213-f1ebc6664a49','SHF-1A06C4F3E9A',5000.00,NULL,NULL,NULL,0,'OPEN',NULL,'2026-09-04 18:05:27.835',NULL,NULL,NULL,'538dd563-88aa-4c96-8213-f1ebc6664a49',NULL,'2026-09-04 18:05:27.835','2026-09-04 18:05:27.000');
/*!40000 ALTER TABLE `cash_shifts` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parentId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_tenantId_parentId_name_key` (`tenantId`,`parentId`,`name`),
  KEY `categories_tenantId_idx` (`tenantId`),
  KEY `categories_parentId_idx` (`parentId`),
  CONSTRAINT `categories_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES ('daeafb68-d12d-4e75-9e65-b98559af691d','1798fdaa-84d9-4bd4-903d-02784a398676',NULL,'Beverages',NULL,'ACTIVE','2026-09-04 17:25:43.395','2026-09-04 17:25:43.395',NULL,NULL);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `channel_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `channel_orders` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channelId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `externalOrderId` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'order ID from external channel',
  `salesOrderId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'linked internal sales_order',
  `status` enum('RECEIVED','VALIDATED','ALLOCATED','SHIPPED','DELIVERED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RECEIVED',
  `customerName` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerPhone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerEmail` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shippingAddress` text COLLATE utf8mb4_unicode_ci,
  `items` json NOT NULL COMMENT '[{"productId","name","qty","unitPrice"}]',
  `totalAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `paymentMethod` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paymentStatus` enum('UNPAID','PAID','REFUNDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNPAID',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_co_tenant` (`tenantId`,`status`),
  KEY `idx_co_channel` (`channelId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `channel_orders` WRITE;
/*!40000 ALTER TABLE `channel_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `channel_orders` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `commission_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commission_rules` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `agentUserId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agentType` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'SALES_AGENT',
  `commissionType` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rate` decimal(10,2) DEFAULT NULL,
  `fixedAmount` decimal(14,2) DEFAULT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoryId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `targetAmount` decimal(14,2) DEFAULT NULL,
  `slabConfig` text COLLATE utf8mb4_unicode_ci,
  `collectionRate` decimal(10,2) DEFAULT NULL,
  `priority` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_cr_tenant` (`tenantId`),
  KEY `idx_cr_agent` (`agentUserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `commission_rules` WRITE;
/*!40000 ALTER TABLE `commission_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `commission_rules` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `commissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commissions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `saleId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agentUserId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agentName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `commissionType` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `basisAmount` decimal(14,2) NOT NULL,
  `rate` decimal(9,4) DEFAULT NULL,
  `amount` decimal(14,2) NOT NULL,
  `status` enum('CALCULATED','PENDING','APPROVED','PAYABLE','PAID','REVERSED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CALCULATED',
  `approvedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedAt` datetime(3) DEFAULT NULL,
  `paidAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `commissions_tenantId_idx` (`tenantId`),
  KEY `commissions_saleId_idx` (`saleId`),
  KEY `commissions_agentUserId_fkey` (`agentUserId`),
  CONSTRAINT `commissions_agentUserId_fkey` FOREIGN KEY (`agentUserId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `commissions_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sales` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `commissions` WRITE;
/*!40000 ALTER TABLE `commissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `commissions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `legalName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vatRegNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logoUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `companies_tenantId_idx` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES ('seed-company','1798fdaa-84d9-4bd4-903d-02784a398676','Demo Restaurant Ltd.','Demo Restaurant Ltd.',NULL,NULL,NULL,NULL,NULL,'ACTIVE','2026-09-04 17:25:43.331','2026-09-04 17:25:43.331',NULL,NULL);
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `consignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consignments` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplierId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouseId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consignmentNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `totalQty` decimal(14,3) NOT NULL DEFAULT '0.000',
  `totalValue` decimal(14,2) NOT NULL DEFAULT '0.00',
  `commissionPct` decimal(6,2) NOT NULL DEFAULT '0.00',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN',
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_cn_tenant` (`tenantId`),
  KEY `idx_cn_supplier` (`supplierId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `consignments` WRITE;
/*!40000 ALTER TABLE `consignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `consignments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `coupon_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_products` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `couponId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `coupon_products_tenantId_couponId_productId_key` (`tenantId`,`couponId`,`productId`),
  KEY `coupon_products_tenantId_idx` (`tenantId`),
  KEY `coupon_products_couponId_idx` (`couponId`),
  KEY `coupon_products_productId_fkey` (`productId`),
  CONSTRAINT `coupon_products_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `coupon_products_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `coupon_products` WRITE;
/*!40000 ALTER TABLE `coupon_products` DISABLE KEYS */;
/*!40000 ALTER TABLE `coupon_products` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupons` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `promotionId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discountType` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PERCENTAGE',
  `discountValue` decimal(14,2) NOT NULL,
  `minAmount` decimal(14,2) DEFAULT NULL,
  `maxDiscount` decimal(14,2) DEFAULT NULL,
  `usageLimit` int DEFAULT NULL,
  `usageCount` int NOT NULL DEFAULT '0',
  `perCustomerLimit` int DEFAULT NULL,
  `validFrom` datetime(3) DEFAULT NULL,
  `validTo` datetime(3) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `coupons_tenantId_code_key` (`tenantId`,`code`),
  KEY `coupons_tenantId_idx` (`tenantId`),
  KEY `coupons_promotionId_fkey` (`promotionId`),
  CONSTRAINT `coupons_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `promotions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `coupons` WRITE;
/*!40000 ALTER TABLE `coupons` DISABLE KEYS */;
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `currencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `currencies` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'BDT, USD, EUR, etc.',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Bangladeshi Taka, US Dollar',
  `symbol` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '৳, $, etc.',
  `decimalPlaces` int NOT NULL DEFAULT '2',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_curr_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `currencies` WRITE;
/*!40000 ALTER TABLE `currencies` DISABLE KEYS */;
/*!40000 ALTER TABLE `currencies` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `currency_pricing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `currency_pricing` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currencyCode` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(14,2) NOT NULL COMMENT 'Price in this currency',
  `minPrice` decimal(14,2) DEFAULT NULL,
  `wholesalePrice` decimal(14,2) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cp_product` (`tenantId`,`productId`,`currencyCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `currency_pricing` WRITE;
/*!40000 ALTER TABLE `currency_pricing` DISABLE KEYS */;
/*!40000 ALTER TABLE `currency_pricing` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `custom_field_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `custom_field_values` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fieldId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityType` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cfv` (`tenantId`,`fieldId`,`entityId`),
  KEY `idx_cfv_entity` (`tenantId`,`entityType`,`entityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `custom_field_values` WRITE;
/*!40000 ALTER TABLE `custom_field_values` DISABLE KEYS */;
/*!40000 ALTER TABLE `custom_field_values` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `custom_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `custom_fields` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityType` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'CUSTOMER/PRODUCT/SUPPLIER/EMPLOYEE/INVOICE/REPAIR_TICKET',
  `fieldName` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fieldType` enum('TEXT','NUMBER','DATE','BOOLEAN','DROPDOWN','MULTI_SELECT','FILE','CURRENCY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TEXT',
  `options` json DEFAULT NULL COMMENT '["opt1","opt2"] for DROPDOWN/MULTI_SELECT',
  `isRequired` tinyint(1) NOT NULL DEFAULT '0',
  `defaultValue` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `displayOrder` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cf` (`tenantId`,`entityType`,`fieldName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `custom_fields` WRITE;
/*!40000 ALTER TABLE `custom_fields` DISABLE KEYS */;
/*!40000 ALTER TABLE `custom_fields` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `custom_form_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `custom_form_templates` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `formType` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'REPAIR_INTAKE/ONBOARDING/SURVEY/etc.',
  `fields` json NOT NULL COMMENT '[{"fieldId","label","type","required","order"}]',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cft_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `custom_form_templates` WRITE;
/*!40000 ALTER TABLE `custom_form_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `custom_form_templates` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `customer_consents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_consents` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'SMS/EMAIL/WHATSAPP/PUSH/IN_APP',
  `status` enum('OPTED_IN','OPTED_OUT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPTED_IN',
  `updatedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_consent` (`tenantId`,`customerId`,`channel`),
  KEY `idx_consent_cust` (`customerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `customer_consents` WRITE;
/*!40000 ALTER TABLE `customer_consents` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_consents` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `customer_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_groups` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discountPercent` decimal(5,2) DEFAULT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_groups_tenantId_name_key` (`tenantId`,`name`),
  KEY `customer_groups_tenantId_idx` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `customer_groups` WRITE;
/*!40000 ALTER TABLE `customer_groups` DISABLE KEYS */;
INSERT INTO `customer_groups` VALUES ('abeba954-7595-4f4f-845e-ed8f003218d6','1798fdaa-84d9-4bd4-903d-02784a398676','General',0.00,NULL,'ACTIVE','2026-09-04 17:25:43.398','2026-09-04 17:25:43.398',NULL,NULL);
/*!40000 ALTER TABLE `customer_groups` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `groupId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creditLimit` decimal(14,2) NOT NULL DEFAULT '0.00',
  `creditPeriodDays` int DEFAULT NULL,
  `openingDue` decimal(14,2) NOT NULL DEFAULT '0.00',
  `currentDue` decimal(14,2) NOT NULL DEFAULT '0.00',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customers_tenantId_phone_key` (`tenantId`,`phone`),
  KEY `customers_tenantId_idx` (`tenantId`),
  KEY `customers_groupId_idx` (`groupId`),
  CONSTRAINT `customers_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `customer_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES ('0e11d777-9629-4fcd-b7a7-72746d1b11a6','1798fdaa-84d9-4bd4-903d-02784a398676','ed473c6b-0351-4864-a23b-68125a1dcdc5','abeba954-7595-4f4f-845e-ed8f003218d6','Core Walk-in','01900000000',NULL,NULL,0.00,NULL,0.00,0.00,'ACTIVE','2026-09-04 17:25:43.398','2026-09-04 17:25:43.398',NULL,NULL),('10e108d9-7681-4451-a498-f232715ddaa3','1798fdaa-84d9-4bd4-903d-02784a398676','ed473c6b-0351-4864-a23b-68125a1dcdc5','abeba954-7595-4f4f-845e-ed8f003218d6','Karim Mia','01822222222',NULL,NULL,0.00,NULL,0.00,0.00,'ACTIVE','2026-09-04 17:25:43.399','2026-09-04 17:25:43.399',NULL,NULL),('f9e7d87f-271a-48b8-a774-d080c04d4f1b','1798fdaa-84d9-4bd4-903d-02784a398676','ed473c6b-0351-4864-a23b-68125a1dcdc5','abeba954-7595-4f4f-845e-ed8f003218d6','Rahim Uddin','01811111111',NULL,NULL,0.00,NULL,0.00,0.00,'ACTIVE','2026-09-04 17:25:43.398','2026-09-04 17:25:43.398',NULL,NULL);
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `dashboard_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dashboard_configs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'NULL = team-wide default',
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'My Dashboard',
  `isDefault` tinyint(1) NOT NULL DEFAULT '0',
  `layout` json DEFAULT NULL COMMENT '{columns, rows}',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dc_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `dashboard_configs` WRITE;
/*!40000 ALTER TABLE `dashboard_configs` DISABLE KEYS */;
/*!40000 ALTER TABLE `dashboard_configs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `dashboard_widgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dashboard_widgets` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dashboardId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `widgetType` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'KPI_CARD/CHART/TABLE/LIST/GAUGE/MAP',
  `title` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `config` json DEFAULT NULL COMMENT '{endpoint, filters, chartType, color, etc.}',
  `posX` int NOT NULL DEFAULT '0',
  `posY` int NOT NULL DEFAULT '0',
  `width` int NOT NULL DEFAULT '6',
  `height` int NOT NULL DEFAULT '4',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dw_dashboard` (`dashboardId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `dashboard_widgets` WRITE;
/*!40000 ALTER TABLE `dashboard_widgets` DISABLE KEYS */;
/*!40000 ALTER TABLE `dashboard_widgets` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `deliveries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deliveries` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `saleId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoiceId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deliveryNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `riderName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assignedToUserId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scheduledAt` datetime(3) DEFAULT NULL,
  `deliveredAt` datetime(3) DEFAULT NULL,
  `status` enum('PENDING','ASSIGNED','IN_TRANSIT','DELIVERED','FAILED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `deliveries_tenantId_deliveryNo_key` (`tenantId`,`deliveryNo`),
  KEY `deliveries_tenantId_idx` (`tenantId`),
  KEY `deliveries_saleId_idx` (`saleId`),
  KEY `deliveries_branchId_fkey` (`branchId`),
  KEY `deliveries_invoiceId_fkey` (`invoiceId`),
  KEY `deliveries_customerId_fkey` (`customerId`),
  CONSTRAINT `deliveries_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `deliveries_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `deliveries_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `deliveries_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sales` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `deliveries` WRITE;
/*!40000 ALTER TABLE `deliveries` DISABLE KEYS */;
/*!40000 ALTER TABLE `deliveries` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `delivery_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_orders` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deliveryNo` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sourceType` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SALE',
  `sourceId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `saleId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoiceId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerName` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerPhone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deliveryAddress` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zoneId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `routeId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `riderId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','PACKED','ASSIGNED','OUT_FOR_DELIVERY','DELIVERED','FAILED','RESCHEDULED','RETURNED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `paymentType` enum('PREPAID','COD') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PREPAID',
  `codAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `deliveryFee` decimal(14,2) NOT NULL DEFAULT '0.00',
  `totalAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `priority` enum('LOW','NORMAL','HIGH') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NORMAL',
  `scheduledAt` datetime DEFAULT NULL,
  `packedAt` datetime DEFAULT NULL,
  `assignedAt` datetime DEFAULT NULL,
  `dispatchedAt` datetime DEFAULT NULL,
  `deliveredAt` datetime DEFAULT NULL,
  `failedAt` datetime DEFAULT NULL,
  `rescheduleCount` int NOT NULL DEFAULT '0',
  `failureReason` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `podType` enum('NONE','SIGNATURE','PHOTO','BOTH') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NONE',
  `podSignature` text COLLATE utf8mb4_unicode_ci,
  `podPhotoUrl` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `podReceivedByName` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `returnedAt` datetime DEFAULT NULL,
  `returnReason` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_do_tenant_no` (`tenantId`,`deliveryNo`),
  KEY `idx_do_tenant` (`tenantId`),
  KEY `idx_do_status` (`status`),
  KEY `idx_do_sale` (`saleId`),
  KEY `idx_do_rider` (`riderId`),
  KEY `idx_do_branch` (`branchId`),
  KEY `idx_do_customer` (`customerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `delivery_orders` WRITE;
/*!40000 ALTER TABLE `delivery_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_orders` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `delivery_riders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_riders` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employeeId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zoneIds` text COLLATE utf8mb4_unicode_ci,
  `status` enum('AVAILABLE','BUSY','OFFLINE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AVAILABLE',
  `rating` decimal(3,2) NOT NULL DEFAULT '0.00',
  `deliveryCount` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dr2_tenant` (`tenantId`),
  KEY `idx_dr2_status` (`status`),
  KEY `idx_dr2_branch` (`branchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `delivery_riders` WRITE;
/*!40000 ALTER TABLE `delivery_riders` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_riders` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `delivery_routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_routes` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `zoneId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dr_tenant` (`tenantId`),
  KEY `idx_dr_zone` (`zoneId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `delivery_routes` WRITE;
/*!40000 ALTER TABLE `delivery_routes` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_routes` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `delivery_tracking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_tracking` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deliveryId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `note` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dt_tenant` (`tenantId`),
  KEY `idx_dt_delivery` (`deliveryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `delivery_tracking` WRITE;
/*!40000 ALTER TABLE `delivery_tracking` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_tracking` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `delivery_vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_vehicles` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BIKE',
  `plateNo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dv_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `delivery_vehicles` WRITE;
/*!40000 ALTER TABLE `delivery_vehicles` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_vehicles` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `delivery_zones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_zones` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `area` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deliveryFee` decimal(14,2) NOT NULL DEFAULT '0.00',
  `minOrderAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `freeDeliveryAbove` decimal(14,2) NOT NULL DEFAULT '0.00',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dz_tenant` (`tenantId`),
  KEY `idx_dz_branch` (`branchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `delivery_zones` WRITE;
/*!40000 ALTER TABLE `delivery_zones` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_zones` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `device_sync_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `device_sync_status` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deviceId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deviceName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `os` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastSyncAt` datetime DEFAULT NULL,
  `lastSyncSequence` int NOT NULL DEFAULT '0',
  `pendingCount` int NOT NULL DEFAULT '0',
  `failedCount` int NOT NULL DEFAULT '0',
  `syncHealth` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HEALTHY',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `isLocked` tinyint(1) NOT NULL DEFAULT '0',
  `lockedAt` datetime DEFAULT NULL,
  `lockedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_device` (`tenantId`,`deviceId`),
  KEY `idx_dst_tenant` (`tenantId`),
  KEY `idx_dst_branch` (`branchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `device_sync_status` WRITE;
/*!40000 ALTER TABLE `device_sync_status` DISABLE KEYS */;
/*!40000 ALTER TABLE `device_sync_status` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devices` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deviceType` enum('POS','KIOSK','KDS','MOBILE','WEB') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'POS',
  `os` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `appVersion` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastSyncAt` datetime(3) DEFAULT NULL,
  `lastIp` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','ACTIVE','DISABLED','BLOCKED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `devices_tenantId_code_key` (`tenantId`,`code`),
  KEY `devices_tenantId_idx` (`tenantId`),
  KEY `devices_branchId_idx` (`branchId`),
  CONSTRAINT `devices_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `devices` WRITE;
/*!40000 ALTER TABLE `devices` DISABLE KEYS */;
/*!40000 ALTER TABLE `devices` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `digital_signatures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `digital_signatures` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityType` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'DELIVERY/INVOICE/PURCHASE/APPROVAL/CONTRACT/SERVICE/CUSTOMER',
  `entityId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `signerName` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `signerRole` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signerEmail` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signatureData` text COLLATE utf8mb4_unicode_ci COMMENT 'base64-encoded image or typed text hash',
  `signatureType` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TYPED' COMMENT 'TYPED/DRAWN/UPLOAD',
  `ipAddress` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deviceInfo` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `isVerified` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ds_entity` (`tenantId`,`entityType`,`entityId`),
  KEY `idx_ds_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `digital_signatures` WRITE;
/*!40000 ALTER TABLE `digital_signatures` DISABLE KEYS */;
/*!40000 ALTER TABLE `digital_signatures` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `document_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_attachments` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityType` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'CUSTOMER/SUPPLIER/INVOICE/PURCHASE/EMPLOYEE/WARRANTY/PRESCRIPTION/DELIVERY/EXPENSE/SALE/QUOTATION/PURCHASE_ORDER',
  `entityId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `originalName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mimeType` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fileSize` bigint NOT NULL DEFAULT '0',
  `filePath` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'relative path under uploads/',
  `category` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'e.g. ID_PROOF, CONTRACT, RECEIPT, PHOTO',
  `description` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accessLevel` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PRIVATE' COMMENT 'PRIVATE/SHARED/PUBLIC',
  `expiryDate` date DEFAULT NULL,
  `version` int NOT NULL DEFAULT '1',
  `uploadedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_da_tenant` (`tenantId`),
  KEY `idx_da_entity` (`tenantId`,`entityType`,`entityId`),
  KEY `idx_da_expiry` (`expiryDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `document_attachments` WRITE;
/*!40000 ALTER TABLE `document_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_attachments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `document_audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_audit_log` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attachmentId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'UPLOAD/VIEW/DOWNLOAD/DELETE/UPDATE/VERSION',
  `entityType` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entityId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ipAddress` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dal_tenant` (`tenantId`),
  KEY `idx_dal_attachment` (`attachmentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `document_audit_log` WRITE;
/*!40000 ALTER TABLE `document_audit_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_audit_log` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `document_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_templates` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `docType` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'INVOICE/QUOTATION/PURCHASE_ORDER/DELIVERY_NOTE/RECEIPT/CONTRACT/CUSTOM',
  `config` json DEFAULT NULL COMMENT '{layout, fields[], branding, header, footer, terms}',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `isDefault` tinyint(1) NOT NULL DEFAULT '0',
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dt_tenant` (`tenantId`,`docType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `document_templates` WRITE;
/*!40000 ALTER TABLE `document_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_templates` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `document_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_versions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attachmentId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` int NOT NULL,
  `fileName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileSize` bigint NOT NULL DEFAULT '0',
  `filePath` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploadedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `changeNote` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dv_attachment` (`attachmentId`),
  KEY `idx_dv_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `document_versions` WRITE;
/*!40000 ALTER TABLE `document_versions` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_versions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `exchange_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exchange_rates` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fromCurrency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `toCurrency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rate` decimal(20,8) NOT NULL COMMENT '1 fromCurrency = rate toCurrency',
  `source` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'MANUAL' COMMENT 'MANUAL, API, ECB, OPEN_EXCHANGE',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `effectiveFrom` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `effectiveTo` datetime DEFAULT NULL COMMENT 'NULL = still active',
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_er_tenant` (`tenantId`,`fromCurrency`,`toCurrency`),
  KEY `idx_er_effective` (`tenantId`,`fromCurrency`,`toCurrency`,`effectiveFrom`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `exchange_rates` WRITE;
/*!40000 ALTER TABLE `exchange_rates` DISABLE KEYS */;
/*!40000 ALTER TABLE `exchange_rates` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `expense_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_categories` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `group` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'OPERATING',
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_ec_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `expense_categories` WRITE;
/*!40000 ALTER TABLE `expense_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `expense_categories` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoryId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `expenseDate` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `paymentMethod` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CASH',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `shiftId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recurringExpenseId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_exp_tenant` (`tenantId`),
  KEY `idx_exp_branch` (`branchId`),
  KEY `idx_exp_category` (`categoryId`),
  KEY `idx_exp_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES ('217e093d-a857-11f1-8c08-141333ebccfd','1798fdaa-84d9-4bd4-903d-02784a398676',NULL,NULL,'P3922385 Auto','Auto-generated by background job queue',77.00,'2026-09-04 17:52:40.000','BANK','PENDING',NULL,'96565a92-a856-11f1-8c08-141333ebccfd',NULL,NULL,NULL,'system',NULL,'2026-09-04 17:52:40.272','2026-09-04 17:52:40.272');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `export_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `export_jobs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityType` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'PRODUCTS,CUSTOMERS,SALES,INVENTORY,ACCOUNTING',
  `format` enum('CSV','EXCEL','PDF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CSV',
  `filters` json DEFAULT NULL COMMENT 'Export filter params',
  `status` enum('PENDING','PROCESSING','COMPLETED','FAILED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `totalRows` int NOT NULL DEFAULT '0',
  `filePath` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fileSize` int DEFAULT NULL,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ej_tenant` (`tenantId`,`entityType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `export_jobs` WRITE;
/*!40000 ALTER TABLE `export_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `export_jobs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `feature_flags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feature_flags` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `moduleCode` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'POS/INVENTORY/RESTAURANT/SALON/etc.',
  `isEnabled` tinyint(1) NOT NULL DEFAULT '1',
  `config` json DEFAULT NULL COMMENT 'module-specific config overrides',
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ff` (`tenantId`,`moduleCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `feature_flags` WRITE;
/*!40000 ALTER TABLE `feature_flags` DISABLE KEYS */;
/*!40000 ALTER TABLE `feature_flags` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `franchise_branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `franchise_branches` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `franchiseId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouseId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `startDate` date DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_fb_franchise_branch` (`tenantId`,`franchiseId`,`branchId`),
  KEY `idx_fb_tenant` (`tenantId`),
  KEY `idx_fb_franchise` (`franchiseId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `franchise_branches` WRITE;
/*!40000 ALTER TABLE `franchise_branches` DISABLE KEYS */;
/*!40000 ALTER TABLE `franchise_branches` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `franchise_settlement_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `franchise_settlement_lines` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `settlementId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grossSales` decimal(14,2) NOT NULL DEFAULT '0.00',
  `returnsTotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `netSales` decimal(14,2) NOT NULL DEFAULT '0.00',
  `royaltyAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fsl_tenant` (`tenantId`),
  KEY `idx_fsl_settlement` (`settlementId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `franchise_settlement_lines` WRITE;
/*!40000 ALTER TABLE `franchise_settlement_lines` DISABLE KEYS */;
/*!40000 ALTER TABLE `franchise_settlement_lines` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `franchise_settlements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `franchise_settlements` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `franchiseId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `settlementNo` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `periodStart` date NOT NULL,
  `periodEnd` date NOT NULL,
  `grossSales` decimal(14,2) NOT NULL DEFAULT '0.00',
  `returnsTotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `netSales` decimal(14,2) NOT NULL DEFAULT '0.00',
  `royaltyRatePct` decimal(6,2) NOT NULL DEFAULT '0.00',
  `royaltyAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `feeAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `commissionAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `totalAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `status` enum('DRAFT','APPROVED','PAID','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `approvedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedAt` datetime DEFAULT NULL,
  `paidAt` datetime DEFAULT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_fs_franchise_period` (`tenantId`,`franchiseId`,`periodStart`,`periodEnd`),
  KEY `idx_fs_tenant` (`tenantId`),
  KEY `idx_fs_franchise` (`franchiseId`),
  KEY `idx_fs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `franchise_settlements` WRITE;
/*!40000 ALTER TABLE `franchise_settlements` DISABLE KEYS */;
/*!40000 ALTER TABLE `franchise_settlements` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `franchises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `franchises` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `franchiseNo` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contactPerson` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `territory` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `openingFee` decimal(14,2) NOT NULL DEFAULT '0.00',
  `royaltyRatePct` decimal(6,2) NOT NULL DEFAULT '5.00',
  `commissionRatePct` decimal(6,2) NOT NULL DEFAULT '0.00',
  `contractStart` date DEFAULT NULL,
  `contractEnd` date DEFAULT NULL,
  `status` enum('ACTIVE','SUSPENDED','TERMINATED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_fr_tenant_no` (`tenantId`,`franchiseNo`),
  KEY `idx_fr_tenant` (`tenantId`),
  KEY `idx_fr_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `franchises` WRITE;
/*!40000 ALTER TABLE `franchises` DISABLE KEYS */;
/*!40000 ALTER TABLE `franchises` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `gift_card_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gift_card_transactions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cardId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('ISSUE','REDEEM','RELOAD','REFUND','DISABLE','ADJUST') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `balanceBefore` decimal(14,2) NOT NULL DEFAULT '0.00',
  `balanceAfter` decimal(14,2) NOT NULL DEFAULT '0.00',
  `refType` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `saleId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_gct_tenant` (`tenantId`),
  KEY `idx_gct_card` (`cardId`),
  KEY `idx_gct_sale` (`saleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `gift_card_transactions` WRITE;
/*!40000 ALTER TABLE `gift_card_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `gift_card_transactions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `gift_cards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gift_cards` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cardNo` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cardType` enum('PHYSICAL','DIGITAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DIGITAL',
  `barcode` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pin` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `initialAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `balance` decimal(14,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BDT',
  `expiryDate` date DEFAULT NULL,
  `status` enum('ACTIVE','DISABLED','EXPIRED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `issuedToCustomerId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issuedToName` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_gc_tenant_no` (`tenantId`,`cardNo`),
  KEY `idx_gc_tenant` (`tenantId`),
  KEY `idx_gc_status` (`status`),
  KEY `idx_gc_customer` (`issuedToCustomerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `gift_cards` WRITE;
/*!40000 ALTER TABLE `gift_cards` DISABLE KEYS */;
/*!40000 ALTER TABLE `gift_cards` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `goods_receipt_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `goods_receipt_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `goodsReceiptId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `variantId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qty` decimal(14,3) NOT NULL,
  `qtyRejected` decimal(14,3) NOT NULL DEFAULT '0.000',
  `costPrice` decimal(14,2) NOT NULL,
  `batchNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `goods_receipt_items_tenantId_idx` (`tenantId`),
  KEY `goods_receipt_items_goodsReceiptId_idx` (`goodsReceiptId`),
  KEY `goods_receipt_items_productId_fkey` (`productId`),
  CONSTRAINT `goods_receipt_items_goodsReceiptId_fkey` FOREIGN KEY (`goodsReceiptId`) REFERENCES `goods_receipts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `goods_receipt_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `goods_receipt_items` WRITE;
/*!40000 ALTER TABLE `goods_receipt_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `goods_receipt_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `goods_receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `goods_receipts` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouseId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplierId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purchaseOrderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grnNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receivedDate` date NOT NULL,
  `status` enum('DRAFT','RECEIVED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `goods_receipts_tenantId_grnNo_key` (`tenantId`,`grnNo`),
  KEY `goods_receipts_tenantId_idx` (`tenantId`),
  KEY `goods_receipts_supplierId_idx` (`supplierId`),
  KEY `goods_receipts_purchaseOrderId_fkey` (`purchaseOrderId`),
  KEY `goods_receipts_branchId_fkey` (`branchId`),
  KEY `goods_receipts_warehouseId_fkey` (`warehouseId`),
  CONSTRAINT `goods_receipts_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `goods_receipts_purchaseOrderId_fkey` FOREIGN KEY (`purchaseOrderId`) REFERENCES `purchase_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `goods_receipts_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `goods_receipts_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `goods_receipts` WRITE;
/*!40000 ALTER TABLE `goods_receipts` DISABLE KEYS */;
/*!40000 ALTER TABLE `goods_receipts` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `hardware_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hardware_jobs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deviceId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deviceType` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Which device type this job targets',
  `jobType` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'PRINT_RECEIPT, PRINT_LABEL, OPEN_DRAWER, SCAN_RESULT, DISPLAY_MSG',
  `payload` json NOT NULL COMMENT 'Job-specific data (receipt HTML, label data, etc.)',
  `status` enum('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `attempts` int NOT NULL DEFAULT '0',
  `maxAttempts` int NOT NULL DEFAULT '3',
  `lastError` text COLLATE utf8mb4_unicode_ci,
  `result` json DEFAULT NULL COMMENT 'Job result data',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_hj_tenant` (`tenantId`,`status`),
  KEY `idx_hj_device` (`deviceId`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `hardware_jobs` WRITE;
/*!40000 ALTER TABLE `hardware_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `hardware_jobs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `hrm_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hrm_attendance` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attendanceDate` date NOT NULL,
  `clockIn` datetime DEFAULT NULL,
  `clockOut` datetime DEFAULT NULL,
  `totalHours` decimal(6,2) DEFAULT NULL,
  `overtimeHours` decimal(6,2) DEFAULT '0.00',
  `status` enum('PRESENT','ABSENT','HALF_DAY','LATE','ON_LEAVE','HOLIDAY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PRESENT',
  `note` text COLLATE utf8mb4_unicode_ci,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_att_emp_date` (`tenantId`,`employeeId`,`attendanceDate`),
  KEY `idx_att_tenant` (`tenantId`),
  KEY `idx_att_emp` (`employeeId`),
  KEY `idx_att_date` (`attendanceDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `hrm_attendance` WRITE;
/*!40000 ALTER TABLE `hrm_attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `hrm_attendance` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `hrm_departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hrm_departments` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `managerId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parentId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dept_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `hrm_departments` WRITE;
/*!40000 ALTER TABLE `hrm_departments` DISABLE KEYS */;
/*!40000 ALTER TABLE `hrm_departments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `hrm_designations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hrm_designations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `departmentId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `level` int NOT NULL DEFAULT '0',
  `minSalary` decimal(12,2) DEFAULT NULL,
  `maxSalary` decimal(12,2) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_desig_tenant` (`tenantId`),
  KEY `idx_desig_dept` (`departmentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `hrm_designations` WRITE;
/*!40000 ALTER TABLE `hrm_designations` DISABLE KEYS */;
/*!40000 ALTER TABLE `hrm_designations` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `hrm_employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hrm_employees` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employeeNo` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `firstName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('MALE','FEMALE','OTHER') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dateOfBirth` date DEFAULT NULL,
  `joinDate` date NOT NULL,
  `departmentId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `designationId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reportingToId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employmentType` enum('FULL_TIME','PART_TIME','CONTRACT','INTERN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FULL_TIME',
  `status` enum('ACTIVE','INACTIVE','ON_LEAVE','TERMINATED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `basicSalary` decimal(12,2) NOT NULL DEFAULT '0.00',
  `bankName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bankAccount` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `emergencyContact` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergencyPhone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatarUrl` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_emp_tenant_no` (`tenantId`,`employeeNo`),
  KEY `idx_emp_tenant` (`tenantId`),
  KEY `idx_emp_dept` (`departmentId`),
  KEY `idx_emp_branch` (`branchId`),
  KEY `idx_emp_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `hrm_employees` WRITE;
/*!40000 ALTER TABLE `hrm_employees` DISABLE KEYS */;
/*!40000 ALTER TABLE `hrm_employees` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `hrm_leave_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hrm_leave_requests` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `leaveTypeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `totalDays` decimal(5,1) NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `status` enum('PENDING','APPROVED','REJECTED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `approvedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedAt` datetime DEFAULT NULL,
  `rejectionReason` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lr_tenant` (`tenantId`),
  KEY `idx_lr_emp` (`employeeId`),
  KEY `idx_lr_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `hrm_leave_requests` WRITE;
/*!40000 ALTER TABLE `hrm_leave_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `hrm_leave_requests` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `hrm_leave_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hrm_leave_types` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `daysPerYear` int NOT NULL DEFAULT '0',
  `isPaid` tinyint(1) NOT NULL DEFAULT '1',
  `carryForward` tinyint(1) NOT NULL DEFAULT '0',
  `maxCarryDays` int DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lt_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `hrm_leave_types` WRITE;
/*!40000 ALTER TABLE `hrm_leave_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `hrm_leave_types` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `hrm_payroll`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hrm_payroll` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payrollNo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `month` int NOT NULL,
  `year` int NOT NULL,
  `totalEmployees` int NOT NULL DEFAULT '0',
  `totalBasic` decimal(14,2) NOT NULL DEFAULT '0.00',
  `totalAllowances` decimal(14,2) NOT NULL DEFAULT '0.00',
  `totalDeductions` decimal(14,2) NOT NULL DEFAULT '0.00',
  `totalNetPay` decimal(14,2) NOT NULL DEFAULT '0.00',
  `status` enum('DRAFT','PROCESSED','APPROVED','PAID','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `processedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `processedAt` datetime DEFAULT NULL,
  `approvedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payroll_tenant_period` (`tenantId`,`month`,`year`),
  KEY `idx_pay_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `hrm_payroll` WRITE;
/*!40000 ALTER TABLE `hrm_payroll` DISABLE KEYS */;
/*!40000 ALTER TABLE `hrm_payroll` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `hrm_payroll_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hrm_payroll_items` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payrollId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `basicSalary` decimal(12,2) NOT NULL DEFAULT '0.00',
  `allowances` decimal(12,2) NOT NULL DEFAULT '0.00',
  `allowancesDetail` text COLLATE utf8mb4_unicode_ci,
  `deductions` decimal(12,2) NOT NULL DEFAULT '0.00',
  `deductionsDetail` text COLLATE utf8mb4_unicode_ci,
  `overtimePay` decimal(12,2) NOT NULL DEFAULT '0.00',
  `leaveDeduction` decimal(12,2) NOT NULL DEFAULT '0.00',
  `netPay` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` enum('PENDING','PAID') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `paidAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pi_tenant` (`tenantId`),
  KEY `idx_pi_payroll` (`payrollId`),
  KEY `idx_pi_emp` (`employeeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `hrm_payroll_items` WRITE;
/*!40000 ALTER TABLE `hrm_payroll_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `hrm_payroll_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `hrm_performance_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hrm_performance_reviews` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reviewDate` date NOT NULL,
  `rating` decimal(3,1) NOT NULL DEFAULT '0.0',
  `strengths` text COLLATE utf8mb4_unicode_ci,
  `improvements` text COLLATE utf8mb4_unicode_ci,
  `goals` text COLLATE utf8mb4_unicode_ci,
  `status` enum('DRAFT','SUBMITTED','APPROVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `reviewedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pr_tenant` (`tenantId`),
  KEY `idx_pr_employee` (`employeeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `hrm_performance_reviews` WRITE;
/*!40000 ALTER TABLE `hrm_performance_reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `hrm_performance_reviews` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `hrm_shift_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hrm_shift_assignments` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shiftId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assignmentDate` date NOT NULL,
  `status` enum('ASSIGNED','COMPLETED','MISSED','SWAPPED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ASSIGNED',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sa_shift_emp_date` (`tenantId`,`shiftId`,`employeeId`,`assignmentDate`),
  KEY `idx_sa_tenant` (`tenantId`),
  KEY `idx_sa_emp` (`employeeId`),
  KEY `idx_sa_date` (`assignmentDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `hrm_shift_assignments` WRITE;
/*!40000 ALTER TABLE `hrm_shift_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `hrm_shift_assignments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `hrm_shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hrm_shifts` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `startTime` time NOT NULL,
  `endTime` time NOT NULL,
  `breakMinutes` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_shift_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `hrm_shifts` WRITE;
/*!40000 ALTER TABLE `hrm_shifts` DISABLE KEYS */;
/*!40000 ALTER TABLE `hrm_shifts` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `inapp_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inapp_notifications` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'NULL = broadcast/role',
  `eventType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` text COLLATE utf8mb4_unicode_ci,
  `refType` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `readAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ian_user` (`userId`,`isRead`),
  KEY `idx_ian_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `inapp_notifications` WRITE;
/*!40000 ALTER TABLE `inapp_notifications` DISABLE KEYS */;
INSERT INTO `inapp_notifications` VALUES ('06944511-0eb7-4546-958a-daa8bd8e4109','1798fdaa-84d9-4bd4-903d-02784a398676','538dd563-88aa-4c96-8213-f1ebc6664a49','SYNC_FAILURE','Sync failed — p40_23584-device','Sync failed for p40_23584-device (3 failed, 0 conflicted out of 3 uploaded). Check the connection and retry.',NULL,NULL,0,'2026-09-04 18:06:45',NULL),('06c49158-7913-4b6f-80c6-c4804bf000bf','1798fdaa-84d9-4bd4-903d-02784a398676','538dd563-88aa-4c96-8213-f1ebc6664a49','SYNC_FAILURE','Sync failed — p40_23584-device','Sync failed for p40_23584-device (4 failed, 0 conflicted out of 4 uploaded). Check the connection and retry.',NULL,NULL,0,'2026-09-04 18:06:45',NULL),('3430ca16-f258-4386-b929-f9644d9e6fc4','1798fdaa-84d9-4bd4-903d-02784a398676',NULL,'QUEUE_NOTIFICATION','x','y',NULL,NULL,0,'2026-09-04 17:52:49',NULL),('5358c865-04b9-4483-b850-19e661900687','1798fdaa-84d9-4bd4-903d-02784a398676','538dd563-88aa-4c96-8213-f1ebc6664a49','SYNC_FAILURE','Sync failed — p40_23584-device','Sync failed for p40_23584-device (2 failed, 0 conflicted out of 2 uploaded). Check the connection and retry.',NULL,NULL,0,'2026-09-04 18:06:45',NULL),('624a6581-fca7-41f7-bead-b94d465d8fce','1798fdaa-84d9-4bd4-903d-02784a398676','538dd563-88aa-4c96-8213-f1ebc6664a49','SYNC_FAILURE','Sync failed — p40_23584-device','Sync failed for p40_23584-device (4 failed, 0 conflicted out of 4 uploaded). Check the connection and retry.',NULL,NULL,0,'2026-09-04 18:06:45',NULL),('92db7466-c25a-4562-be18-aa7f8cd25f4f','1798fdaa-84d9-4bd4-903d-02784a398676','538dd563-88aa-4c96-8213-f1ebc6664a49','SYNC_FAILURE','Sync failed — p40_23584-device','Sync failed for p40_23584-device (2 failed, 0 conflicted out of 2 uploaded). Check the connection and retry.',NULL,NULL,0,'2026-09-04 18:06:45',NULL),('afbaf7ba-60b8-499c-a121-8b93343e7eed','1798fdaa-84d9-4bd4-903d-02784a398676','538dd563-88aa-4c96-8213-f1ebc6664a49','SYNC_FAILURE','Sync failed — p40_23584-device','Sync failed for p40_23584-device (4 failed, 0 conflicted out of 4 uploaded). Check the connection and retry.',NULL,NULL,0,'2026-09-04 18:06:45',NULL),('d58380b3-fd87-4639-98b1-f8bf1c4bd9c0','1798fdaa-84d9-4bd4-903d-02784a398676','538dd563-88aa-4c96-8213-f1ebc6664a49','SYNC_FAILURE','Sync failed — p40_23584-device','Sync failed for p40_23584-device (3 failed, 0 conflicted out of 3 uploaded). Check the connection and retry.',NULL,NULL,0,'2026-09-04 18:06:45',NULL),('e48545ad-1b5f-45c4-a71f-b84903ca27a9','1798fdaa-84d9-4bd4-903d-02784a398676','538dd563-88aa-4c96-8213-f1ebc6664a49','SYNC_FAILURE','Sync failed — p40_23584-device','Sync failed for p40_23584-device (4 failed, 0 conflicted out of 4 uploaded). Check the connection and retry.',NULL,NULL,0,'2026-09-04 18:06:45',NULL);
/*!40000 ALTER TABLE `inapp_notifications` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `installment_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `installment_schedules` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `installmentId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sequenceNo` int NOT NULL,
  `dueDate` date NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `paidAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `paidAt` datetime(3) DEFAULT NULL,
  `status` enum('DUE','PAID','PARTIAL','OVERDUE','WAIVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DUE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `installment_schedules_tenantId_installmentId_sequenceNo_key` (`tenantId`,`installmentId`,`sequenceNo`),
  KEY `installment_schedules_tenantId_idx` (`tenantId`),
  KEY `installment_schedules_installmentId_fkey` (`installmentId`),
  CONSTRAINT `installment_schedules_installmentId_fkey` FOREIGN KEY (`installmentId`) REFERENCES `installments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `installment_schedules` WRITE;
/*!40000 ALTER TABLE `installment_schedules` DISABLE KEYS */;
/*!40000 ALTER TABLE `installment_schedules` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `installments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `installments` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `saleId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoiceId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `planNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `financedAmount` decimal(14,2) NOT NULL,
  `downPayment` decimal(14,2) NOT NULL DEFAULT '0.00',
  `installmentCount` int NOT NULL,
  `frequency` enum('WEEKLY','MONTHLY','CUSTOM') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MONTHLY',
  `installmentAmount` decimal(14,2) NOT NULL,
  `startDate` date NOT NULL,
  `status` enum('ACTIVE','COMPLETED','DEFAULTED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `installments_tenantId_planNo_key` (`tenantId`,`planNo`),
  KEY `installments_tenantId_idx` (`tenantId`),
  KEY `installments_customerId_idx` (`customerId`),
  KEY `installments_saleId_fkey` (`saleId`),
  KEY `installments_invoiceId_fkey` (`invoiceId`),
  CONSTRAINT `installments_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `installments_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `installments_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sales` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `installments` WRITE;
/*!40000 ALTER TABLE `installments` DISABLE KEYS */;
/*!40000 ALTER TABLE `installments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `integrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `integrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'e.g. STRIPE, bKASH, TWILIO',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'PAYMENT, SMS, EMAIL, ACCOUNTING, MARKETPLACE, LOGISTICS, POS',
  `description` text COLLATE utf8mb4_unicode_ci,
  `config` json DEFAULT NULL COMMENT 'Tenant-specific config/credentials',
  `isEnabled` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('AVAILABLE','ENABLED','CONFIGURED','ERROR') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AVAILABLE',
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `docsUrl` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastSyncAt` datetime DEFAULT NULL,
  `lastSyncStatus` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_int_code` (`tenantId`,`code`),
  KEY `idx_int_tenant` (`tenantId`,`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `integrations` WRITE;
/*!40000 ALTER TABLE `integrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `integrations` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoiceId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qty` decimal(14,3) NOT NULL,
  `unitPrice` decimal(14,2) NOT NULL,
  `discountAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `taxAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `lineTotal` decimal(14,2) NOT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `invoice_items_tenantId_idx` (`tenantId`),
  KEY `invoice_items_invoiceId_idx` (`invoiceId`),
  KEY `invoice_items_productId_fkey` (`productId`),
  CONSTRAINT `invoice_items_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `invoice_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `invoice_items` WRITE;
/*!40000 ALTER TABLE `invoice_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoice_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `saleId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoiceNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoiceType` enum('TAX','STANDARD','CREDIT_NOTE','DEBIT_NOTE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TAX',
  `issueDate` date NOT NULL,
  `dueDate` date DEFAULT NULL,
  `subtotal` decimal(14,2) NOT NULL,
  `discountTotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `taxTotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total` decimal(14,2) NOT NULL,
  `paidTotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `status` enum('ISSUED','PARTIALLY_PAID','PAID','VOID') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ISSUED',
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoices_tenantId_invoiceNo_key` (`tenantId`,`invoiceNo`),
  KEY `invoices_tenantId_idx` (`tenantId`),
  KEY `invoices_branchId_idx` (`branchId`),
  KEY `invoices_customerId_idx` (`customerId`),
  KEY `invoices_saleId_idx` (`saleId`),
  CONSTRAINT `invoices_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `invoices_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `invoices_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sales` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `journals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `journals` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `journalNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `journalDate` date NOT NULL,
  `refType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `narration` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('DRAFT','POSTED','REVERSED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `postedAt` datetime(3) DEFAULT NULL,
  `reversedByJournalId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `journals_tenantId_journalNo_key` (`tenantId`,`journalNo`),
  KEY `journals_tenantId_idx` (`tenantId`),
  KEY `journals_journalDate_idx` (`journalDate`),
  KEY `journals_refType_refId_idx` (`refType`,`refId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `journals` WRITE;
/*!40000 ALTER TABLE `journals` DISABLE KEYS */;
/*!40000 ALTER TABLE `journals` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `kiosk_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kiosk_sessions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kioskId` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('IDLE','BROWSING','CART','PAYMENT','ORDER_PLACED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IDLE',
  `cart` json DEFAULT NULL COMMENT '[{"productId","qty","unitPrice"}]',
  `totalAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ks_tenant` (`tenantId`,`branchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `kiosk_sessions` WRITE;
/*!40000 ALTER TABLE `kiosk_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `kiosk_sessions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `landed_costs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `landed_costs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `goodsReceiptId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplierId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `landedCostNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purchaseCost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `shippingCost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `customsCost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `insuranceCost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `handlingCost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `transportCost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `otherCost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `totalLandedCost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `allocationBasis` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'QTY',
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_lc_tenant` (`tenantId`),
  KEY `idx_lc_grn` (`goodsReceiptId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `landed_costs` WRITE;
/*!40000 ALTER TABLE `landed_costs` DISABLE KEYS */;
/*!40000 ALTER TABLE `landed_costs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `ledger_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ledger_entries` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `journalId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accountId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entryDate` date NOT NULL,
  `debit` decimal(14,2) NOT NULL DEFAULT '0.00',
  `credit` decimal(14,2) NOT NULL DEFAULT '0.00',
  `memo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ledger_entries_tenantId_idx` (`tenantId`),
  KEY `ledger_entries_accountId_idx` (`accountId`),
  KEY `ledger_entries_journalId_idx` (`journalId`),
  CONSTRAINT `ledger_entries_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ledger_entries_journalId_fkey` FOREIGN KEY (`journalId`) REFERENCES `journals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `ledger_entries` WRITE;
/*!40000 ALTER TABLE `ledger_entries` DISABLE KEYS */;
/*!40000 ALTER TABLE `ledger_entries` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `localization_strings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `localization_strings` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'en, bn, ar',
  `key_path` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'pos.cart.subtotal, nav.dashboard, etc.',
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `context` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'UI, BUSINESS, INVOICE',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ls_key` (`locale`,`key_path`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `localization_strings` WRITE;
/*!40000 ALTER TABLE `localization_strings` DISABLE KEYS */;
/*!40000 ALTER TABLE `localization_strings` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `loyalty_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loyalty_accounts` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pointsBalance` int NOT NULL DEFAULT '0',
  `lifetimeEarned` int NOT NULL DEFAULT '0',
  `lifetimeRedeemed` int NOT NULL DEFAULT '0',
  `tier` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `loyalty_accounts_customerId_key` (`customerId`),
  KEY `loyalty_accounts_tenantId_idx` (`tenantId`),
  CONSTRAINT `loyalty_accounts_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `loyalty_accounts` WRITE;
/*!40000 ALTER TABLE `loyalty_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `loyalty_accounts` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `loyalty_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loyalty_settings` (
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pointsPerAmount` decimal(12,2) NOT NULL DEFAULT '100.00' COMMENT 'spend this amount to earn 1 point',
  `redeemValuePerPoint` decimal(12,2) NOT NULL DEFAULT '1.00' COMMENT 'taka value of 1 point when redeeming',
  `expiryMonths` int NOT NULL DEFAULT '12',
  `minRedeemPoints` int NOT NULL DEFAULT '100',
  `earnEnabled` tinyint(1) NOT NULL DEFAULT '1',
  `redeemEnabled` tinyint(1) NOT NULL DEFAULT '1',
  `updatedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `loyalty_settings` WRITE;
/*!40000 ALTER TABLE `loyalty_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `loyalty_settings` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `loyalty_tiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loyalty_tiers` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `minPoints` int NOT NULL DEFAULT '0',
  `multiplier` decimal(4,2) NOT NULL DEFAULT '1.00',
  `cashbackRate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `benefits` text COLLATE utf8mb4_unicode_ci,
  `color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'amber',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lt_tenant_code` (`tenantId`,`code`),
  KEY `idx_lt_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `loyalty_tiers` WRITE;
/*!40000 ALTER TABLE `loyalty_tiers` DISABLE KEYS */;
/*!40000 ALTER TABLE `loyalty_tiers` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `loyalty_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loyalty_transactions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `saleId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EARN',
  `pointsEarned` int NOT NULL DEFAULT '0',
  `pointsRedeemed` int NOT NULL DEFAULT '0',
  `note` text COLLATE utf8mb4_unicode_ci,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lt_tenant` (`tenantId`),
  KEY `idx_lt_customer` (`customerId`),
  KEY `idx_lt_sale` (`saleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `loyalty_transactions` WRITE;
/*!40000 ALTER TABLE `loyalty_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `loyalty_transactions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `marketing_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `marketing_campaigns` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `triggerType` enum('INACTIVE_30D','BIRTHDAY','ANNIVERSARY','FIRST_PURCHASE','HIGH_VALUE','ABANDONED_CART','EXPIRY_REMINDER','LOYALTY_MILESTONE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('DRAFT','ACTIVE','PAUSED','ARCHIVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `channels` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '["SMS"]' COMMENT 'JSON array of SMS/EMAIL/WHATSAPP/PUSH',
  `conditions` json DEFAULT NULL COMMENT 'JSON: minAmount, daysInactive, lookbackDays, minPoints, milestonePoints',
  `couponTemplate` json DEFAULT NULL COMMENT 'JSON: discountType, discountValue, minAmount, maxDiscount, usageLimit, validDays, codePrefix',
  `startDate` date DEFAULT NULL,
  `endDate` date DEFAULT NULL,
  `lastRunAt` datetime DEFAULT NULL,
  `totalMatched` int NOT NULL DEFAULT '0',
  `totalSent` int NOT NULL DEFAULT '0',
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mc_tenant` (`tenantId`),
  KEY `idx_mc_status` (`status`),
  KEY `idx_mc_trigger` (`triggerType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `marketing_campaigns` WRITE;
/*!40000 ALTER TABLE `marketing_campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `marketing_campaigns` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `marketing_grants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `marketing_grants` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `campaignId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerName` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `channel` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SMS',
  `couponId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `couponCode` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','SENT','FAILED','SKIPPED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING until Prompt 28 Notification Engine sends',
  `reason` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sentAt` datetime DEFAULT NULL,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mg_campaign_customer` (`campaignId`,`customerId`),
  KEY `idx_mg_tenant` (`tenantId`),
  KEY `idx_mg_campaign` (`campaignId`),
  KEY `idx_mg_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `marketing_grants` WRITE;
/*!40000 ALTER TABLE `marketing_grants` DISABLE KEYS */;
/*!40000 ALTER TABLE `marketing_grants` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `marketplace_adapters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `marketplace_adapters` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `platform` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'SHOPIFY/WOOCOMMERCE/EBAY/AMAZON/FACEBOOK/CUSTOM',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','ERROR') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INACTIVE',
  `config` json DEFAULT NULL COMMENT '{apiKey, apiSecret, storeUrl, etc.}',
  `lastSyncAt` datetime DEFAULT NULL,
  `lastSyncStatus` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `productsSynced` int NOT NULL DEFAULT '0',
  `ordersImported` int NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ma_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `marketplace_adapters` WRITE;
/*!40000 ALTER TABLE `marketplace_adapters` DISABLE KEYS */;
/*!40000 ALTER TABLE `marketplace_adapters` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `marketplace_sync_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `marketplace_sync_log` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `adapterId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `syncType` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'PRODUCTS_IMPORT/ORDERS_IMPORT/INVENTORY_PUSH/ORDERS_PUSH',
  `status` enum('RUNNING','SUCCESS','PARTIAL','FAILED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RUNNING',
  `itemsProcessed` int NOT NULL DEFAULT '0',
  `itemsFailed` int NOT NULL DEFAULT '0',
  `errorMsg` text COLLATE utf8mb4_unicode_ci,
  `startedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_msl_tenant` (`tenantId`,`adapterId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `marketplace_sync_log` WRITE;
/*!40000 ALTER TABLE `marketplace_sync_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `marketplace_sync_log` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `moduleId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parentId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `label` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `route` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sortOrder` int NOT NULL DEFAULT '0',
  `isVisible` tinyint(1) NOT NULL DEFAULT '1',
  `permission` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `menu_items_moduleId_idx` (`moduleId`),
  KEY `menu_items_parentId_idx` (`parentId`),
  KEY `menu_items_sortOrder_idx` (`sortOrder`),
  CONSTRAINT `menu_items_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `modules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `menu_items_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `menu_items` WRITE;
/*!40000 ALTER TABLE `menu_items` DISABLE KEYS */;
INSERT INTO `menu_items` VALUES ('02674e16-4f72-47fa-8ec6-15bddecf905d','bd21d479-5971-497c-b020-825b186fb7d7',NULL,'Notification Engine',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.428','2026-09-04 17:25:43.428'),('07ec5d6a-465f-45fc-8aa5-700bb354de91','3e5849c2-4ee3-4f7d-a9c0-6ce25a959b95',NULL,'Installment Management',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.415','2026-09-04 17:25:43.415'),('087c4958-cce8-48ac-89c3-417c7559ead1','a55138e8-b270-4a0c-95b5-d37cf23cd0d7',NULL,'Promotion Engine',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.423','2026-09-04 17:25:43.423'),('095b200b-715f-4761-ab24-51372bb0dc31','e44f288f-a337-4e2d-8631-a5972b638812',NULL,'System / Global Settings',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.405','2026-09-04 17:25:43.405'),('1a2a6dd7-c382-4037-88ee-9e683914e7c3','6820ee6d-d7c1-484b-9b14-6ed93da5c643',NULL,'Task Management',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.432','2026-09-04 17:25:43.432'),('1cec8367-5d58-4944-a25f-9224d9d4c619','ad4dd585-e733-4aef-8026-041fb874608f',NULL,'Grocery / Supermarket',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.440','2026-09-04 17:25:43.440'),('26220468-7e8e-4caf-a9a1-00a690de0f0f','dbcc40dc-2f8f-418b-ae41-bf257259da18',NULL,'User / Role / Permission (RBAC)',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.404','2026-09-04 17:25:43.404'),('26a0eac6-ce7f-465e-b21c-84fd09bc26fa','0155f68b-1d8e-43d9-b178-b9d8a00743e6',NULL,'Tenant Onboarding',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.405','2026-09-04 17:25:43.405'),('289a74c6-d01c-45c6-b672-71687aa1626a','df689785-d65e-4644-8097-f3e52e9b9f33',NULL,'Tenant / Company Management',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.402','2026-09-04 17:25:43.402'),('2b83df84-1633-474d-8f8d-c05df9e1f8cb','c409417d-ccfc-435c-95de-cb143d9b1b24',NULL,'Appointment / Booking & Queue',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.435','2026-09-04 17:25:43.435'),('32679b78-e3c9-4381-976a-65aeceafdba6','93eb13f8-e73d-471b-a2f0-bb1bc03f8809',NULL,'Product & Catalog',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.408','2026-09-04 17:25:43.408'),('36c6e3b9-ca68-4125-a88f-1aa9443da232','0173aa11-d03e-4cd8-9094-4fe2c1432ae1',NULL,'System Performance',NULL,'/system/performance',1,1,NULL,'2026-09-04 17:45:52.962','2026-09-04 17:45:52.962'),('3a69dde9-6242-4915-89b6-2d43212f97d9','057877ec-c214-43b8-bbdf-f7cd35c04703',NULL,'Delivery & Logistics',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.423','2026-09-04 17:25:43.423'),('4f85a96f-06e6-4aa4-bbd7-834a90152c98','39b48ae6-3aa6-4fb9-8802-3c409cc1fc99',NULL,'Franchise Management',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.444','2026-09-04 17:25:43.444'),('556e5666-854d-4c8b-aeab-d0185afc9865','43bea1eb-3117-4233-9af9-706d93b32df6',NULL,'Loyalty / Membership / Wallet',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.422','2026-09-04 17:25:43.422'),('58d020a1-3a2b-4f3a-bf0e-2e9e578a39e8','334376d1-f092-43ce-88ac-de9c9aacf2c2',NULL,'Sales Management',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.412','2026-09-04 17:25:43.412'),('5dea6fc1-a0ca-499e-bab4-462d8f9c7f9a','843ff6cf-6ea4-4c3f-9237-ad3de04e1a5c',NULL,'Authentication & Security',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.403','2026-09-04 17:25:43.403'),('5ffa990f-dbbb-4e43-a2e9-bc106a757a46','4435aa17-3bed-48e1-a490-103d0e5eb53e',NULL,'Restaurant',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.437','2026-09-04 17:25:43.437'),('669fb97b-d003-4210-a940-a37a12d8abf9','985040cc-de3e-4e18-833f-ef8df2ac5c5a',NULL,'Audit System',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.429','2026-09-04 17:25:43.429'),('66c5252c-03f5-4891-b372-801da15509e0','61df646e-77ad-40ce-883d-f3abeadc5e9c',NULL,'Supplier Management',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.410','2026-09-04 17:25:43.410'),('698910cb-2327-46d4-b73a-8c0f58933079','5c869347-0340-4d5d-8d2b-0a21ba13980a',NULL,'Reporting / BI / AI',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.430','2026-09-04 17:25:43.430'),('6cd2ecee-4996-4ca4-a94f-8545c42ce7c5','b62ff425-2cf6-49b8-88c2-1a9f1e68c459',NULL,'Manufacturing / Bakery',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.442','2026-09-04 17:25:43.442'),('7618295f-e487-484b-b2a6-1e12d11b146f','53322ae1-e3fc-4bfb-bae0-b38f3bcdfc16',NULL,'Cash Register & Shift',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.426','2026-09-04 17:25:43.426'),('78716296-57d8-48ce-b433-3a010932d392','d886cfa3-59b3-4c5a-a09a-2a4ee64e1d37',NULL,'Salon & Spa',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.442','2026-09-04 17:25:43.442'),('78d4e39d-9474-4336-870a-7ab762143b26','da847d23-40ad-40fa-ac24-3a1bbb0d10dc',NULL,'Payment & Collection',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.413','2026-09-04 17:25:43.413'),('7f01b7e6-acc3-4eeb-8fdb-2f2ee07f7847','cfff1ece-d026-40d1-8dbb-0d0876978f63',NULL,'Dashboard',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.407','2026-09-04 17:25:43.407'),('80035838-34ef-4536-a414-43759cb22cd2','f911234c-b21d-4228-9da1-0364820aac3d',NULL,'Inventory & Warehouse',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.417','2026-09-04 17:25:43.417'),('823cb51e-aa0c-4e77-8156-325538a2a6c4','4200414b-259b-433e-a8a6-f4f2ddbf53a5',NULL,'Commission Engine',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.416','2026-09-04 17:25:43.416'),('86b04103-1031-41aa-9340-d992fd649dc6','ff2e7a51-4fc1-4eb1-ab59-e8b072906b03',NULL,'Return / Refund / RMA / Warranty',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.421','2026-09-04 17:25:43.421'),('8af3bac3-cdef-4be2-9033-d3dcc472da0a','8c8f9e4c-9e9c-4668-8df1-b73b8937cfab',NULL,'Pharmacy',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.438','2026-09-04 17:25:43.438'),('8baeeeda-4fba-43f6-89d3-3380370c4ede','ac5d2aab-3bcb-4f18-9938-d12936e32746',NULL,'Sales Target & Budget',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.434','2026-09-04 17:25:43.434'),('8be0b6e6-7b3e-4d0b-98d4-5a3f4c53224e','dea70d60-6748-4a7e-b39e-8c6d9ad9cb66',NULL,'Customer & CRM',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.409','2026-09-04 17:25:43.409'),('94a8216a-d29a-45d6-88c8-ef07fe8046db','92d2cae5-2602-404a-b841-f44c916da6b1',NULL,'Wholesale & Distribution',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.441','2026-09-04 17:25:43.441'),('b426c71e-f126-4959-b450-08b30af8cb46','65639a4c-7dce-4916-9e1c-e8ccd1a6dd0f',NULL,'Purchasing',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.418','2026-09-04 17:25:43.418'),('ba629a50-efba-46ea-a010-070f5e7425eb','822f942b-0b7d-4f2b-9781-e69540b69d15',NULL,'Accounting Engine',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.419','2026-09-04 17:25:43.419'),('bbe169a3-177b-4e2f-8687-b9d41ef3bece','b699e6f5-6f26-4be4-abc2-bf5ac292456b',NULL,'Marketing Automation',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.433','2026-09-04 17:25:43.433'),('c284a405-5181-4db7-a7d0-d11dbda00573','ca2c0a4c-4894-4688-b588-884df7ab2aff',NULL,'Approval & Workflow Engine',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.427','2026-09-04 17:25:43.427'),('c5185a8d-239d-438a-8827-91c709279a09','85e8ba50-e527-4d41-95dc-534006a8917c',NULL,'POS & Checkout Engine',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.411','2026-09-04 17:25:43.411'),('c72f37f2-d8d0-48b3-88ce-2d48c89db9b4','378d8796-e2c3-4dcd-9102-f0d653cba5ea',NULL,'Platform & SaaS Management',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.400','2026-09-04 17:25:43.400'),('d1149121-291a-4cab-9627-d7a05154a90e','5cd03fdd-ec7b-47bb-9c47-7958fba0e37a',NULL,'Invoice Engine',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.413','2026-09-04 17:25:43.413'),('d43538fc-5de7-4183-93eb-196c0db2f388','04e1dfca-16b0-4e9c-9928-c763eb29b93f',NULL,'VAT / Tax Engine',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.420','2026-09-04 17:25:43.420'),('d4368920-7c3b-43d3-b31b-85f55d232c37','35e93a66-abfe-4639-932d-601568f4e3eb',NULL,'Business Rule Engine',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.436','2026-09-04 17:25:43.436'),('dfe1e526-803c-4f9c-a719-a64ca7aa423a','aba407fb-e21d-4569-b96a-1dc66cd79c90',NULL,'Repair & Service Center',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.443','2026-09-04 17:25:43.443'),('e2a65483-e1b9-479a-af76-4fca74779b95','bb7d83eb-6a29-48d9-b730-425f75c871d5',NULL,'Document Management',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.431','2026-09-04 17:25:43.431'),('e750d6ad-6934-4e92-985b-74d9f718a0fc','83215ae5-7170-4663-b6c2-2825ee877374',NULL,'Expense Management',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.425','2026-09-04 17:25:43.425'),('eb7a3273-4e52-4b27-8096-978c88d96710','513b34c9-152a-4fba-a52d-34263764f2f7',NULL,'HRM',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.424','2026-09-04 17:25:43.424'),('f352f981-6825-4e3c-875b-8ce23bb6ae6a','ed8267df-0823-4f5c-b1b9-559df80057de',NULL,'Retail',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.439','2026-09-04 17:25:43.439'),('f3e12383-8049-4f79-ade2-1b020c2ec832','c66058ce-f499-48a0-96f5-9119a3448c02',NULL,'Credit Management',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.414','2026-09-04 17:25:43.414'),('f786053a-d3a5-48b9-8420-304d640a05d9','043f2326-4221-4ec1-a8c7-b29055700cc8',NULL,'Offline Sync Engine',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.430','2026-09-04 17:25:43.430'),('fb0897e4-96b6-4eec-9eb8-f177f1037669','7982d3c9-9e3d-4161-8d40-8412d75cf1cb',NULL,'API / Webhooks / Integrations',NULL,'/',1,1,NULL,'2026-09-04 17:25:43.406','2026-09-04 17:25:43.406');
/*!40000 ALTER TABLE `menu_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `migration_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migration_sessions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sourceSystem` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Original POS name',
  `status` enum('CREATED','MAPPING','VALIDATING','VALIDATED','IMPORTING','COMPLETED','FAILED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CREATED',
  `tables` json NOT NULL COMMENT '[{"source":"Products","target":"products","mapping":{}}]',
  `totalRows` int NOT NULL DEFAULT '0',
  `importedRows` int NOT NULL DEFAULT '0',
  `errorRows` int NOT NULL DEFAULT '0',
  `errors` json DEFAULT NULL,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ms_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `migration_sessions` WRITE;
/*!40000 ALTER TABLE `migration_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `migration_sessions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modules` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` enum('PLATFORM','CORE','INDUSTRY','ENGINE','FEATURE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `route` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sortOrder` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `isCore` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `modules_code_key` (`code`),
  KEY `modules_category_idx` (`category`),
  KEY `modules_sortOrder_idx` (`sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `modules` WRITE;
/*!40000 ALTER TABLE `modules` DISABLE KEYS */;
INSERT INTO `modules` VALUES ('0155f68b-1d8e-43d9-b178-b9d8a00743e6','onboarding','Tenant Onboarding','Tenant Onboarding','PLATFORM','Rocket','/',6,1,1,'2026-09-04 17:25:43.405','2026-09-04 17:25:43.405'),('0173aa11-d03e-4cd8-9094-4fe2c1432ae1','system','System Performance','System Performance','PLATFORM','Activity','/system/performance',8,1,1,'2026-09-04 17:45:52.962','2026-09-04 17:45:52.962'),('043f2326-4221-4ec1-a8c7-b29055700cc8','sync','Offline Sync Engine','Offline Sync Engine','ENGINE','RefreshCw','/',36,1,1,'2026-09-04 17:25:43.430','2026-09-04 17:25:43.430'),('04e1dfca-16b0-4e9c-9928-c763eb29b93f','vat','VAT / Tax Engine','VAT / Tax Engine','CORE','Calculator','/',24,1,1,'2026-09-04 17:25:43.420','2026-09-04 17:25:43.420'),('057877ec-c214-43b8-bbdf-f7cd35c04703','delivery','Delivery & Logistics','Delivery & Logistics','CORE','MapPin','/',28,1,1,'2026-09-04 17:25:43.423','2026-09-04 17:25:43.423'),('334376d1-f092-43ce-88ac-de9c9aacf2c2','sales','Sales Management','Sales Management','CORE','ShoppingCart','/',15,1,1,'2026-09-04 17:25:43.411','2026-09-04 17:25:43.411'),('35e93a66-abfe-4639-932d-601568f4e3eb','baserules','Business Rule Engine','Business Rule Engine','ENGINE','Settings','/',42,1,1,'2026-09-04 17:25:43.435','2026-09-04 17:25:43.435'),('378d8796-e2c3-4dcd-9102-f0d653cba5ea','platform','Platform & SaaS Management','Platform & SaaS Management','PLATFORM','Settings','/',1,1,1,'2026-09-04 17:25:43.400','2026-09-04 17:25:43.400'),('39b48ae6-3aa6-4fb9-8802-3c409cc1fc99','franchise','Franchise Management','Franchise Management','INDUSTRY','Settings','/',58,1,1,'2026-09-04 17:25:43.444','2026-09-04 17:25:43.444'),('3e5849c2-4ee3-4f7d-a9c0-6ce25a959b95','installments','Installment Management','Installment Management','CORE','Calendar','/',19,1,1,'2026-09-04 17:25:43.415','2026-09-04 17:25:43.415'),('4200414b-259b-433e-a8a6-f4f2ddbf53a5','commission','Commission Engine','Commission Engine','CORE','Percent','/',20,1,1,'2026-09-04 17:25:43.416','2026-09-04 17:25:43.416'),('43bea1eb-3117-4233-9af9-706d93b32df6','loyalty','Loyalty / Membership / Wallet','Loyalty / Membership / Wallet','CORE','Star','/',26,1,1,'2026-09-04 17:25:43.421','2026-09-04 17:25:43.421'),('4435aa17-3bed-48e1-a490-103d0e5eb53e','restaurant','Restaurant','Restaurant','INDUSTRY','UtensilsCrossed','/',50,1,1,'2026-09-04 17:25:43.436','2026-09-04 17:25:43.436'),('513b34c9-152a-4fba-a52d-34263764f2f7','hrm','HRM','HRM','CORE','UserCog','/',29,1,1,'2026-09-04 17:25:43.424','2026-09-04 17:25:43.424'),('53322ae1-e3fc-4bfb-bae0-b38f3bcdfc16','cashregister','Cash Register & Shift','Cash Register & Shift','CORE','DollarSign','/',31,1,1,'2026-09-04 17:25:43.426','2026-09-04 17:25:43.426'),('5c869347-0340-4d5d-8d2b-0a21ba13980a','reporting','Reporting / BI / AI','Reporting / BI / AI','ENGINE','BarChart3','/',35,1,1,'2026-09-04 17:25:43.429','2026-09-04 17:25:43.429'),('5cd03fdd-ec7b-47bb-9c47-7958fba0e37a','invoices','Invoice Engine','Invoice Engine','CORE','FileText','/',16,1,1,'2026-09-04 17:25:43.412','2026-09-04 17:25:43.412'),('61df646e-77ad-40ce-883d-f3abeadc5e9c','suppliers','Supplier Management','Supplier Management','CORE','Truck','/',13,1,1,'2026-09-04 17:25:43.410','2026-09-04 17:25:43.410'),('65639a4c-7dce-4916-9e1c-e8ccd1a6dd0f','purchases','Purchasing','Purchasing','CORE','ShoppingBag','/',22,1,1,'2026-09-04 17:25:43.417','2026-09-04 17:25:43.417'),('6820ee6d-d7c1-484b-9b14-6ed93da5c643','tasks','Task Management','Task Management','CORE','CheckSquare','/',38,1,1,'2026-09-04 17:25:43.432','2026-09-04 17:25:43.432'),('7982d3c9-9e3d-4161-8d40-8412d75cf1cb','integrations','API / Webhooks / Integrations','API / Webhooks / Integrations','PLATFORM','Plug','/',7,1,1,'2026-09-04 17:25:43.406','2026-09-04 17:25:43.406'),('822f942b-0b7d-4f2b-9781-e69540b69d15','accounting','Accounting Engine','Accounting Engine','CORE','BookOpen','/',23,1,1,'2026-09-04 17:25:43.419','2026-09-04 17:25:43.419'),('83215ae5-7170-4663-b6c2-2825ee877374','expenses','Expense Management','Expense Management','CORE','Receipt','/',30,1,1,'2026-09-04 17:25:43.425','2026-09-04 17:25:43.425'),('843ff6cf-6ea4-4c3f-9237-ad3de04e1a5c','auth','Authentication & Security','Authentication & Security','PLATFORM','Shield','/',3,1,1,'2026-09-04 17:25:43.402','2026-09-04 17:25:43.402'),('85e8ba50-e527-4d41-95dc-534006a8917c','pos','POS & Checkout Engine','POS & Checkout Engine','CORE','Monitor','/',14,1,1,'2026-09-04 17:25:43.411','2026-09-04 17:25:43.411'),('8c8f9e4c-9e9c-4668-8df1-b73b8937cfab','pharmacy','Pharmacy','Pharmacy','INDUSTRY','Package','/',51,1,1,'2026-09-04 17:25:43.437','2026-09-04 17:25:43.437'),('92d2cae5-2602-404a-b841-f44c916da6b1','wholesale','Wholesale & Distribution','Wholesale & Distribution','INDUSTRY','Truck','/',54,1,1,'2026-09-04 17:25:43.440','2026-09-04 17:25:43.440'),('93eb13f8-e73d-471b-a2f0-bb1bc03f8809','products','Product & Catalog','Product & Catalog','CORE','Package','/',11,1,1,'2026-09-04 17:25:43.407','2026-09-04 17:25:43.407'),('985040cc-de3e-4e18-833f-ef8df2ac5c5a','audit','Audit System','Audit System','ENGINE','Eye','/',34,1,1,'2026-09-04 17:25:43.428','2026-09-04 17:25:43.428'),('a55138e8-b270-4a0c-95b5-d37cf23cd0d7','promotions','Promotion Engine','Promotion Engine','CORE','Tag','/',27,1,1,'2026-09-04 17:25:43.422','2026-09-04 17:25:43.422'),('aba407fb-e21d-4569-b96a-1dc66cd79c90','repair','Repair & Service Center','Repair & Service Center','INDUSTRY','Settings','/',57,1,1,'2026-09-04 17:25:43.443','2026-09-04 17:25:43.443'),('ac5d2aab-3bcb-4f18-9938-d12936e32746','targets','Sales Target & Budget','Sales Target & Budget','CORE','Target','/',40,1,1,'2026-09-04 17:25:43.433','2026-09-04 17:25:43.433'),('ad4dd585-e733-4aef-8026-041fb874608f','grocery','Grocery / Supermarket','Grocery / Supermarket','INDUSTRY','Package','/',53,1,1,'2026-09-04 17:25:43.439','2026-09-04 17:25:43.439'),('b62ff425-2cf6-49b8-88c2-1a9f1e68c459','manufacturing','Manufacturing / Bakery','Manufacturing / Bakery','INDUSTRY','Settings','/',55,1,1,'2026-09-04 17:25:43.441','2026-09-04 17:25:43.441'),('b699e6f5-6f26-4be4-abc2-bf5ac292456b','marketing','Marketing Automation','Marketing Automation','CORE','Megaphone','/',39,1,1,'2026-09-04 17:25:43.433','2026-09-04 17:25:43.433'),('bb7d83eb-6a29-48d9-b730-425f75c871d5','documents','Document Management','Document Management','CORE','FolderOpen','/',37,1,1,'2026-09-04 17:25:43.431','2026-09-04 17:25:43.431'),('bd21d479-5971-497c-b020-825b186fb7d7','notifications','Notification Engine','Notification Engine','ENGINE','Bell','/',33,1,1,'2026-09-04 17:25:43.427','2026-09-04 17:25:43.427'),('c409417d-ccfc-435c-95de-cb143d9b1b24','appointments','Appointment / Booking & Queue','Appointment / Booking & Queue','CORE','Calendar','/',41,1,1,'2026-09-04 17:25:43.434','2026-09-04 17:25:43.434'),('c66058ce-f499-48a0-96f5-9119a3448c02','credit','Credit Management','Credit Management','CORE','Clock','/',18,1,1,'2026-09-04 17:25:43.414','2026-09-04 17:25:43.414'),('ca2c0a4c-4894-4688-b588-884df7ab2aff','workflow','Approval & Workflow Engine','Approval & Workflow Engine','ENGINE','GitMerge','/',32,1,1,'2026-09-04 17:25:43.427','2026-09-04 17:25:43.427'),('cfff1ece-d026-40d1-8dbb-0d0876978f63','dashboard','Dashboard','Dashboard','CORE','LayoutDashboard','/',10,1,1,'2026-09-04 17:25:43.407','2026-09-04 17:25:43.407'),('d886cfa3-59b3-4c5a-a09a-2a4ee64e1d37','salon','Salon & Spa','Salon & Spa','INDUSTRY','Scissors','/',56,1,1,'2026-09-04 17:25:43.442','2026-09-04 17:25:43.442'),('da847d23-40ad-40fa-ac24-3a1bbb0d10dc','payments','Payment & Collection','Payment & Collection','CORE','CreditCard','/',17,1,1,'2026-09-04 17:25:43.413','2026-09-04 17:25:43.413'),('dbcc40dc-2f8f-418b-ae41-bf257259da18','rbac','User / Role / Permission (RBAC)','User / Role / Permission (RBAC)','PLATFORM','Users','/',4,1,1,'2026-09-04 17:25:43.403','2026-09-04 17:25:43.403'),('dea70d60-6748-4a7e-b39e-8c6d9ad9cb66','customers','Customer & CRM','Customer & CRM','CORE','Users','/',12,1,1,'2026-09-04 17:25:43.409','2026-09-04 17:25:43.409'),('df689785-d65e-4644-8097-f3e52e9b9f33','tenant','Tenant / Company Management','Tenant / Company Management','PLATFORM','Building2','/',2,1,1,'2026-09-04 17:25:43.401','2026-09-04 17:25:43.401'),('e44f288f-a337-4e2d-8631-a5972b638812','settings','System / Global Settings','System / Global Settings','PLATFORM','Settings','/',5,1,1,'2026-09-04 17:25:43.404','2026-09-04 17:25:43.404'),('ed8267df-0823-4f5c-b1b9-559df80057de','retail','Retail','Retail','INDUSTRY','ShoppingBag','/',52,1,1,'2026-09-04 17:25:43.438','2026-09-04 17:25:43.438'),('f911234c-b21d-4228-9da1-0364820aac3d','inventory','Inventory & Warehouse','Inventory & Warehouse','CORE','Warehouse','/',21,1,1,'2026-09-04 17:25:43.416','2026-09-04 17:25:43.416'),('ff2e7a51-4fc1-4eb1-ab59-e8b072906b03','returns','Return / Refund / RMA / Warranty','Return / Refund / RMA / Warranty','CORE','RotateCcw','/',25,1,1,'2026-09-04 17:25:43.421','2026-09-04 17:25:43.421');
/*!40000 ALTER TABLE `modules` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `notification_channels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_channels` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'IN_APP/PUSH/EMAIL/SMS/WHATSAPP',
  `name` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isEnabled` tinyint(1) NOT NULL DEFAULT '1',
  `config` json DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_nch` (`tenantId`,`code`),
  KEY `idx_nch_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `notification_channels` WRITE;
/*!40000 ALTER TABLE `notification_channels` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_channels` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `notification_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `eventType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipientType` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CUSTOMER' COMMENT 'CUSTOMER/USER',
  `recipientId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipientName` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipientAddress` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'phone or email used',
  `subject` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` text COLLATE utf8mb4_unicode_ci,
  `status` enum('PENDING','SENT','FAILED','SKIPPED_OPTOUT','CHANNEL_OFF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `errorMsg` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refType` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sentAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nl_tenant` (`tenantId`,`status`),
  KEY `idx_nl_event` (`tenantId`,`eventType`),
  KEY `idx_nl_ref` (`refType`,`refId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `notification_logs` WRITE;
/*!40000 ALTER TABLE `notification_logs` DISABLE KEYS */;
INSERT INTO `notification_logs` VALUES ('24966363-9a45-4033-97df-9ecd595d4ef4','1798fdaa-84d9-4bd4-903d-02784a398676','SYNC_FAILURE','PUSH','USER','538dd563-88aa-4c96-8213-f1ebc6664a49',NULL,NULL,'Sync failed','Sync failed for p40_23584-device (2 failed, 0 conflicted out of 2 uploaded). Check the connection and retry.','SENT','carrier=fcm',NULL,NULL,'2026-09-04 18:06:45','2026-09-04 18:06:45'),('39592a0d-d13a-4190-af86-8a27678649ef','1798fdaa-84d9-4bd4-903d-02784a398676','SYNC_FAILURE','PUSH','USER','538dd563-88aa-4c96-8213-f1ebc6664a49',NULL,NULL,'Sync failed','Sync failed for p40_23584-device (3 failed, 0 conflicted out of 3 uploaded). Check the connection and retry.','SENT','carrier=fcm',NULL,NULL,'2026-09-04 18:06:45','2026-09-04 18:06:45'),('96d74bd5-049f-4570-a963-ef8e83a9804f','1798fdaa-84d9-4bd4-903d-02784a398676','SYNC_FAILURE','PUSH','USER','538dd563-88aa-4c96-8213-f1ebc6664a49',NULL,NULL,'Sync failed','Sync failed for p40_23584-device (4 failed, 0 conflicted out of 4 uploaded). Check the connection and retry.','SENT','carrier=fcm',NULL,NULL,'2026-09-04 18:06:45','2026-09-04 18:06:45'),('aa989c26-75f0-463a-8124-70584a93c18e','1798fdaa-84d9-4bd4-903d-02784a398676','SYNC_FAILURE','IN_APP','USER','538dd563-88aa-4c96-8213-f1ebc6664a49',NULL,NULL,'Sync failed','Sync failed for p40_23584-device (4 failed, 0 conflicted out of 4 uploaded). Check the connection and retry.','SENT','carrier=in-app',NULL,NULL,'2026-09-04 18:06:45','2026-09-04 18:06:45'),('af7b4bb5-d69d-46d3-aa6e-46a78c56138c','1798fdaa-84d9-4bd4-903d-02784a398676','SYNC_FAILURE','IN_APP','USER','538dd563-88aa-4c96-8213-f1ebc6664a49',NULL,NULL,'Sync failed','Sync failed for p40_23584-device (2 failed, 0 conflicted out of 2 uploaded). Check the connection and retry.','SENT','carrier=in-app',NULL,NULL,'2026-09-04 18:06:45','2026-09-04 18:06:45'),('b6459bd1-10ad-4216-8c8e-a1a4861ab2ca','1798fdaa-84d9-4bd4-903d-02784a398676','SYNC_FAILURE','IN_APP','USER','538dd563-88aa-4c96-8213-f1ebc6664a49',NULL,NULL,'Sync failed','Sync failed for p40_23584-device (4 failed, 0 conflicted out of 4 uploaded). Check the connection and retry.','SENT','carrier=in-app',NULL,NULL,'2026-09-04 18:06:45','2026-09-04 18:06:45'),('c4bc4e6f-dc27-4809-9c6c-9d3467c98dd0','1798fdaa-84d9-4bd4-903d-02784a398676','SYNC_FAILURE','PUSH','USER','538dd563-88aa-4c96-8213-f1ebc6664a49',NULL,NULL,'Sync failed','Sync failed for p40_23584-device (4 failed, 0 conflicted out of 4 uploaded). Check the connection and retry.','SENT','carrier=fcm',NULL,NULL,'2026-09-04 18:06:45','2026-09-04 18:06:45'),('cdeaad47-2bf5-4f26-bbbd-5c5d24a82084','1798fdaa-84d9-4bd4-903d-02784a398676','SYNC_FAILURE','IN_APP','USER','538dd563-88aa-4c96-8213-f1ebc6664a49',NULL,NULL,'Sync failed','Sync failed for p40_23584-device (3 failed, 0 conflicted out of 3 uploaded). Check the connection and retry.','SENT','carrier=in-app',NULL,NULL,'2026-09-04 18:06:45','2026-09-04 18:06:45');
/*!40000 ALTER TABLE `notification_logs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `notification_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_templates` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `eventType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` text COLLATE utf8mb4_unicode_ci,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nt_tenant` (`tenantId`,`eventType`,`channel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `notification_templates` WRITE;
/*!40000 ALTER TABLE `notification_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_templates` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `order_channels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_channels` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'POS/WEBSITE/MOBILE_APP/KIOSK/QR_ORDER/MARKETPLACE/SOCIAL/PHONE',
  `name` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isEnabled` tinyint(1) NOT NULL DEFAULT '1',
  `config` json DEFAULT NULL COMMENT '{endpoint, apiKey, etc.}',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_oc` (`tenantId`,`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `order_channels` WRITE;
/*!40000 ALTER TABLE `order_channels` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_channels` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `saleId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoiceId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `method` enum('CASH','CARD','BANK','BKASH','NAGAD','ROCKET','GATEWAY','CREDIT','GIFT_CARD','WALLET','STORE_CREDIT','COD') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CASH',
  `amount` decimal(14,2) NOT NULL,
  `reference` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idempotencyKey` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paidAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `status` enum('PENDING','COMPLETED','FAILED','REFUNDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COMPLETED',
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payments_tenantId_idempotencyKey_key` (`tenantId`,`idempotencyKey`),
  KEY `payments_tenantId_idx` (`tenantId`),
  KEY `payments_invoiceId_idx` (`invoiceId`),
  KEY `payments_saleId_idx` (`saleId`),
  KEY `payments_customerId_idx` (`customerId`),
  KEY `payments_branchId_fkey` (`branchId`),
  CONSTRAINT `payments_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `payments_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `payments_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `payments_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sales` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_code_key` (`code`),
  KEY `permissions_module_idx` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES ('026db360-9f6e-476e-af51-67b0d2aaa02c','products.delete','products','delete',NULL,'2026-09-04 17:25:43.307'),('0aa78bf2-4ba1-4857-a231-ff69ec23f48e','sales.view','sales','view',NULL,'2026-09-04 17:25:43.305'),('0c4b2714-2021-4107-97db-e0779749b98f','rbac.roles.create','rbac','roles.create',NULL,'2026-09-04 17:25:43.312'),('1108eed7-b5da-4e46-ba67-513b7e63ace9','warehouse.edit','warehouse','edit',NULL,'2026-09-04 17:25:43.310'),('13262801-6edb-4b54-bad6-b2061525cfeb','onboarding.edit','onboarding','edit',NULL,'2026-09-04 17:25:43.312'),('13a99b14-8a1e-4251-9885-5ea347d1ee99','products.edit','products','edit',NULL,'2026-09-04 17:25:43.306'),('142d5c22-448a-465a-9946-0563452ecb00','branch.delete','branch','delete',NULL,'2026-09-04 17:25:43.309'),('1cb7bf4e-7826-450f-bf6b-8b73cbce7cd5','customers.create','customers','create',NULL,'2026-09-04 17:25:43.307'),('1cf0578c-db4c-4f5f-8d2a-9db921da0b23','branch.edit','branch','edit',NULL,'2026-09-04 17:25:43.309'),('261a6e4b-7a5f-4e9b-be83-db2be8b3af58','sales.create','sales','create',NULL,'2026-09-04 17:25:43.305'),('31aa97ae-f86a-409d-8641-c624ce2e4a48','rbac.users.edit','rbac','users.edit',NULL,'2026-09-04 17:25:43.313'),('32d13b9a-5ce5-4b64-bed6-696561f2e535','rbac.roles.delete','rbac','roles.delete',NULL,'2026-09-04 17:25:43.313'),('32dae15b-d82a-444e-9cc9-916b0ec705a8','customers.edit','customers','edit',NULL,'2026-09-04 17:25:43.307'),('398f8874-825f-418c-9273-39c2fd4199ec','branch.create','branch','create',NULL,'2026-09-04 17:25:43.309'),('454986f6-9f3c-4d92-a1d3-ebcb8d884884','system.admin','system','admin',NULL,'2026-09-04 17:45:52.950'),('4d9dcdf0-2d31-4760-b57f-9e0e712f79fa','rbac.roles.view','rbac','roles.view',NULL,'2026-09-04 17:25:43.312'),('4f1a778d-08ae-46b3-8f07-f24ab893bb94','device.delete','device','delete',NULL,'2026-09-04 17:25:43.311'),('50a64d6e-2897-41f8-97c5-36f109437ccc','accounting.accounts.view','accounting','accounts.view',NULL,'2026-09-04 17:25:43.314'),('52676afc-d44f-4efb-8cdb-c5f0f079c8ec','accounting.ledger.view','accounting','ledger.view',NULL,'2026-09-04 17:25:43.315'),('5767f4cf-19c4-4f27-b956-65e1dee5abf1','accounting.accounts.create','accounting','accounts.create',NULL,'2026-09-04 17:25:43.314'),('57b81b6d-1bdb-417d-91b1-02d2a8f29101','warehouse.delete','warehouse','delete',NULL,'2026-09-04 17:25:43.310'),('637a25bd-3c89-4e94-9fb1-ef6f3aad588d','warehouse.create','warehouse','create',NULL,'2026-09-04 17:25:43.309'),('63c3ff06-2d8d-4903-a233-2fd8d928e782','suppliers.edit','suppliers','edit',NULL,'2026-09-04 17:25:43.308'),('66fc8b75-d2c8-45e4-bbf3-a7eb643937a9','sales.refund','sales','refund',NULL,'2026-09-04 17:25:43.305'),('6aeac311-4234-4ad4-99cd-ff08ba9a9d82','rbac.permissions.view','rbac','permissions.view',NULL,'2026-09-04 17:25:43.313'),('73cd5d9c-813e-4f5d-a0f2-26527b0a8b53','inventory.view','inventory','view',NULL,'2026-09-04 17:25:43.306'),('81f10980-6468-4c65-b52b-ec5a8c898446','settings.view','settings','view',NULL,'2026-09-04 17:25:43.311'),('8f021061-b011-40b2-b7f1-9a9da5b66825','rbac.roles.edit','rbac','roles.edit',NULL,'2026-09-04 17:25:43.312'),('98c72d63-b9bd-478f-a903-d803978e7772','rbac.users.view','rbac','users.view',NULL,'2026-09-04 17:25:43.313'),('9baa2aa5-9719-4b12-8396-0dbc26b66d30','products.categories.create','products','categories.create',NULL,'2026-09-04 17:25:43.308'),('a3b7cbdf-977e-45cc-9f76-635c96878601','onboarding.view','onboarding','view',NULL,'2026-09-04 17:25:43.312'),('a6a637d8-d5ab-4e1a-a505-0a1d8293f2ab','accounting.journals.view','accounting','journals.view',NULL,'2026-09-04 17:25:43.314'),('a74e49f8-dec8-4a81-80f6-461ae4c6ef0d','accounting.trialbalance.view','accounting','trialbalance.view',NULL,'2026-09-04 17:25:43.315'),('a867f08c-b12a-4e7c-b5fa-62366fe01a50','branch.view','branch','view',NULL,'2026-09-04 17:25:43.308'),('b31c7da1-a07a-403f-893a-adacd51a1294','products.create','products','create',NULL,'2026-09-04 17:25:43.306'),('c2ae35e6-8ca0-4b91-bd09-f68bca4dcefe','accounting.pnl.view','accounting','pnl.view',NULL,'2026-09-04 17:25:43.315'),('cd1971d5-0155-41f7-b6f2-5319a442b7b7','suppliers.create','suppliers','create',NULL,'2026-09-04 17:25:43.307'),('d481cf60-d9b4-49c7-aa87-9cf86f3745cc','accounting.balancesheet.view','accounting','balancesheet.view',NULL,'2026-09-04 17:25:43.315'),('e5fd732d-1d17-4b4b-8588-7e0d6f6da3e3','accounting.journals.create','accounting','journals.create',NULL,'2026-09-04 17:25:43.314'),('ea4623fd-f7d3-406c-aa93-bb3eccf15430','device.view','device','view',NULL,'2026-09-04 17:25:43.310'),('ebf2e5b8-5721-4df5-b858-151acc315c6f','reports.view','reports','view',NULL,'2026-09-04 17:25:43.308'),('fa856865-2760-4b4c-b12c-244a0a20ffa7','accounting.cashflow.view','accounting','cashflow.view',NULL,'2026-09-04 17:25:43.315'),('faf41e75-3cd5-4653-99c1-46b3d0a2371e','warehouse.view','warehouse','view',NULL,'2026-09-04 17:25:43.309'),('fb7ac8eb-cb3a-4217-a6bc-d6178b9662d5','device.create','device','create',NULL,'2026-09-04 17:25:43.310'),('fdbcfe43-5a6c-4d69-8430-7fa91772d13a','device.edit','device','edit',NULL,'2026-09-04 17:25:43.311'),('feb2683d-f31d-43ba-991a-4688477cd142','settings.edit','settings','edit',NULL,'2026-09-04 17:25:43.311');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `petty_cash_funds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `petty_cash_funds` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `balance` decimal(14,2) NOT NULL DEFAULT '0.00',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_pcf_tenant` (`tenantId`),
  KEY `idx_pcf_branch` (`branchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `petty_cash_funds` WRITE;
/*!40000 ALTER TABLE `petty_cash_funds` DISABLE KEYS */;
/*!40000 ALTER TABLE `petty_cash_funds` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `petty_cash_txns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `petty_cash_txns` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `balanceAfter` decimal(14,2) NOT NULL DEFAULT '0.00',
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_pct_tenant` (`tenantId`),
  KEY `idx_pct_branch` (`branchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `petty_cash_txns` WRITE;
/*!40000 ALTER TABLE `petty_cash_txns` DISABLE KEYS */;
/*!40000 ALTER TABLE `petty_cash_txns` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `platform_health`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `platform_health` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checkType` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'API/DATABASE/STORAGE/AI/EMAIL/SMS',
  `status` enum('OK','DEGRADED','DOWN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OK',
  `latencyMs` int DEFAULT NULL,
  `details` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `checkedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ph_type` (`checkType`,`checkedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `platform_health` WRITE;
/*!40000 ALTER TABLE `platform_health` DISABLE KEYS */;
/*!40000 ALTER TABLE `platform_health` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `price_list_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_list_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `priceListId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `variantId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `minQty` decimal(14,3) NOT NULL DEFAULT '1.000',
  `price` decimal(14,2) NOT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `price_list_items_tenantId_priceListId_productId_variantId_key` (`tenantId`,`priceListId`,`productId`,`variantId`),
  KEY `price_list_items_tenantId_idx` (`tenantId`),
  KEY `price_list_items_productId_idx` (`productId`),
  KEY `price_list_items_priceListId_fkey` (`priceListId`),
  CONSTRAINT `price_list_items_priceListId_fkey` FOREIGN KEY (`priceListId`) REFERENCES `price_lists` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `price_list_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `price_list_items` WRITE;
/*!40000 ALTER TABLE `price_list_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `price_list_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `price_lists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_lists` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currency` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BDT',
  `isDefault` tinyint(1) NOT NULL DEFAULT '0',
  `validFrom` datetime(3) DEFAULT NULL,
  `validTo` datetime(3) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `price_lists_tenantId_name_key` (`tenantId`,`name`),
  KEY `price_lists_tenantId_idx` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `price_lists` WRITE;
/*!40000 ALTER TABLE `price_lists` DISABLE KEYS */;
/*!40000 ALTER TABLE `price_lists` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alt` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sortOrder` int NOT NULL DEFAULT '0',
  `isPrimary` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `product_images_tenantId_idx` (`tenantId`),
  KEY `product_images_productId_idx` (`productId`),
  CONSTRAINT `product_images_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `product_modifiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_modifiers` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `priceExtra` decimal(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `idx_pm_tenant` (`tenantId`),
  KEY `idx_pm_prod` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `product_modifiers` WRITE;
/*!40000 ALTER TABLE `product_modifiers` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_modifiers` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `product_recipes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_recipes` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipeProductId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ingredientProductId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qtyRequired` decimal(12,4) NOT NULL,
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unit',
  `unitCost` decimal(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `idx_pr_tenant` (`tenantId`),
  KEY `idx_pr_recipe` (`recipeProductId`),
  KEY `idx_pr_ing` (`ingredientProductId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `product_recipes` WRITE;
/*!40000 ALTER TABLE `product_recipes` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_recipes` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variants` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `costPrice` decimal(14,2) DEFAULT NULL,
  `sellingPrice` decimal(14,2) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `maxPrice` decimal(14,2) DEFAULT NULL,
  `minPrice` decimal(14,2) DEFAULT NULL,
  `wholesalePrice` decimal(14,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_variants_tenantId_sku_key` (`tenantId`,`sku`),
  KEY `product_variants_tenantId_idx` (`tenantId`),
  KEY `product_variants_productId_idx` (`productId`),
  CONSTRAINT `product_variants_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `production_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_order_items` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productionOrderId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qtyRequired` decimal(14,3) NOT NULL DEFAULT '0.000',
  `qtyConsumed` decimal(14,3) NOT NULL DEFAULT '0.000',
  `unitCost` decimal(14,4) NOT NULL DEFAULT '0.0000',
  `lineCost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_poi_tenant` (`tenantId`),
  KEY `idx_poi_order` (`productionOrderId`),
  KEY `idx_poi_product` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `production_order_items` WRITE;
/*!40000 ALTER TABLE `production_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `production_order_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `production_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_orders` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warehouseId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `productionNo` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finishedProductId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finishedProductName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qtyPlanned` decimal(14,3) NOT NULL DEFAULT '0.000',
  `qtyProduced` decimal(14,3) NOT NULL DEFAULT '0.000',
  `yieldPct` decimal(5,2) NOT NULL DEFAULT '100.00',
  `qtyWastage` decimal(14,3) NOT NULL DEFAULT '0.000',
  `batchNo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('DRAFT','IN_PROGRESS','COMPLETED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `productionDate` date DEFAULT NULL,
  `dueDate` date DEFAULT NULL,
  `materialCost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `laborCost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `overheadCost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `totalCost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `unitCost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_po_tenant_no` (`tenantId`,`productionNo`),
  KEY `idx_po_tenant` (`tenantId`),
  KEY `idx_po_status` (`status`),
  KEY `idx_po_finished` (`finishedProductId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `production_orders` WRITE;
/*!40000 ALTER TABLE `production_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `production_orders` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `brandId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unitId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `productType` enum('SIMPLE','VARIABLE','SERVICE','BUNDLE','KIT','RECIPE','BATCH_CONTROLLED','SERIALIZED','WEIGHTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SIMPLE',
  `costPrice` decimal(14,2) NOT NULL DEFAULT '0.00',
  `sellingPrice` decimal(14,2) NOT NULL DEFAULT '0.00',
  `wholesalePrice` decimal(14,2) DEFAULT NULL,
  `minPrice` decimal(14,2) DEFAULT NULL,
  `maxPrice` decimal(14,2) DEFAULT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manufacturer` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplierId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `taxRate` decimal(5,2) DEFAULT NULL,
  `warrantyDays` int DEFAULT NULL,
  `reorderPoint` decimal(12,2) DEFAULT '10.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_tenantId_sku_key` (`tenantId`,`sku`),
  UNIQUE KEY `products_tenantId_barcode_key` (`tenantId`,`barcode`),
  KEY `products_tenantId_idx` (`tenantId`),
  KEY `products_categoryId_idx` (`categoryId`),
  KEY `products_brandId_idx` (`brandId`),
  KEY `products_unitId_fkey` (`unitId`),
  KEY `products_supplierId_idx` (`supplierId`),
  CONSTRAINT `products_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES ('2acc08b6-3f2b-46b8-bb49-280eae4490f9','1798fdaa-84d9-4bd4-903d-02784a398676','daeafb68-d12d-4e75-9e65-b98559af691d','2d1877e5-3b96-45ac-a5c0-501a360fd5db','8beee368-eb8a-4326-89c4-f5db53849de1','Orange Juice','BEV-003',NULL,'SIMPLE',80.00,150.00,NULL,NULL,NULL,NULL,'ACTIVE','2026-09-04 17:25:43.397','2026-09-04 17:25:43',NULL,NULL,NULL,NULL,NULL,NULL,10.00),('5282ce54-f887-4a30-a7af-d5e4d4207bc8','1798fdaa-84d9-4bd4-903d-02784a398676','daeafb68-d12d-4e75-9e65-b98559af691d','2d1877e5-3b96-45ac-a5c0-501a360fd5db','8beee368-eb8a-4326-89c4-f5db53849de1','Cold Coffee','BEV-001',NULL,'SIMPLE',60.00,120.00,NULL,NULL,NULL,NULL,'ACTIVE','2026-09-04 17:25:43.396','2026-09-04 17:53:27',NULL,'538dd563-88aa-4c96-8213-f1ebc6664a49',NULL,NULL,NULL,NULL,10.00),('df91a0ef-ce17-4dc5-aa35-ea77501cf8ca','1798fdaa-84d9-4bd4-903d-02784a398676','daeafb68-d12d-4e75-9e65-b98559af691d','2d1877e5-3b96-45ac-a5c0-501a360fd5db','8beee368-eb8a-4326-89c4-f5db53849de1','Hot Tea','BEV-002',NULL,'SIMPLE',15.00,30.00,NULL,NULL,NULL,NULL,'ACTIVE','2026-09-04 17:25:43.397','2026-09-04 17:25:43',NULL,NULL,NULL,NULL,NULL,NULL,10.00);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `promotion_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotion_products` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `promotionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `variantId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `promotion_products_tenantId_promotionId_productId_variantId_key` (`tenantId`,`promotionId`,`productId`,`variantId`),
  KEY `promotion_products_tenantId_idx` (`tenantId`),
  KEY `promotion_products_promotionId_idx` (`promotionId`),
  KEY `promotion_products_productId_idx` (`productId`),
  KEY `promotion_products_variantId_fkey` (`variantId`),
  CONSTRAINT `promotion_products_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `promotion_products_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `promotions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `promotion_products_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `promotion_products` WRITE;
/*!40000 ALTER TABLE `promotion_products` DISABLE KEYS */;
/*!40000 ALTER TABLE `promotion_products` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('PERCENTAGE','FIXED','BUY_X_GET_Y','BUNDLE','COMBO','CATEGORY_DISCOUNT','PRODUCT_DISCOUNT','BRANCH_DISCOUNT','CUSTOMER_GROUP_DISCOUNT','HAPPY_HOUR','COUPON') COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` decimal(14,2) NOT NULL,
  `minQty` decimal(14,3) DEFAULT NULL,
  `minAmount` decimal(14,2) DEFAULT NULL,
  `maxDiscount` decimal(14,2) DEFAULT NULL,
  `buyQty` int DEFAULT NULL,
  `getQty` int DEFAULT NULL,
  `bundlePrice` decimal(14,2) DEFAULT NULL,
  `comboPrice` decimal(14,2) DEFAULT NULL,
  `applicableBranches` json DEFAULT NULL,
  `applicableCustomerGroups` json DEFAULT NULL,
  `timeStart` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timeEnd` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `applicableDays` json DEFAULT NULL,
  `validFrom` datetime(3) DEFAULT NULL,
  `validTo` datetime(3) DEFAULT NULL,
  `priority` int NOT NULL DEFAULT '0',
  `conflictResolution` enum('HIGHEST_PRIORITY','STACK','FIRST_MATCH') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HIGHEST_PRIORITY',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `usageLimit` int DEFAULT NULL,
  `usageCount` int NOT NULL DEFAULT '0',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `promotions_tenantId_name_key` (`tenantId`,`name`),
  KEY `promotions_tenantId_idx` (`tenantId`),
  KEY `promotions_type_idx` (`type`),
  KEY `promotions_validFrom_validTo_idx` (`validFrom`,`validTo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `promotions` WRITE;
/*!40000 ALTER TABLE `promotions` DISABLE KEYS */;
/*!40000 ALTER TABLE `promotions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `purchase_invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_invoice_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purchaseInvoiceId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qty` decimal(14,3) NOT NULL,
  `costPrice` decimal(14,2) NOT NULL,
  `discountAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `taxAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `lineTotal` decimal(14,2) NOT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `purchase_invoice_items_tenantId_idx` (`tenantId`),
  KEY `purchase_invoice_items_purchaseInvoiceId_idx` (`purchaseInvoiceId`),
  KEY `purchase_invoice_items_productId_fkey` (`productId`),
  CONSTRAINT `purchase_invoice_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `purchase_invoice_items_purchaseInvoiceId_fkey` FOREIGN KEY (`purchaseInvoiceId`) REFERENCES `purchase_invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `purchase_invoice_items` WRITE;
/*!40000 ALTER TABLE `purchase_invoice_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_invoice_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `purchase_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_invoices` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplierId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purchaseOrderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `goodsReceiptId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `piNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoiceDate` date NOT NULL,
  `dueDate` date DEFAULT NULL,
  `subtotal` decimal(14,2) NOT NULL,
  `discountTotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `taxTotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total` decimal(14,2) NOT NULL,
  `paidTotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `status` enum('UNPAID','PARTIALLY_PAID','PAID','VOID') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNPAID',
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchase_invoices_tenantId_piNo_key` (`tenantId`,`piNo`),
  KEY `purchase_invoices_tenantId_idx` (`tenantId`),
  KEY `purchase_invoices_supplierId_idx` (`supplierId`),
  KEY `purchase_invoices_purchaseOrderId_fkey` (`purchaseOrderId`),
  KEY `purchase_invoices_goodsReceiptId_fkey` (`goodsReceiptId`),
  KEY `purchase_invoices_branchId_fkey` (`branchId`),
  CONSTRAINT `purchase_invoices_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `purchase_invoices_goodsReceiptId_fkey` FOREIGN KEY (`goodsReceiptId`) REFERENCES `goods_receipts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `purchase_invoices_purchaseOrderId_fkey` FOREIGN KEY (`purchaseOrderId`) REFERENCES `purchase_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `purchase_invoices_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `purchase_invoices` WRITE;
/*!40000 ALTER TABLE `purchase_invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_invoices` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warehouseId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplierId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `poNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderDate` date NOT NULL,
  `expectedDate` date DEFAULT NULL,
  `status` enum('DRAFT','SUBMITTED','APPROVED','PARTIALLY_RECEIVED','RECEIVED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchase_orders_tenantId_poNo_key` (`tenantId`,`poNo`),
  KEY `purchase_orders_tenantId_idx` (`tenantId`),
  KEY `purchase_orders_supplierId_idx` (`supplierId`),
  KEY `purchase_orders_branchId_fkey` (`branchId`),
  KEY `purchase_orders_warehouseId_fkey` (`warehouseId`),
  CONSTRAINT `purchase_orders_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `purchase_orders_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `purchase_orders_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `purchase_recommendations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_recommendations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productName` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warehouseId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currentStock` decimal(14,2) NOT NULL DEFAULT '0.00',
  `reorderPoint` decimal(14,2) NOT NULL DEFAULT '0.00',
  `suggestedQty` decimal(14,2) NOT NULL DEFAULT '0.00',
  `status` enum('PENDING','CONVERTED','DISMISSED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `sourceRuleId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pcr_tenant` (`tenantId`),
  KEY `idx_pcr_product` (`productId`),
  KEY `idx_pcr_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `purchase_recommendations` WRITE;
/*!40000 ALTER TABLE `purchase_recommendations` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_recommendations` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `purchase_requisition_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_requisition_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requisitionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qty` decimal(14,3) NOT NULL DEFAULT '0.000',
  `estUnitPrice` decimal(14,2) NOT NULL DEFAULT '0.00',
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_pri_tenant` (`tenantId`),
  KEY `idx_pri_requisition` (`requisitionId`),
  KEY `idx_pri_product` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `purchase_requisition_items` WRITE;
/*!40000 ALTER TABLE `purchase_requisition_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_requisition_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `purchase_requisitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_requisitions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warehouseId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requestedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requestDate` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `expectedDate` datetime(3) DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_pr_tenant` (`tenantId`),
  KEY `idx_pr_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `purchase_requisitions` WRITE;
/*!40000 ALTER TABLE `purchase_requisitions` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_requisitions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `purchase_return_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_return_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `returnId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `variantId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qty` decimal(14,3) NOT NULL DEFAULT '0.000',
  `unitPrice` decimal(14,2) NOT NULL DEFAULT '0.00',
  `lineTotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_pri2_tenant` (`tenantId`),
  KEY `idx_pri2_return` (`returnId`),
  KEY `idx_pri2_product` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `purchase_return_items` WRITE;
/*!40000 ALTER TABLE `purchase_return_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_return_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `purchase_returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_returns` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warehouseId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplierId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purchaseOrderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `goodsReceiptId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purchaseInvoiceId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `returnNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `returnDate` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `subtotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total` decimal(14,2) NOT NULL DEFAULT '0.00',
  `returnType` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CREDIT_NOTE',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RETURNED',
  `reason` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_pret_tenant` (`tenantId`),
  KEY `idx_pret_supplier` (`supplierId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `purchase_returns` WRITE;
/*!40000 ALTER TABLE `purchase_returns` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_returns` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `qr_menus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `qr_menus` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoryFilter` json DEFAULT NULL COMMENT '["categoryId"] to show only certain categories',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_qm_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `qr_menus` WRITE;
/*!40000 ALTER TABLE `qr_menus` DISABLE KEYS */;
/*!40000 ALTER TABLE `qr_menus` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `quotations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotations` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quotationNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quotationDate` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `validUntil` datetime(3) DEFAULT NULL,
  `subtotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total` decimal(14,2) NOT NULL DEFAULT '0.00',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_q_tenant` (`tenantId`),
  KEY `idx_q_customer` (`customerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `quotations` WRITE;
/*!40000 ALTER TABLE `quotations` DISABLE KEYS */;
/*!40000 ALTER TABLE `quotations` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `rate_limits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rate_limits` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `identifier` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'IP or userId',
  `endpoint` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requestCount` int NOT NULL DEFAULT '1',
  `windowStart` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `blocked` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_rl_identifier` (`identifier`,`endpoint`,`windowStart`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `rate_limits` WRITE;
/*!40000 ALTER TABLE `rate_limits` DISABLE KEYS */;
/*!40000 ALTER TABLE `rate_limits` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `realtime_channels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `realtime_channels` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channelType` enum('KDS','DASHBOARD','SYNC','DELIVERY','INVENTORY','POS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `channelId` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Composite key: tenantId:branchId:channelType',
  `subscriberCount` int NOT NULL DEFAULT '0',
  `lastEventAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rc_channel` (`tenantId`,`channelId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `realtime_channels` WRITE;
/*!40000 ALTER TABLE `realtime_channels` DISABLE KEYS */;
/*!40000 ALTER TABLE `realtime_channels` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `realtime_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `realtime_events` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channelType` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `eventType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'KOT_CREATED, KDS_STATUS_CHANGED, ORDER_RECEIVED, SYNC_UPDATE, etc.',
  `payload` json NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivered` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_re_tenant` (`tenantId`,`channelType`,`createdAt`),
  KEY `idx_re_delivery` (`delivered`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `realtime_events` WRITE;
/*!40000 ALTER TABLE `realtime_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `realtime_events` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `recurring_expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recurring_expenses` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoryId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `frequency` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MONTHLY',
  `nextRunDate` datetime(3) DEFAULT NULL,
  `endDate` datetime(3) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `lastGeneratedAt` datetime(3) DEFAULT NULL,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_re_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `recurring_expenses` WRITE;
/*!40000 ALTER TABLE `recurring_expenses` DISABLE KEYS */;
INSERT INTO `recurring_expenses` VALUES ('96565a92-a856-11f1-8c08-141333ebccfd','1798fdaa-84d9-4bd4-903d-02784a398676',NULL,NULL,'P3922385 Auto',77.00,'DAILY','2026-09-05 17:52:40.273',NULL,1,'2026-09-04 17:52:40.273','538dd563-88aa-4c96-8213-f1ebc6664a49','2026-09-04 17:48:46.808','2026-09-04 17:52:40.273');
/*!40000 ALTER TABLE `recurring_expenses` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `repair_ticket_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `repair_ticket_items` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticketId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lineType` enum('PART','LABOR','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PART',
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qty` decimal(14,3) NOT NULL DEFAULT '1.000',
  `unitPrice` decimal(14,2) NOT NULL DEFAULT '0.00',
  `lineTotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rti_tenant` (`tenantId`),
  KEY `idx_rti_ticket` (`ticketId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `repair_ticket_items` WRITE;
/*!40000 ALTER TABLE `repair_ticket_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `repair_ticket_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `repair_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `repair_tickets` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ticketNo` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `serialId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `serialNo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deviceInfo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reportedProblem` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `diagnosis` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('RECEIVED','INSPECTION','ESTIMATE','APPROVED','REPAIRING','QUALITY_CHECK','READY','DELIVERED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RECEIVED',
  `priority` enum('LOW','MEDIUM','HIGH','URGENT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEDIUM',
  `technicianId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `technicianName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receivedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dueAt` date DEFAULT NULL,
  `estimatedCost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `laborCost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `partsCost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `actualCost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `warrantyEligible` tinyint(1) NOT NULL DEFAULT '0',
  `warrantyType` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warrantyStart` date DEFAULT NULL,
  `warrantyEnd` date DEFAULT NULL,
  `warrantyClaimId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rt_tenant_no` (`tenantId`,`ticketNo`),
  KEY `idx_rt_tenant` (`tenantId`),
  KEY `idx_rt_status` (`status`),
  KEY `idx_rt_customer` (`customerId`),
  KEY `idx_rt_serial` (`serialNo`),
  KEY `idx_rt_technician` (`technicianId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `repair_tickets` WRITE;
/*!40000 ALTER TABLE `repair_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `repair_tickets` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `restaurant_floors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_floors` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sortOrder` int NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rf_tenant` (`tenantId`),
  KEY `idx_rf_branch` (`branchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `restaurant_floors` WRITE;
/*!40000 ALTER TABLE `restaurant_floors` DISABLE KEYS */;
/*!40000 ALTER TABLE `restaurant_floors` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `restaurant_kot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_kot` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tableId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kotNo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderType` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DINE_IN',
  `station` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'KITCHEN',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NEW',
  `waiterUserId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kot_tenant` (`tenantId`),
  KEY `idx_kot_branch` (`branchId`),
  KEY `idx_kot_table` (`tableId`),
  KEY `idx_kot_station` (`station`),
  KEY `idx_kot_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `restaurant_kot` WRITE;
/*!40000 ALTER TABLE `restaurant_kot` DISABLE KEYS */;
/*!40000 ALTER TABLE `restaurant_kot` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `restaurant_kot_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_kot_items` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kotId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qty` decimal(12,4) NOT NULL DEFAULT '1.0000',
  `modifiersJson` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NEW',
  PRIMARY KEY (`id`),
  KEY `idx_koti_kot` (`kotId`),
  KEY `idx_koti_prod` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `restaurant_kot_items` WRITE;
/*!40000 ALTER TABLE `restaurant_kot_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `restaurant_kot_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `restaurant_tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_tables` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `floorId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tableNo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacity` int NOT NULL DEFAULT '4',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AVAILABLE',
  `currentOrderNo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currentSaleId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `waiterUserId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rt_tenant` (`tenantId`),
  KEY `idx_rt_branch` (`branchId`),
  KEY `idx_rt_floor` (`floorId`),
  KEY `idx_rt_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `restaurant_tables` WRITE;
/*!40000 ALTER TABLE `restaurant_tables` DISABLE KEYS */;
/*!40000 ALTER TABLE `restaurant_tables` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `returns` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `saleId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoiceId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `returnNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `returnType` enum('REFUND','REPLACEMENT','STORE_CREDIT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'REFUND',
  `reason` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refundAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `restocked` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('REQUESTED','APPROVED','COMPLETED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'REQUESTED',
  `processedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `returns_tenantId_returnNo_key` (`tenantId`,`returnNo`),
  KEY `returns_tenantId_idx` (`tenantId`),
  KEY `returns_saleId_idx` (`saleId`),
  KEY `returns_branchId_fkey` (`branchId`),
  KEY `returns_invoiceId_fkey` (`invoiceId`),
  CONSTRAINT `returns_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `returns_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `returns_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sales` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `returns` WRITE;
/*!40000 ALTER TABLE `returns` DISABLE KEYS */;
/*!40000 ALTER TABLE `returns` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `roleId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permissionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_permissions_roleId_permissionId_key` (`roleId`,`permissionId`),
  KEY `role_permissions_permissionId_idx` (`permissionId`),
  CONSTRAINT `role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES ('02cd5a23-499b-4dbd-a399-1dcd0aa264a9','07289554-800f-477d-a351-d93c6d66f35a','ea4623fd-f7d3-406c-aa93-bb3eccf15430','2026-09-04 17:25:43.322'),('10322534-88bf-45a5-93c3-e079c2804638','07289554-800f-477d-a351-d93c6d66f35a','52676afc-d44f-4efb-8cdb-c5f0f079c8ec','2026-09-04 17:25:43.328'),('179722ce-7f55-4afa-b51d-e1c669fe9b3c','07289554-800f-477d-a351-d93c6d66f35a','13a99b14-8a1e-4251-9885-5ea347d1ee99','2026-09-04 17:25:43.318'),('19efbab9-e9e0-41f2-a9d4-284a8ac13382','07289554-800f-477d-a351-d93c6d66f35a','637a25bd-3c89-4e94-9fb1-ef6f3aad588d','2026-09-04 17:25:43.322'),('1a9c2a40-5e80-4174-87ce-144eec4ca699','07289554-800f-477d-a351-d93c6d66f35a','73cd5d9c-813e-4f5d-a0f2-26527b0a8b53','2026-09-04 17:25:43.318'),('1d3177ea-c82d-4092-9729-04563b842bd8','07289554-800f-477d-a351-d93c6d66f35a','6aeac311-4234-4ad4-99cd-ff08ba9a9d82','2026-09-04 17:25:43.326'),('23a54721-8a45-4d7b-81a5-ab44b14065d9','07289554-800f-477d-a351-d93c6d66f35a','5767f4cf-19c4-4f27-b956-65e1dee5abf1','2026-09-04 17:25:43.328'),('2553066a-bf10-444f-8681-c20e54bdb562','07289554-800f-477d-a351-d93c6d66f35a','454986f6-9f3c-4d92-a1d3-ebcb8d884884','2026-09-04 17:45:52.956'),('25561205-a85d-4ffd-a7df-a1926a29b99d','07289554-800f-477d-a351-d93c6d66f35a','faf41e75-3cd5-4653-99c1-46b3d0a2371e','2026-09-04 17:25:43.321'),('33ba838d-0abb-4d42-aba2-3ebd322cca5e','07289554-800f-477d-a351-d93c6d66f35a','50a64d6e-2897-41f8-97c5-36f109437ccc','2026-09-04 17:25:43.327'),('3b67d23d-2759-4188-9d27-9020ba6c55f5','07289554-800f-477d-a351-d93c6d66f35a','b31c7da1-a07a-403f-893a-adacd51a1294','2026-09-04 17:25:43.318'),('4d2808a1-67a4-4e6e-9def-44d0f70ac0fc','07289554-800f-477d-a351-d93c6d66f35a','fb7ac8eb-cb3a-4217-a6bc-d6178b9662d5','2026-09-04 17:25:43.323'),('528449b0-cdc9-4b50-b667-8cba9d19c13c','07289554-800f-477d-a351-d93c6d66f35a','32d13b9a-5ce5-4b64-bed6-696561f2e535','2026-09-04 17:25:43.326'),('5328ca42-7eab-4a65-9eb8-c037c1fcc79a','07289554-800f-477d-a351-d93c6d66f35a','31aa97ae-f86a-409d-8641-c624ce2e4a48','2026-09-04 17:25:43.327'),('537de65a-3041-410a-9f59-ed553ca9fa4f','07289554-800f-477d-a351-d93c6d66f35a','cd1971d5-0155-41f7-b6f2-5319a442b7b7','2026-09-04 17:25:43.319'),('572d5d42-b64b-4a93-b871-3a27adf6e8f1','07289554-800f-477d-a351-d93c6d66f35a','fdbcfe43-5a6c-4d69-8430-7fa91772d13a','2026-09-04 17:25:43.323'),('57e7d04a-3f05-43e5-8e10-43ee17cdeae5','07289554-800f-477d-a351-d93c6d66f35a','0c4b2714-2021-4107-97db-e0779749b98f','2026-09-04 17:25:43.325'),('5874da41-af70-4b9f-9532-db0f72c7cd21','07289554-800f-477d-a351-d93c6d66f35a','9baa2aa5-9719-4b12-8396-0dbc26b66d30','2026-09-04 17:25:43.320'),('5e940ed4-d681-4222-9236-adcfae77bb09','07289554-800f-477d-a351-d93c6d66f35a','261a6e4b-7a5f-4e9b-be83-db2be8b3af58','2026-09-04 17:25:43.316'),('652bca71-97f8-4ecc-a620-16b17bda47ff','07289554-800f-477d-a351-d93c6d66f35a','66fc8b75-d2c8-45e4-bbf3-a7eb643937a9','2026-09-04 17:25:43.318'),('6a28833d-504d-46e9-87d9-feb70a8afcdf','07289554-800f-477d-a351-d93c6d66f35a','398f8874-825f-418c-9273-39c2fd4199ec','2026-09-04 17:25:43.321'),('6b8f503f-c8ba-45f1-9ea2-db9b3e43c43f','07289554-800f-477d-a351-d93c6d66f35a','0aa78bf2-4ba1-4857-a231-ff69ec23f48e','2026-09-04 17:25:43.317'),('6e0d25fe-d4c9-41b3-865e-b970dc031cd9','07289554-800f-477d-a351-d93c6d66f35a','a3b7cbdf-977e-45cc-9f76-635c96878601','2026-09-04 17:25:43.324'),('6f0f8a2e-6a95-47c1-ad67-9c8378fc21ea','07289554-800f-477d-a351-d93c6d66f35a','a74e49f8-dec8-4a81-80f6-461ae4c6ef0d','2026-09-04 17:25:43.329'),('755a2dea-aa0a-4dd2-b2e3-3da8c268d588','07289554-800f-477d-a351-d93c6d66f35a','13262801-6edb-4b54-bad6-b2061525cfeb','2026-09-04 17:25:43.325'),('76c56094-dff3-4c83-8b39-8eb970da07e7','07289554-800f-477d-a351-d93c6d66f35a','1cb7bf4e-7826-450f-bf6b-8b73cbce7cd5','2026-09-04 17:25:43.319'),('7a5523ee-d9e2-426c-93fd-1cdeaa6d8129','3a3670c5-3fc7-4184-9f11-8cda10979547','261a6e4b-7a5f-4e9b-be83-db2be8b3af58','2026-09-04 17:25:43.330'),('8445bebd-d4d0-4bde-8bd0-1530c4696244','3a3670c5-3fc7-4184-9f11-8cda10979547','0aa78bf2-4ba1-4857-a231-ff69ec23f48e','2026-09-04 17:25:43.330'),('87277a05-a15c-4cd6-898b-eb4e7b4ad142','3a3670c5-3fc7-4184-9f11-8cda10979547','73cd5d9c-813e-4f5d-a0f2-26527b0a8b53','2026-09-04 17:25:43.330'),('97bdd60b-0394-43dc-a681-c93eea44a3b2','07289554-800f-477d-a351-d93c6d66f35a','81f10980-6468-4c65-b52b-ec5a8c898446','2026-09-04 17:25:43.323'),('9a3f9914-1e1a-4795-9caa-131d4aba036c','07289554-800f-477d-a351-d93c6d66f35a','a867f08c-b12a-4e7c-b5fa-62366fe01a50','2026-09-04 17:25:43.320'),('9fa448e8-c3d3-46cb-bf3f-d608c3c5ad44','07289554-800f-477d-a351-d93c6d66f35a','4d9dcdf0-2d31-4760-b57f-9e0e712f79fa','2026-09-04 17:25:43.325'),('b5fcffd8-9135-4025-8cf0-a666398d0f00','07289554-800f-477d-a351-d93c6d66f35a','a6a637d8-d5ab-4e1a-a505-0a1d8293f2ab','2026-09-04 17:25:43.328'),('b7e1ac0c-0511-47bb-ad5a-7713a770d73f','07289554-800f-477d-a351-d93c6d66f35a','e5fd732d-1d17-4b4b-8588-7e0d6f6da3e3','2026-09-04 17:25:43.328'),('bc6fe60c-9cfe-4884-ba9c-b1deb4cd4a9a','07289554-800f-477d-a351-d93c6d66f35a','1cf0578c-db4c-4f5f-8d2a-9db921da0b23','2026-09-04 17:25:43.321'),('bd84b122-483d-41e0-8fe3-36b1cf5e9790','07289554-800f-477d-a351-d93c6d66f35a','026db360-9f6e-476e-af51-67b0d2aaa02c','2026-09-04 17:25:43.319'),('bdf89fd9-e2dd-4495-a145-fb586de4d737','07289554-800f-477d-a351-d93c6d66f35a','142d5c22-448a-465a-9946-0563452ecb00','2026-09-04 17:25:43.321'),('be197f84-1b7e-4ad2-8e70-a84d1b021908','3a3670c5-3fc7-4184-9f11-8cda10979547','1cb7bf4e-7826-450f-bf6b-8b73cbce7cd5','2026-09-04 17:25:43.331'),('c89c22c1-340c-4f37-a3c9-19bd6ed0e730','07289554-800f-477d-a351-d93c6d66f35a','8f021061-b011-40b2-b7f1-9a9da5b66825','2026-09-04 17:25:43.326'),('d1d840b6-787c-4e9a-8162-675e38d41116','07289554-800f-477d-a351-d93c6d66f35a','32dae15b-d82a-444e-9cc9-916b0ec705a8','2026-09-04 17:25:43.319'),('d297c4ee-7304-4ad7-8dfc-307453c76161','07289554-800f-477d-a351-d93c6d66f35a','63c3ff06-2d8d-4903-a233-2fd8d928e782','2026-09-04 17:25:43.320'),('d75eeb1b-7955-4f12-9d08-eed56b0984a5','07289554-800f-477d-a351-d93c6d66f35a','98c72d63-b9bd-478f-a903-d803978e7772','2026-09-04 17:25:43.327'),('daa6d503-5f3c-4d6f-9d45-29b5e9d7e9f1','07289554-800f-477d-a351-d93c6d66f35a','fa856865-2760-4b4c-b12c-244a0a20ffa7','2026-09-04 17:25:43.329'),('dd53589b-6165-4369-a708-bdd6f05e1429','07289554-800f-477d-a351-d93c6d66f35a','d481cf60-d9b4-49c7-aa87-9cf86f3745cc','2026-09-04 17:25:43.329'),('e5692f2f-9445-443a-b6e0-a0ca42e69e0f','07289554-800f-477d-a351-d93c6d66f35a','1108eed7-b5da-4e46-ba67-513b7e63ace9','2026-09-04 17:25:43.322'),('efc68595-31a7-4a6a-9889-8b4539dcbb8e','07289554-800f-477d-a351-d93c6d66f35a','4f1a778d-08ae-46b3-8f07-f24ab893bb94','2026-09-04 17:25:43.323'),('f0c974cb-4584-4c52-a157-a818fb452ec1','07289554-800f-477d-a351-d93c6d66f35a','c2ae35e6-8ca0-4b91-bd09-f68bca4dcefe','2026-09-04 17:25:43.329'),('f3fc8162-3926-43e6-a059-08b6ba2c65c5','07289554-800f-477d-a351-d93c6d66f35a','ebf2e5b8-5721-4df5-b858-151acc315c6f','2026-09-04 17:25:43.320'),('f4ff2c5b-58f2-419a-a72a-1b468b8b96c4','07289554-800f-477d-a351-d93c6d66f35a','feb2683d-f31d-43ba-991a-4688477cd142','2026-09-04 17:25:43.324'),('f76b9e83-f1d5-4da8-8c68-22229a7b2f27','07289554-800f-477d-a351-d93c6d66f35a','57b81b6d-1bdb-417d-91b1-02d2a8f29101','2026-09-04 17:25:43.322');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isSystem` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_tenantId_name_key` (`tenantId`,`name`),
  KEY `roles_tenantId_idx` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES ('07289554-800f-477d-a351-d93c6d66f35a','1798fdaa-84d9-4bd4-903d-02784a398676','Owner',NULL,1,'ACTIVE','2026-09-04 17:25:43.316','2026-09-04 17:25:43.316',NULL,NULL),('3a3670c5-3fc7-4184-9f11-8cda10979547','1798fdaa-84d9-4bd4-903d-02784a398676','Cashier',NULL,1,'ACTIVE','2026-09-04 17:25:43.316','2026-09-04 17:25:43.316',NULL,NULL);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `saas_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saas_invoices` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subscriptionId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `status` enum('PENDING','PAID','OVERDUE','VOID') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `billingPeriod` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paidAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_si_tenant` (`tenantId`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `saas_invoices` WRITE;
/*!40000 ALTER TABLE `saas_invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `saas_invoices` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `saas_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saas_plans` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'STARTER/BUSINESS/ENTERPRISE',
  `description` text COLLATE utf8mb4_unicode_ci,
  `monthlyPrice` decimal(12,2) NOT NULL DEFAULT '0.00',
  `yearlyPrice` decimal(12,2) NOT NULL DEFAULT '0.00',
  `maxUsers` int NOT NULL DEFAULT '5',
  `maxBranches` int NOT NULL DEFAULT '1',
  `maxWarehouses` int NOT NULL DEFAULT '1',
  `maxPOS` int NOT NULL DEFAULT '1',
  `maxProducts` int NOT NULL DEFAULT '1000',
  `maxStorageMB` int NOT NULL DEFAULT '500',
  `maxAPICallsDaily` int NOT NULL DEFAULT '10000',
  `maxAIQueriesDaily` int NOT NULL DEFAULT '50',
  `includedModules` json DEFAULT NULL COMMENT '["pos","inventory","accounting"]',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `saas_plans` WRITE;
/*!40000 ALTER TABLE `saas_plans` DISABLE KEYS */;
/*!40000 ALTER TABLE `saas_plans` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `saas_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saas_subscriptions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `planId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `billingCycle` enum('MONTHLY','YEARLY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MONTHLY',
  `status` enum('TRIAL','ACTIVE','PAST_DUE','GRACE','SUSPENDED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TRIAL',
  `trialEndsAt` datetime DEFAULT NULL,
  `currentPeriodStart` datetime DEFAULT NULL,
  `currentPeriodEnd` datetime DEFAULT NULL,
  `cancelledAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ss_tenant` (`tenantId`),
  KEY `idx_ss_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `saas_subscriptions` WRITE;
/*!40000 ALTER TABLE `saas_subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `saas_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `saas_usage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saas_usage` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `periodStart` date NOT NULL,
  `users` int NOT NULL DEFAULT '0',
  `branches` int NOT NULL DEFAULT '0',
  `pos` int NOT NULL DEFAULT '0',
  `products` int NOT NULL DEFAULT '0',
  `transactions` int NOT NULL DEFAULT '0',
  `apiCalls` int NOT NULL DEFAULT '0',
  `aiQueries` int NOT NULL DEFAULT '0',
  `storageMB` decimal(12,2) NOT NULL DEFAULT '0.00',
  `activeDevices` int NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usage` (`tenantId`,`periodStart`),
  KEY `idx_su_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `saas_usage` WRITE;
/*!40000 ALTER TABLE `saas_usage` DISABLE KEYS */;
/*!40000 ALTER TABLE `saas_usage` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `saleId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `variantId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qty` decimal(14,3) NOT NULL,
  `unitPrice` decimal(14,2) NOT NULL,
  `discountAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `lineTotal` decimal(14,2) NOT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sale_items_tenantId_idx` (`tenantId`),
  KEY `sale_items_saleId_idx` (`saleId`),
  KEY `sale_items_productId_idx` (`productId`),
  KEY `sale_items_variantId_fkey` (`variantId`),
  CONSTRAINT `sale_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `sale_items_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sales` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `sale_items_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `sale_items` WRITE;
/*!40000 ALTER TABLE `sale_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `sale_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `terminalId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoiceNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `saleDate` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `subtotal` decimal(14,2) NOT NULL,
  `discountTotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `taxTotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `serviceCharge` decimal(14,2) DEFAULT NULL,
  `roundOff` decimal(14,2) DEFAULT NULL,
  `total` decimal(14,2) NOT NULL,
  `paidTotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `dueTotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `paymentStatus` enum('UNPAID','PARTIAL','PAID') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNPAID',
  `status` enum('DRAFT','CONFIRMED','COMPLETED','CANCELLED','RETURNED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CONFIRMED',
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shiftId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sales_tenantId_invoiceNo_key` (`tenantId`,`invoiceNo`),
  KEY `sales_tenantId_idx` (`tenantId`),
  KEY `sales_branchId_idx` (`branchId`),
  KEY `sales_customerId_idx` (`customerId`),
  KEY `sales_userId_idx` (`userId`),
  KEY `sales_saleDate_idx` (`saleDate`),
  KEY `sales_terminalId_fkey` (`terminalId`),
  CONSTRAINT `sales_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `sales_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `sales_terminalId_fkey` FOREIGN KEY (`terminalId`) REFERENCES `terminals` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `sales_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `sales_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_order_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `salesOrderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qtyOrdered` decimal(14,3) NOT NULL DEFAULT '0.000',
  `unitPrice` decimal(14,2) NOT NULL DEFAULT '0.00',
  `lineTotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_soi_tenant` (`tenantId`),
  KEY `idx_soi_order` (`salesOrderId`),
  KEY `idx_soi_product` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `sales_order_items` WRITE;
/*!40000 ALTER TABLE `sales_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_order_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `sales_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_orders` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warehouseId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orderNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `source` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT 'POS',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `subtotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `discountTotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `taxTotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total` decimal(14,2) NOT NULL DEFAULT '0.00',
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_so_tenant` (`tenantId`),
  KEY `idx_so_branch` (`branchId`),
  KEY `idx_so_status` (`status`),
  KEY `idx_so_customer` (`customerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `sales_orders` WRITE;
/*!40000 ALTER TABLE `sales_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_orders` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `sales_targets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_targets` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scopeType` enum('EMPLOYEE','AGENT','BRANCH','DEPARTMENT','CATEGORY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EMPLOYEE',
  `scopeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `periodType` enum('MONTHLY','QUARTERLY','YEARLY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MONTHLY',
  `periodStart` date NOT NULL,
  `periodEnd` date NOT NULL,
  `targetAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `metric` enum('SALES_AMOUNT','UNITS','COLLECTION') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SALES_AMOUNT',
  `targetNote` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_st_tenant` (`tenantId`),
  KEY `idx_st_scope` (`scopeType`,`scopeId`),
  KEY `idx_st_period` (`periodStart`,`periodEnd`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `sales_targets` WRITE;
/*!40000 ALTER TABLE `sales_targets` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_targets` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `salon_package_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salon_package_items` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `packageId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `serviceId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qty` int NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_spi_pkg_svc` (`tenantId`,`packageId`,`serviceId`),
  KEY `idx_spi_tenant` (`tenantId`),
  KEY `idx_spi_package` (`packageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `salon_package_items` WRITE;
/*!40000 ALTER TABLE `salon_package_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `salon_package_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `salon_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salon_packages` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(14,2) NOT NULL DEFAULT '0.00',
  `regularPrice` decimal(14,2) NOT NULL DEFAULT '0.00',
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sp_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `salon_packages` WRITE;
/*!40000 ALTER TABLE `salon_packages` DISABLE KEYS */;
/*!40000 ALTER TABLE `salon_packages` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `salon_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salon_services` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'OTHER',
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(14,2) NOT NULL DEFAULT '0.00',
  `costPrice` decimal(14,2) NOT NULL DEFAULT '0.00',
  `durationMin` int NOT NULL DEFAULT '30',
  `commissionType` enum('NONE','PERCENTAGE','FIXED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NONE',
  `commissionValue` decimal(10,2) NOT NULL DEFAULT '0.00',
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ss_tenant` (`tenantId`),
  KEY `idx_ss_active` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `salon_services` WRITE;
/*!40000 ALTER TABLE `salon_services` DISABLE KEYS */;
/*!40000 ALTER TABLE `salon_services` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `saved_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saved_reports` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reportType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'SALES_SUMMARY/INVENTORY_VALUATION/PNL/ETC',
  `config` json DEFAULT NULL COMMENT '{filters, columns, sort}',
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sr_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `saved_reports` WRITE;
/*!40000 ALTER TABLE `saved_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `saved_reports` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `scheduled_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheduled_reports` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reportType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `config` json DEFAULT NULL COMMENT '{filters, columns}',
  `frequency` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'DAILY/WEEKLY/MONTHLY',
  `deliveryChannel` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EMAIL',
  `recipients` json DEFAULT NULL COMMENT '[email addresses]',
  `lastRunAt` datetime DEFAULT NULL,
  `nextRunAt` datetime DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_schedr_tenant` (`tenantId`,`isActive`),
  KEY `idx_schedr_next` (`nextRunAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `scheduled_reports` WRITE;
/*!40000 ALTER TABLE `scheduled_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `scheduled_reports` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `security_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `security_events` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `eventType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'LOGIN_SUCCESS, LOGIN_FAILED, RATE_LIMIT, SQL_INJECTION, XSS_ATTEMPT, IDOR_ATTEMPT, etc.',
  `severity` enum('LOW','MEDIUM','HIGH','CRITICAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'LOW',
  `ipAddress` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAgent` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `endpoint` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` json DEFAULT NULL,
  `blocked` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = request was blocked',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_se_tenant` (`tenantId`,`eventType`,`createdAt`),
  KEY `idx_se_severity` (`severity`,`createdAt`),
  KEY `idx_se_ip` (`ipAddress`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `security_events` WRITE;
/*!40000 ALTER TABLE `security_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `security_events` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `serials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `serials` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `serialNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('IN_STOCK','SOLD','RETURNED','IN_REPAIR','WRITTEN_OFF') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IN_STOCK',
  `saleItemId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warrantyStart` date DEFAULT NULL,
  `warrantyEnd` date DEFAULT NULL,
  `notes` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `serials_tenantId_serialNo_key` (`tenantId`,`serialNo`),
  KEY `serials_tenantId_idx` (`tenantId`),
  KEY `serials_productId_idx` (`productId`),
  CONSTRAINT `serials_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `serials` WRITE;
/*!40000 ALTER TABLE `serials` DISABLE KEYS */;
/*!40000 ALTER TABLE `serials` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenHash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deviceId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ipAddress` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAgent` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `revokedAt` datetime(3) DEFAULT NULL,
  `status` enum('ACTIVE','REVOKED','EXPIRED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sessions_tokenHash_key` (`tokenHash`),
  KEY `sessions_tenantId_idx` (`tenantId`),
  KEY `sessions_userId_idx` (`userId`),
  CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `shift_txns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shift_txns` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shiftId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `refType` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_st_tenant` (`tenantId`),
  KEY `idx_st_shift` (`shiftId`),
  KEY `idx_st_ref` (`refType`,`refId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `shift_txns` WRITE;
/*!40000 ALTER TABLE `shift_txns` DISABLE KEYS */;
/*!40000 ALTER TABLE `shift_txns` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouseId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `variantId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qtyOnHand` decimal(14,3) NOT NULL DEFAULT '0.000',
  `qtyReserved` decimal(14,3) NOT NULL DEFAULT '0.000',
  `avgCost` decimal(14,2) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `stock_tenantId_warehouseId_productId_variantId_key` (`tenantId`,`warehouseId`,`productId`,`variantId`),
  KEY `stock_tenantId_idx` (`tenantId`),
  KEY `stock_productId_idx` (`productId`),
  KEY `stock_warehouseId_fkey` (`warehouseId`),
  KEY `stock_variantId_fkey` (`variantId`),
  CONSTRAINT `stock_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `stock_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `stock_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `stock` WRITE;
/*!40000 ALTER TABLE `stock` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `stock_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_batches` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouseId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batchNo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qty` decimal(14,3) NOT NULL DEFAULT '0.000',
  `expiryDate` date DEFAULT NULL,
  `manufacturingDate` date DEFAULT NULL,
  `costPrice` decimal(14,4) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sb_tenant` (`tenantId`,`productId`),
  KEY `idx_sb_expiry` (`expiryDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `stock_batches` WRITE;
/*!40000 ALTER TABLE `stock_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_batches` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_movements` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warehouseId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `variantId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `movementType` enum('OPENING','PURCHASE_IN','SALE_OUT','SALE_RETURN_IN','ADJUSTMENT_IN','ADJUSTMENT_OUT','TRANSFER_OUT','TRANSFER_IN','WRITE_OFF','PRODUCTION_IN','PRODUCTION_OUT','RECIPE_CONSUMPTION','SYNC_ADJUSTMENT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `qty` decimal(14,3) NOT NULL,
  `qtyBefore` decimal(14,3) NOT NULL,
  `qtyAfter` decimal(14,3) NOT NULL,
  `refType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_movements_tenantId_idx` (`tenantId`),
  KEY `stock_movements_productId_idx` (`productId`),
  KEY `stock_movements_warehouseId_idx` (`warehouseId`),
  KEY `stock_movements_refType_refId_idx` (`refType`,`refId`),
  KEY `stock_movements_variantId_fkey` (`variantId`),
  KEY `stock_movements_branchId_fkey` (`branchId`),
  CONSTRAINT `stock_movements_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `stock_movements_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `stock_movements_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `stock_movements_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `stock_transfer_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_transfer_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transferId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `variantId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qty` decimal(14,3) NOT NULL,
  `receivedQty` decimal(14,3) NOT NULL DEFAULT '0.000',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `toWarehouseId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_transfer_items_tenantId_idx` (`tenantId`),
  KEY `stock_transfer_items_transferId_idx` (`transferId`),
  KEY `stock_transfer_items_productId_fkey` (`productId`),
  KEY `stock_transfer_items_toWarehouseId_fkey` (`toWarehouseId`),
  CONSTRAINT `stock_transfer_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `stock_transfer_items_toWarehouseId_fkey` FOREIGN KEY (`toWarehouseId`) REFERENCES `warehouses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `stock_transfer_items_transferId_fkey` FOREIGN KEY (`transferId`) REFERENCES `stock_transfers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `stock_transfer_items` WRITE;
/*!40000 ALTER TABLE `stock_transfer_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_transfer_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `stock_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_transfers` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transferNo` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fromWarehouseId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `toWarehouseId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transferDate` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `status` enum('DRAFT','REQUESTED','APPROVED','IN_TRANSIT','RECEIVED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stock_transfers_tenantId_transferNo_key` (`tenantId`,`transferNo`),
  KEY `stock_transfers_tenantId_idx` (`tenantId`),
  KEY `stock_transfers_fromWarehouseId_fkey` (`fromWarehouseId`),
  KEY `stock_transfers_toWarehouseId_fkey` (`toWarehouseId`),
  CONSTRAINT `stock_transfers_fromWarehouseId_fkey` FOREIGN KEY (`fromWarehouseId`) REFERENCES `warehouses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `stock_transfers_toWarehouseId_fkey` FOREIGN KEY (`toWarehouseId`) REFERENCES `warehouses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `stock_transfers` WRITE;
/*!40000 ALTER TABLE `stock_transfers` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_transfers` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vatRegNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paymentTermsDays` int DEFAULT NULL,
  `creditLimit` decimal(14,2) NOT NULL DEFAULT '0.00',
  `openingDue` decimal(14,2) NOT NULL DEFAULT '0.00',
  `currentDue` decimal(14,2) NOT NULL DEFAULT '0.00',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contactPerson` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rebatePercent` decimal(6,2) NOT NULL DEFAULT '0.00',
  `deliveryPerformanceScore` decimal(5,2) DEFAULT NULL,
  `qualityScore` decimal(5,2) DEFAULT NULL,
  `defectRate` decimal(5,2) DEFAULT NULL,
  `returnRate` decimal(5,2) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `suppliers_tenantId_idx` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES ('50e1fb5a-a5dd-4a40-9ada-9bf4bd5e6b6e','1798fdaa-84d9-4bd4-903d-02784a398676','Default Supplier','Default Supplier','01800000000',NULL,NULL,NULL,NULL,0.00,0.00,0.00,'ACTIVE','2026-09-04 17:25:43.399','2026-09-04 17:25:43.399',NULL,NULL,NULL,NULL,0.00,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `support_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `support_tickets` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT 'GENERAL',
  `priority` enum('LOW','MEDIUM','HIGH','URGENT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEDIUM',
  `status` enum('OPEN','IN_PROGRESS','RESOLVED','CLOSED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN',
  `assignedTo` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_st_tenant` (`tenantId`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `support_tickets` WRITE;
/*!40000 ALTER TABLE `support_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `support_tickets` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `sync_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sync_transactions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deviceId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entityType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `localSequence` int NOT NULL DEFAULT '0',
  `idempotencyKey` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `syncStatus` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `payload` mediumtext COLLATE utf8mb4_unicode_ci,
  `conflictData` mediumtext COLLATE utf8mb4_unicode_ci,
  `syncAttempts` int NOT NULL DEFAULT '0',
  `lastSyncAttempt` datetime DEFAULT NULL,
  `syncedAt` datetime DEFAULT NULL,
  `errorMessage` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sync_idempotency` (`tenantId`,`idempotencyKey`),
  KEY `idx_sync_tenant` (`tenantId`),
  KEY `idx_sync_device` (`deviceId`),
  KEY `idx_sync_status` (`syncStatus`),
  KEY `idx_sync_entity` (`entityType`,`entityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `sync_transactions` WRITE;
/*!40000 ALTER TABLE `sync_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sync_transactions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `system_backups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_backups` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FULL' COMMENT 'FULL / POINT_IN_TIME',
  `fileName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filePath` varchar(600) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dbName` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sizeBytes` bigint NOT NULL DEFAULT '0',
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tableCount` int NOT NULL DEFAULT '0',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RUNNING' COMMENT 'RUNNING/COMPLETED/FAILED/VERIFIED/RESTORED',
  `triggeredBy` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SCHEDULE' COMMENT 'SCHEDULE/MANUAL',
  `result` json DEFAULT NULL COMMENT 'verify/restore reports',
  `errorMsg` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `startedAt` datetime DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sb_status` (`status`,`createdAt`),
  KEY `idx_sb_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `system_backups` WRITE;
/*!40000 ALTER TABLE `system_backups` DISABLE KEYS */;
INSERT INTO `system_backups` VALUES ('0d61bf67-9062-4fc3-a0fc-625b430bfd8d','FULL','blue_ocean_pos_full_20260904_180809_10bbfc.sql','/home/wadi/Project/NextJs/modernpos/backend/backups/blue_ocean_pos_full_20260904_180809_10bbfc.sql','blue_ocean_pos',0,NULL,0,'RUNNING','MANUAL',NULL,NULL,'2026-09-04 18:08:09',NULL,'2026-09-04 18:08:09'),('97a0ed35-3609-4e0d-8a88-8464e13cb6fc','FULL','blue_ocean_pos_full_20260904_180809_860226.sql','/home/wadi/Project/NextJs/modernpos/backend/backups/blue_ocean_pos_full_20260904_180809_860226.sql','blue_ocean_pos',0,NULL,0,'RUNNING','MANUAL',NULL,NULL,'2026-09-04 18:08:09',NULL,'2026-09-04 18:08:09');
/*!40000 ALTER TABLE `system_backups` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `task_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_attachments` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `taskId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileUrl` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fileType` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sizeBytes` int DEFAULT NULL,
  `uploadedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ta_tenant` (`tenantId`),
  KEY `idx_ta_task` (`taskId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `task_attachments` WRITE;
/*!40000 ALTER TABLE `task_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_attachments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `task_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_comments` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `taskId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `authorId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `authorName` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tc_tenant` (`tenantId`),
  KEY `idx_tc_task` (`taskId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `task_comments` WRITE;
/*!40000 ALTER TABLE `task_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_comments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `taskNo` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `entityType` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entityId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entityLabel` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigneeType` enum('EMPLOYEE','USER','ROLE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EMPLOYEE',
  `assigneeId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigneeRole` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creatorId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priority` enum('LOW','NORMAL','HIGH','URGENT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NORMAL',
  `status` enum('PENDING','IN_PROGRESS','BLOCKED','COMPLETED','APPROVED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `dueAt` datetime DEFAULT NULL,
  `completedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  `approvedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedAt` datetime DEFAULT NULL,
  `cancelReason` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tasks_tenant_no` (`tenantId`,`taskNo`),
  KEY `idx_tasks_tenant` (`tenantId`),
  KEY `idx_tasks_status` (`status`),
  KEY `idx_tasks_assignee` (`assigneeType`,`assigneeId`),
  KEY `idx_tasks_entity` (`entityType`,`entityId`),
  KEY `idx_tasks_due` (`dueAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `tenant_locales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_locales` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  `baseCurrency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BDT',
  `dateFormat` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'YYYY-MM-DD',
  `timeFormat` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '24h',
  `numberFormat` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1,234.56',
  `timezone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Asia/Dhaka',
  `fiscalYearStartMonth` int NOT NULL DEFAULT '1' COMMENT '1=January, 7=July',
  `rtl` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Right-to-left for Arabic/Hebrew',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tl_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `tenant_locales` WRITE;
/*!40000 ALTER TABLE `tenant_locales` DISABLE KEYS */;
/*!40000 ALTER TABLE `tenant_locales` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `tenant_modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_modules` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `moduleId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isEnabled` tinyint(1) NOT NULL DEFAULT '1',
  `config` json DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenant_modules_tenantId_moduleId_key` (`tenantId`,`moduleId`),
  KEY `tenant_modules_tenantId_idx` (`tenantId`),
  KEY `tenant_modules_moduleId_idx` (`moduleId`),
  CONSTRAINT `tenant_modules_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `modules` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `tenant_modules` WRITE;
/*!40000 ALTER TABLE `tenant_modules` DISABLE KEYS */;
INSERT INTO `tenant_modules` VALUES ('0181b958-b785-4b2c-8a5d-f27531c17924','1798fdaa-84d9-4bd4-903d-02784a398676','bd21d479-5971-497c-b020-825b186fb7d7',1,NULL,'2026-09-04 17:25:43.428','2026-09-04 17:25:43.428',NULL,NULL),('03f83478-1bc7-49bf-a024-0a0f969b3173','1798fdaa-84d9-4bd4-903d-02784a398676','334376d1-f092-43ce-88ac-de9c9aacf2c2',1,NULL,'2026-09-04 17:25:43.412','2026-09-04 17:25:43.412',NULL,NULL),('15d79d2e-a272-4b9e-85cb-e070d7d6c4c6','1798fdaa-84d9-4bd4-903d-02784a398676','5c869347-0340-4d5d-8d2b-0a21ba13980a',1,NULL,'2026-09-04 17:25:43.430','2026-09-04 17:25:43.430',NULL,NULL),('17603b7f-b707-4ac2-879f-71c63c7997d1','1798fdaa-84d9-4bd4-903d-02784a398676','e44f288f-a337-4e2d-8631-a5972b638812',1,NULL,'2026-09-04 17:25:43.405','2026-09-04 17:25:43.405',NULL,NULL),('17ea3b3b-4a86-4c35-90e5-e909c42e817d','1798fdaa-84d9-4bd4-903d-02784a398676','35e93a66-abfe-4639-932d-601568f4e3eb',1,NULL,'2026-09-04 17:25:43.436','2026-09-04 17:25:43.436',NULL,NULL),('1ec74ce9-38bb-4d1b-987f-31b9aa606f85','1798fdaa-84d9-4bd4-903d-02784a398676','dea70d60-6748-4a7e-b39e-8c6d9ad9cb66',1,NULL,'2026-09-04 17:25:43.410','2026-09-04 17:25:43.410',NULL,NULL),('2aec0505-29b3-474a-8940-d0a8ca2855ce','1798fdaa-84d9-4bd4-903d-02784a398676','5cd03fdd-ec7b-47bb-9c47-7958fba0e37a',1,NULL,'2026-09-04 17:25:43.413','2026-09-04 17:25:43.413',NULL,NULL),('3281a773-3294-4d83-a418-df4294d55257','1798fdaa-84d9-4bd4-903d-02784a398676','4200414b-259b-433e-a8a6-f4f2ddbf53a5',1,NULL,'2026-09-04 17:25:43.416','2026-09-04 17:25:43.416',NULL,NULL),('3801ae78-745c-4e86-9fc4-ee550df815f9','1798fdaa-84d9-4bd4-903d-02784a398676','83215ae5-7170-4663-b6c2-2825ee877374',1,NULL,'2026-09-04 17:25:43.426','2026-09-04 17:25:43.426',NULL,NULL),('3e41c4b8-e57f-43d6-bca2-80a6afc50ad5','1798fdaa-84d9-4bd4-903d-02784a398676','43bea1eb-3117-4233-9af9-706d93b32df6',1,NULL,'2026-09-04 17:25:43.422','2026-09-04 17:25:43.422',NULL,NULL),('410b0503-842d-4603-ae4d-6c9fe7f3ab82','1798fdaa-84d9-4bd4-903d-02784a398676','c409417d-ccfc-435c-95de-cb143d9b1b24',1,NULL,'2026-09-04 17:25:43.435','2026-09-04 17:25:43.435',NULL,NULL),('4a3998c1-6736-4b14-9ee1-bb4aac0fded8','1798fdaa-84d9-4bd4-903d-02784a398676','f911234c-b21d-4228-9da1-0364820aac3d',1,NULL,'2026-09-04 17:25:43.417','2026-09-04 17:25:43.417',NULL,NULL),('4eaa50c9-6182-42ae-a6c0-fd01230de244','1798fdaa-84d9-4bd4-903d-02784a398676','ad4dd585-e733-4aef-8026-041fb874608f',1,NULL,'2026-09-04 17:25:43.440','2026-09-04 17:25:43.440',NULL,NULL),('59e9e0f6-ac95-4144-82e4-19bf898500f6','1798fdaa-84d9-4bd4-903d-02784a398676','da847d23-40ad-40fa-ac24-3a1bbb0d10dc',1,NULL,'2026-09-04 17:25:43.414','2026-09-04 17:25:43.414',NULL,NULL),('5a842d43-da95-43b3-bbb6-85dbb9e5774f','1798fdaa-84d9-4bd4-903d-02784a398676','0173aa11-d03e-4cd8-9094-4fe2c1432ae1',1,NULL,'2026-09-04 17:45:52.962','2026-09-04 17:45:52.962',NULL,NULL),('5b01172f-81b7-460f-9022-331d03f41645','1798fdaa-84d9-4bd4-903d-02784a398676','61df646e-77ad-40ce-883d-f3abeadc5e9c',1,NULL,'2026-09-04 17:25:43.410','2026-09-04 17:25:43.410',NULL,NULL),('5da64864-4e86-4b73-a609-54956f864d3a','1798fdaa-84d9-4bd4-903d-02784a398676','378d8796-e2c3-4dcd-9102-f0d653cba5ea',1,NULL,'2026-09-04 17:25:43.401','2026-09-04 17:25:43.401',NULL,NULL),('5e4fd0e9-5e24-4b40-8ac0-d14375bc2ddd','1798fdaa-84d9-4bd4-903d-02784a398676','65639a4c-7dce-4916-9e1c-e8ccd1a6dd0f',1,NULL,'2026-09-04 17:25:43.418','2026-09-04 17:25:43.418',NULL,NULL),('66ead6b8-9a46-41db-a0f2-b8ebe333fb30','1798fdaa-84d9-4bd4-903d-02784a398676','39b48ae6-3aa6-4fb9-8802-3c409cc1fc99',1,NULL,'2026-09-04 17:25:43.444','2026-09-04 17:25:43.444',NULL,NULL),('6be2505d-08c3-4300-9b3f-1c8d440e24b0','1798fdaa-84d9-4bd4-903d-02784a398676','cfff1ece-d026-40d1-8dbb-0d0876978f63',1,NULL,'2026-09-04 17:25:43.407','2026-09-04 17:25:43.407',NULL,NULL),('758e2ecb-00f2-4edc-99b3-9977c9be97e1','1798fdaa-84d9-4bd4-903d-02784a398676','a55138e8-b270-4a0c-95b5-d37cf23cd0d7',1,NULL,'2026-09-04 17:25:43.423','2026-09-04 17:25:43.423',NULL,NULL),('7b2db17a-eecf-41e3-92c1-40ccdaa6efb5','1798fdaa-84d9-4bd4-903d-02784a398676','985040cc-de3e-4e18-833f-ef8df2ac5c5a',1,NULL,'2026-09-04 17:25:43.429','2026-09-04 17:25:43.429',NULL,NULL),('7e776bd5-9ac1-4cc3-85ca-0aee39613519','1798fdaa-84d9-4bd4-903d-02784a398676','0155f68b-1d8e-43d9-b178-b9d8a00743e6',1,NULL,'2026-09-04 17:25:43.406','2026-09-04 17:25:43.406',NULL,NULL),('84d2d95a-d47f-4c39-a813-9fa37d6d2b44','1798fdaa-84d9-4bd4-903d-02784a398676','85e8ba50-e527-4d41-95dc-534006a8917c',1,NULL,'2026-09-04 17:25:43.411','2026-09-04 17:25:43.411',NULL,NULL),('924dfb50-1116-4f5b-b5b3-8ad0e4039a69','1798fdaa-84d9-4bd4-903d-02784a398676','b699e6f5-6f26-4be4-abc2-bf5ac292456b',1,NULL,'2026-09-04 17:25:43.433','2026-09-04 17:25:43.433',NULL,NULL),('96ddd5f4-6655-4bb9-aadf-8e7b126464ca','1798fdaa-84d9-4bd4-903d-02784a398676','ca2c0a4c-4894-4688-b588-884df7ab2aff',1,NULL,'2026-09-04 17:25:43.427','2026-09-04 17:25:43.427',NULL,NULL),('9715a44d-d5aa-4f5c-855a-2147bd78afae','1798fdaa-84d9-4bd4-903d-02784a398676','6820ee6d-d7c1-484b-9b14-6ed93da5c643',1,NULL,'2026-09-04 17:25:43.432','2026-09-04 17:25:43.432',NULL,NULL),('9793188f-6645-4fce-9624-0bed4b0003a4','1798fdaa-84d9-4bd4-903d-02784a398676','513b34c9-152a-4fba-a52d-34263764f2f7',1,NULL,'2026-09-04 17:25:43.425','2026-09-04 17:25:43.425',NULL,NULL),('9cea45cd-3e70-452b-a554-bebe347c412e','1798fdaa-84d9-4bd4-903d-02784a398676','043f2326-4221-4ec1-a8c7-b29055700cc8',1,NULL,'2026-09-04 17:25:43.431','2026-09-04 17:25:43.431',NULL,NULL),('9fc8b016-5b0e-41c0-b4d3-87adc5ff352e','1798fdaa-84d9-4bd4-903d-02784a398676','843ff6cf-6ea4-4c3f-9237-ad3de04e1a5c',1,NULL,'2026-09-04 17:25:43.403','2026-09-04 17:25:43.403',NULL,NULL),('a58c4d4b-1784-4cc2-b757-87580757cde6','1798fdaa-84d9-4bd4-903d-02784a398676','bb7d83eb-6a29-48d9-b730-425f75c871d5',1,NULL,'2026-09-04 17:25:43.431','2026-09-04 17:25:43.431',NULL,NULL),('a6ec3a39-6450-47de-b664-c665a05e229b','1798fdaa-84d9-4bd4-903d-02784a398676','057877ec-c214-43b8-bbdf-f7cd35c04703',1,NULL,'2026-09-04 17:25:43.424','2026-09-04 17:25:43.424',NULL,NULL),('a6f3b6db-806b-4a72-9d24-81436e974a7a','1798fdaa-84d9-4bd4-903d-02784a398676','ff2e7a51-4fc1-4eb1-ab59-e8b072906b03',1,NULL,'2026-09-04 17:25:43.421','2026-09-04 17:25:43.421',NULL,NULL),('b35d4025-4143-4072-8187-5bedd381e449','1798fdaa-84d9-4bd4-903d-02784a398676','8c8f9e4c-9e9c-4668-8df1-b73b8937cfab',1,NULL,'2026-09-04 17:25:43.438','2026-09-04 17:25:43.438',NULL,NULL),('b65ba8d2-99fc-442e-a1cf-a5adca7b4ba0','1798fdaa-84d9-4bd4-903d-02784a398676','df689785-d65e-4644-8097-f3e52e9b9f33',1,NULL,'2026-09-04 17:25:43.402','2026-09-04 17:25:43.402',NULL,NULL),('cd25c560-9c43-499c-88fb-1b95c5060842','1798fdaa-84d9-4bd4-903d-02784a398676','ac5d2aab-3bcb-4f18-9938-d12936e32746',1,NULL,'2026-09-04 17:25:43.434','2026-09-04 17:25:43.434',NULL,NULL),('cf76e0e4-2abf-498a-a945-2ce3b4e74c14','1798fdaa-84d9-4bd4-903d-02784a398676','aba407fb-e21d-4569-b96a-1dc66cd79c90',1,NULL,'2026-09-04 17:25:43.443','2026-09-04 17:25:43.443',NULL,NULL),('d0224bf1-1732-4b4a-9faa-0f55ed00fa40','1798fdaa-84d9-4bd4-903d-02784a398676','d886cfa3-59b3-4c5a-a09a-2a4ee64e1d37',1,NULL,'2026-09-04 17:25:43.443','2026-09-04 17:25:43.443',NULL,NULL),('d07697b8-cb70-4814-9353-b54e4092e8b7','1798fdaa-84d9-4bd4-903d-02784a398676','7982d3c9-9e3d-4161-8d40-8412d75cf1cb',1,NULL,'2026-09-04 17:25:43.406','2026-09-04 17:25:43.406',NULL,NULL),('d167a008-a1a4-4530-846a-12693f08a122','1798fdaa-84d9-4bd4-903d-02784a398676','92d2cae5-2602-404a-b841-f44c916da6b1',1,NULL,'2026-09-04 17:25:43.441','2026-09-04 17:25:43.441',NULL,NULL),('d4bcd7d7-b7bb-4142-94ef-d90c2e2b8dd0','1798fdaa-84d9-4bd4-903d-02784a398676','ed8267df-0823-4f5c-b1b9-559df80057de',1,NULL,'2026-09-04 17:25:43.439','2026-09-04 17:25:43.439',NULL,NULL),('d7992e6d-b3f3-4c21-a504-5173a277606d','1798fdaa-84d9-4bd4-903d-02784a398676','b62ff425-2cf6-49b8-88c2-1a9f1e68c459',1,NULL,'2026-09-04 17:25:43.442','2026-09-04 17:25:43.442',NULL,NULL),('d808ed65-619e-4748-9b96-0be7f1c0fbb0','1798fdaa-84d9-4bd4-903d-02784a398676','4435aa17-3bed-48e1-a490-103d0e5eb53e',1,NULL,'2026-09-04 17:25:43.437','2026-09-04 17:25:43.437',NULL,NULL),('de3840f2-ddae-4a3a-8f88-7e4a668da806','1798fdaa-84d9-4bd4-903d-02784a398676','93eb13f8-e73d-471b-a2f0-bb1bc03f8809',1,NULL,'2026-09-04 17:25:43.408','2026-09-04 17:25:43.408',NULL,NULL),('de7687eb-e645-4d36-bf5d-190e48dedd2d','1798fdaa-84d9-4bd4-903d-02784a398676','c66058ce-f499-48a0-96f5-9119a3448c02',1,NULL,'2026-09-04 17:25:43.414','2026-09-04 17:25:43.414',NULL,NULL),('e24a7b7e-c43d-4f9a-8568-cf39beab6136','1798fdaa-84d9-4bd4-903d-02784a398676','53322ae1-e3fc-4bfb-bae0-b38f3bcdfc16',1,NULL,'2026-09-04 17:25:43.426','2026-09-04 17:25:43.426',NULL,NULL),('e2e6841b-25c1-473a-9821-dfdf2524500d','1798fdaa-84d9-4bd4-903d-02784a398676','822f942b-0b7d-4f2b-9781-e69540b69d15',1,NULL,'2026-09-04 17:25:43.419','2026-09-04 17:25:43.419',NULL,NULL),('e4e59866-0658-45c9-83ef-34d58dcb2e4d','1798fdaa-84d9-4bd4-903d-02784a398676','3e5849c2-4ee3-4f7d-a9c0-6ce25a959b95',1,NULL,'2026-09-04 17:25:43.415','2026-09-04 17:25:43.415',NULL,NULL),('ebcde6ce-83f8-4f3e-9143-c7306041be21','1798fdaa-84d9-4bd4-903d-02784a398676','04e1dfca-16b0-4e9c-9928-c763eb29b93f',1,NULL,'2026-09-04 17:25:43.420','2026-09-04 17:25:43.420',NULL,NULL),('f6c2e81d-8a2c-4f96-a533-abb16a9f0698','1798fdaa-84d9-4bd4-903d-02784a398676','dbcc40dc-2f8f-418b-ae41-bf257259da18',1,NULL,'2026-09-04 17:25:43.404','2026-09-04 17:25:43.404',NULL,NULL);
/*!40000 ALTER TABLE `tenant_modules` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `businessType` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RETAIL',
  `status` enum('TRIAL','ACTIVE','PAST_DUE','GRACE','SUSPENDED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TRIAL',
  `currency` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BDT',
  `timezone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Asia/Dhaka',
  `contactPhone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contactEmail` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenants_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES ('1798fdaa-84d9-4bd4-903d-02784a398676','Demo Restaurant','demo-shop','RESTAURANT','ACTIVE','BDT','Asia/Dhaka',NULL,NULL,'2026-09-04 17:25:43.304','2026-09-04 17:25:43.304',NULL,NULL);
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `terminals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `terminals` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouseId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `terminals_tenantId_code_key` (`tenantId`,`code`),
  KEY `terminals_tenantId_idx` (`tenantId`),
  KEY `terminals_branchId_idx` (`branchId`),
  KEY `terminals_warehouseId_fkey` (`warehouseId`),
  CONSTRAINT `terminals_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `terminals_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `terminals` WRITE;
/*!40000 ALTER TABLE `terminals` DISABLE KEYS */;
/*!40000 ALTER TABLE `terminals` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `units` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `baseUnitId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conversionFactor` decimal(14,6) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `units_tenantId_code_key` (`tenantId`,`code`),
  KEY `units_tenantId_idx` (`tenantId`),
  KEY `units_baseUnitId_fkey` (`baseUnitId`),
  CONSTRAINT `units_baseUnitId_fkey` FOREIGN KEY (`baseUnitId`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
INSERT INTO `units` VALUES ('8beee368-eb8a-4326-89c4-f5db53849de1','1798fdaa-84d9-4bd4-903d-02784a398676','Piece','pcs',NULL,NULL,'ACTIVE','2026-09-04 17:25:43.395','2026-09-04 17:25:43.395',NULL,NULL);
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employeeCode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `passwordHash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `roleId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','DISABLED','LOCKED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `lastLoginAt` datetime(3) DEFAULT NULL,
  `mustChangePassword` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_tenantId_email_key` (`tenantId`,`email`),
  KEY `users_tenantId_idx` (`tenantId`),
  KEY `users_roleId_idx` (`roleId`),
  KEY `users_branchId_idx` (`branchId`),
  CONSTRAINT `users_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('538dd563-88aa-4c96-8213-f1ebc6664a49','1798fdaa-84d9-4bd4-903d-02784a398676','ed473c6b-0351-4864-a23b-68125a1dcdc5',NULL,'Tenant Admin','admin@blueoceanspos.com',NULL,'$2b$10$mB066KechdhVpvp/a0MqbOaJM32T2HQ1xtGcNbnYUHJ9Xan1wKFG2','07289554-800f-477d-a351-d93c6d66f35a','ACTIVE',NULL,0,'2026-09-04 17:25:43.394','2026-09-04 17:25:43.394',NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `wallet_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallet_accounts` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `balance` decimal(14,2) NOT NULL DEFAULT '0.00',
  `lifetimeCredited` decimal(14,2) NOT NULL DEFAULT '0.00',
  `lifetimeDebited` decimal(14,2) NOT NULL DEFAULT '0.00',
  `status` enum('ACTIVE','FROZEN','CLOSED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wa_tenant_cust` (`tenantId`,`customerId`),
  KEY `idx_wa_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `wallet_accounts` WRITE;
/*!40000 ALTER TABLE `wallet_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `wallet_accounts` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `wallet_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallet_transactions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `walletId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('ADD','DEDUCT','CASHBACK','REFUND','STORE_CREDIT','PROMOTIONAL','ADJUSTMENT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(14,2) NOT NULL COMMENT 'positive amount; direction from type',
  `balanceBefore` decimal(14,2) NOT NULL DEFAULT '0.00',
  `balanceAfter` decimal(14,2) NOT NULL DEFAULT '0.00',
  `refType` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wt_tenant` (`tenantId`),
  KEY `idx_wt_wallet` (`walletId`),
  KEY `idx_wt_customer` (`customerId`),
  KEY `idx_wt_ref` (`refType`,`refId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `wallet_transactions` WRITE;
/*!40000 ALTER TABLE `wallet_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `wallet_transactions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `warehouses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouses` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branchId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `warehouses_tenantId_code_key` (`tenantId`,`code`),
  KEY `warehouses_tenantId_idx` (`tenantId`),
  KEY `warehouses_branchId_idx` (`branchId`),
  CONSTRAINT `warehouses_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `warehouses` WRITE;
/*!40000 ALTER TABLE `warehouses` DISABLE KEYS */;
INSERT INTO `warehouses` VALUES ('3b04fac4-088e-44c1-8fb0-edd9551b85c7','1798fdaa-84d9-4bd4-903d-02784a398676','ed473c6b-0351-4864-a23b-68125a1dcdc5','WH-DHK-01','Dhanmondi Warehouse',NULL,'ACTIVE','2026-09-04 17:25:43.332','2026-09-04 17:25:43.332',NULL,NULL);
/*!40000 ALTER TABLE `warehouses` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `webhook_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `webhook_events` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subscriptionId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `eventType` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'invoice.created, order.created, etc.',
  `payload` json NOT NULL,
  `status` enum('PENDING','SENDING','SUCCESS','FAILED','RETRYING') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `attemptCount` int NOT NULL DEFAULT '0',
  `maxAttempts` int NOT NULL DEFAULT '3',
  `lastAttemptAt` datetime DEFAULT NULL,
  `lastError` text COLLATE utf8mb4_unicode_ci,
  `idempotencyKey` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Prevent duplicate processing',
  `nextRetryAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_we_idempotent` (`tenantId`,`idempotencyKey`),
  KEY `idx_we_tenant` (`tenantId`,`status`),
  KEY `idx_we_sub` (`subscriptionId`,`status`),
  KEY `idx_we_retry` (`status`,`nextRetryAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `webhook_events` WRITE;
/*!40000 ALTER TABLE `webhook_events` DISABLE KEYS */;
INSERT INTO `webhook_events` VALUES ('0231dc5d-1846-4925-8f3e-e8649fcfa38d','1798fdaa-84d9-4bd4-903d-02784a398676','64b61e47-1753-4b9d-b6fc-bd24667ce549','invoice.created','{\"total\": 100, \"invoiceNo\": \"INV-P3922385\"}','PENDING',0,3,NULL,NULL,'P3922385-ok','2026-09-04 17:47:21','2026-09-04 17:47:21','2026-09-04 17:47:21'),('4331f234-93a6-486e-a167-243fa001e290','1798fdaa-84d9-4bd4-903d-02784a398676','db698e41-825b-48a1-ad22-31e115de20ca','invoice.created','{\"total\": 100, \"invoiceNo\": \"INV-P3922768\"}','SUCCESS',1,3,'2026-09-04 17:52:48',NULL,'P3922768-ok','2026-09-04 17:52:48','2026-09-04 17:52:48','2026-09-04 17:52:48'),('6f0c0908-42ef-4ff2-ae4e-55a65e259d52','1798fdaa-84d9-4bd4-903d-02784a398676','cf4b1ae7-0456-4cec-8bcd-952ce7984cf6','invoice.created','{\"total\": 1, \"invoiceNo\": \"INV-P3922385-F\"}','PENDING',0,3,NULL,NULL,'P3922385-fail','2026-09-04 17:47:41','2026-09-04 17:47:41','2026-09-04 17:47:41'),('b0f15973-fffb-467f-9115-5fe00571704d','1798fdaa-84d9-4bd4-903d-02784a398676','c2c7042b-de2e-4c11-9a94-65dd3b4eb06a','invoice.created','{\"total\": 1, \"invoiceNo\": \"INV-P3922768-F\"}','FAILED',2,3,'2026-09-04 17:53:10','subscription deleted','P3922768-fail','2026-09-04 17:53:50','2026-09-04 17:52:49','2026-09-04 17:53:55');
/*!40000 ALTER TABLE `webhook_events` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `webhook_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `webhook_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `eventId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subscriptionId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempt` int NOT NULL DEFAULT '1',
  `requestUrl` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requestBody` text COLLATE utf8mb4_unicode_ci,
  `requestHeaders` text COLLATE utf8mb4_unicode_ci,
  `responseStatus` int DEFAULT NULL,
  `responseBody` text COLLATE utf8mb4_unicode_ci,
  `durationMs` int DEFAULT NULL,
  `status` enum('SUCCESS','FAILED','TIMEOUT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `errorMsg` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wl_event` (`eventId`),
  KEY `idx_wl_sub` (`subscriptionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `webhook_logs` WRITE;
/*!40000 ALTER TABLE `webhook_logs` DISABLE KEYS */;
INSERT INTO `webhook_logs` VALUES ('3ef4a9fb-bf28-4a56-8701-88ce663b3c8f','1798fdaa-84d9-4bd4-903d-02784a398676','4331f234-93a6-486e-a167-243fa001e290','db698e41-825b-48a1-ad22-31e115de20ca',1,'http://127.0.0.1:18990/hook','{\"total\": 100, \"invoiceNo\": \"INV-P3922768\"}',NULL,200,NULL,17,'SUCCESS',NULL,'2026-09-04 17:52:48'),('7c2927b6-07f9-41d1-be1f-d990fadb7ff7','1798fdaa-84d9-4bd4-903d-02784a398676','b0f15973-fffb-467f-9115-5fe00571704d','c2c7042b-de2e-4c11-9a94-65dd3b4eb06a',1,'http://127.0.0.1:18991/hook','{\"total\": 1, \"invoiceNo\": \"INV-P3922768-F\"}',NULL,NULL,NULL,0,'FAILED','HTTP Error 500: Internal Server Error','2026-09-04 17:52:49'),('ca3d2863-f8c3-453e-912f-22f46c61430e','1798fdaa-84d9-4bd4-903d-02784a398676','b0f15973-fffb-467f-9115-5fe00571704d','c2c7042b-de2e-4c11-9a94-65dd3b4eb06a',2,'http://127.0.0.1:18991/hook','{\"total\": 1, \"invoiceNo\": \"INV-P3922768-F\"}',NULL,NULL,NULL,0,'FAILED','HTTP Error 500: Internal Server Error','2026-09-04 17:53:10');
/*!40000 ALTER TABLE `webhook_logs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `webhook_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `webhook_subscriptions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Target URL for webhook delivery',
  `events` json NOT NULL COMMENT '["invoice.created","order.created"]',
  `secret` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'HMAC secret for signature verification',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `retryCount` int NOT NULL DEFAULT '3',
  `timeoutMs` int NOT NULL DEFAULT '5000',
  `description` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ws_tenant` (`tenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `webhook_subscriptions` WRITE;
/*!40000 ALTER TABLE `webhook_subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `webhook_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `workflow_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_templates` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenantId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityType` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entityLabel` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conditionField` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'amount',
  `conditionOperator` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '>',
  `conditionValue` decimal(14,2) NOT NULL DEFAULT '0.00',
  `levels` json NOT NULL COMMENT 'approval levels JSON - list of level/role objects',
  `escalateAfterHours` int NOT NULL DEFAULT '24',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdBy` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wt_tenant` (`tenantId`),
  KEY `idx_wt_type` (`entityType`,`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `workflow_templates` WRITE;
/*!40000 ALTER TABLE `workflow_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `workflow_templates` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

