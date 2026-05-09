-- MySQL 8+ / MariaDB 10.5+ — datos de la app (reemplazo de PocketBase en hosting compartido).
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS lms_intentos;
DROP TABLE IF EXISTS lms_items;
DROP TABLE IF EXISTS lms_banco_items;
DROP TABLE IF EXISTS lms_actividades;
DROP TABLE IF EXISTS descargas_historial;
DROP TABLE IF EXISTS recursos_etiquetas;
DROP TABLE IF EXISTS recursos;
DROP TABLE IF EXISTS etiquetas;
DROP TABLE IF EXISTS cms_paginas;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE roles (
	id CHAR(15) PRIMARY KEY,
	nombre VARCHAR(64) NOT NULL UNIQUE,
	limite_descargas_diarias INT NOT NULL DEFAULT 10,
	created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
	id CHAR(15) PRIMARY KEY,
	email VARCHAR(255) NOT NULL UNIQUE,
	password_hash VARCHAR(255) NOT NULL,
	nombre VARCHAR(255) NOT NULL DEFAULT '',
	rol VARCHAR(32) NOT NULL DEFAULT 'usuario',
	email_verificado TINYINT(1) NOT NULL DEFAULT 0,
	activo TINYINT(1) NOT NULL DEFAULT 1,
	created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	INDEX idx_users_created (created_at),
	INDEX idx_users_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categorias (
	id CHAR(15) PRIMARY KEY,
	nombre VARCHAR(255) NOT NULL,
	descripcion TEXT,
	icono VARCHAR(64) NOT NULL DEFAULT '',
	created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE recursos (
	id CHAR(15) PRIMARY KEY,
	titulo VARCHAR(500) NOT NULL,
	descripcion TEXT,
	categoria_id CHAR(15) NOT NULL,
	tipo_archivo VARCHAR(16) NOT NULL DEFAULT 'PDF',
	peso_archivo DECIMAL(10,2) NULL,
	activo TINYINT(1) NOT NULL DEFAULT 1,
	ruta_archivo TEXT,
	archivo_url VARCHAR(512) NULL,
	archivo_path VARCHAR(512) NULL,
	referencia_interna TEXT,
	created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	INDEX idx_recursos_cat (categoria_id),
	INDEX idx_recursos_activo (activo),
	INDEX idx_recursos_created (created_at),
	INDEX idx_recursos_updated (updated_at),
	CONSTRAINT fk_recursos_cat FOREIGN KEY (categoria_id) REFERENCES categorias(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE etiquetas (
	id CHAR(15) PRIMARY KEY,
	nombre VARCHAR(255) NOT NULL,
	created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE recursos_etiquetas (
	id CHAR(15) PRIMARY KEY,
	recurso_id CHAR(15) NOT NULL,
	etiqueta_id CHAR(15) NOT NULL,
	UNIQUE KEY uq_recurso_etiqueta (recurso_id, etiqueta_id),
	CONSTRAINT fk_re_et_recurso FOREIGN KEY (recurso_id) REFERENCES recursos(id) ON DELETE CASCADE,
	CONSTRAINT fk_re_et_etiqueta FOREIGN KEY (etiqueta_id) REFERENCES etiquetas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE descargas_historial (
	id CHAR(15) PRIMARY KEY,
	usuario_id CHAR(15) NOT NULL,
	recurso_id CHAR(15) NOT NULL,
	ip_usuario VARCHAR(64) NOT NULL DEFAULT '',
	fecha_descarga DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	INDEX idx_dh_user (usuario_id),
	INDEX idx_dh_recurso (recurso_id),
	INDEX idx_dh_fecha (fecha_descarga),
	CONSTRAINT fk_dh_user FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
	CONSTRAINT fk_dh_recurso FOREIGN KEY (recurso_id) REFERENCES recursos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cms_paginas (
	id CHAR(15) PRIMARY KEY,
	slug VARCHAR(64) NOT NULL UNIQUE,
	meta_title VARCHAR(200) NOT NULL DEFAULT '',
	meta_description VARCHAR(500) NOT NULL DEFAULT '',
	bloques_json LONGTEXT NOT NULL,
	created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lms_actividades (
	id CHAR(15) PRIMARY KEY,
	titulo VARCHAR(500) NOT NULL,
	slug VARCHAR(128) NOT NULL UNIQUE,
	descripcion TEXT,
	orden INT NOT NULL DEFAULT 0,
	activo TINYINT(1) NOT NULL DEFAULT 1,
	categoria_id CHAR(15) NULL,
	created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT fk_lms_act_cat FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lms_items (
	id CHAR(15) PRIMARY KEY,
	actividad_id CHAR(15) NOT NULL,
	enunciado TEXT NOT NULL,
	tipo VARCHAR(32) NOT NULL DEFAULT 'single',
	opciones_json TEXT NOT NULL,
	indice_correcto INT NOT NULL DEFAULT 0,
	explicacion TEXT NOT NULL DEFAULT '',
	orden INT NOT NULL DEFAULT 0,
	created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	INDEX idx_lms_items_act (actividad_id),
	CONSTRAINT fk_lms_items_act FOREIGN KEY (actividad_id) REFERENCES lms_actividades(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lms_banco_items (
	id CHAR(15) PRIMARY KEY,
	enunciado TEXT NOT NULL,
	tipo VARCHAR(32) NOT NULL DEFAULT 'single',
	opciones_json TEXT NOT NULL,
	indice_correcto INT NOT NULL DEFAULT 0,
	explicacion TEXT NOT NULL DEFAULT '',
	orden INT NOT NULL DEFAULT 0,
	created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lms_intentos (
	id CHAR(15) PRIMARY KEY,
	usuario_id CHAR(15) NOT NULL,
	actividad_id CHAR(15) NOT NULL,
	respuestas_json TEXT NOT NULL,
	puntaje INT NOT NULL DEFAULT 0,
	max_puntos INT NOT NULL DEFAULT 0,
	created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	INDEX idx_lms_int_user (usuario_id),
	CONSTRAINT fk_lms_int_user FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
	CONSTRAINT fk_lms_int_act FOREIGN KEY (actividad_id) REFERENCES lms_actividades(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
