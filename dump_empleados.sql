-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 08, 2026 at 09:49 AM
-- Server version: 11.4.12-MariaDB-cll-lve-log
-- PHP Version: 8.4.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `alcaomzc_sigrh`
--

-- --------------------------------------------------------

--
-- Table structure for table `empleados`
--

CREATE TABLE `empleados` (
  `id` int(10) UNSIGNED NOT NULL,
  `cedula` varchar(15) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `sexo` enum('M','F') DEFAULT NULL,
  `fecha_nacimiento` date NOT NULL,
  `fecha_ingreso` date NOT NULL,
  `fecha_egreso` date DEFAULT NULL,
  `cargo_id` int(10) UNSIGNED NOT NULL,
  `departamento_id` int(10) UNSIGNED NOT NULL,
  `ente_id` int(10) UNSIGNED DEFAULT NULL,
  `es_responsable` tinyint(1) DEFAULT 0,
  `foto` varchar(255) DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `correo` varchar(150) DEFAULT NULL,
  `estatus_laboral` enum('ACTIVO','EGRESADO','JUBILADO','SUSPENDIDO','PERMISO','REPOSO') DEFAULT 'ACTIVO',
  `estado` enum('ACTIVO','INACTIVO') DEFAULT 'ACTIVO',
  `observaciones` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `empleados`
--
ALTER TABLE `empleados`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cedula` (`cedula`),
  ADD KEY `fk_emp_cargo` (`cargo_id`),
  ADD KEY `fk_emp_departamento` (`departamento_id`),
  ADD KEY `fk_emp_ente` (`ente_id`),
  ADD KEY `idx_empleados_apellidos` (`apellidos`),
  ADD KEY `idx_empleados_nombres` (`nombres`),
  ADD KEY `idx_empleados_estatus` (`estatus_laboral`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `empleados`
--
ALTER TABLE `empleados`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `empleados`
--
ALTER TABLE `empleados`
  ADD CONSTRAINT `fk_emp_cargo` FOREIGN KEY (`cargo_id`) REFERENCES `cargos` (`id`),
  ADD CONSTRAINT `fk_emp_departamento` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos` (`id`),
  ADD CONSTRAINT `fk_emp_ente` FOREIGN KEY (`ente_id`) REFERENCES `entes` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
