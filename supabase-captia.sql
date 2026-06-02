-- ============================================================
-- CAPTIA — Schema de base de datos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Perfil del negocio del usuario
CREATE TABLE IF NOT EXISTS captia_negocios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  sector TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  cliente_ideal TEXT NOT NULL,
  tono TEXT NOT NULL DEFAULT 'cercano', -- cercano | profesional | divertido
  email TEXT NOT NULL,
  telefono TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contactos encontrados automáticamente via Google Maps
CREATE TABLE IF NOT EXISTS captia_contactos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id UUID REFERENCES captia_negocios(id) ON DELETE CASCADE,
  place_id TEXT UNIQUE,
  nombre TEXT NOT NULL,
  direccion TEXT,
  ciudad TEXT,
  telefono TEXT,
  web TEXT,
  email_encontrado TEXT,
  rating NUMERIC(3,1),
  sector TEXT,
  estado TEXT DEFAULT 'nuevo', -- nuevo | email_enviado | seguimiento_1 | seguimiento_2 | respondio | descartado
  ultimo_contacto TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emails enviados a contactos
CREATE TABLE IF NOT EXISTS captia_envios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contacto_id UUID REFERENCES captia_contactos(id) ON DELETE CASCADE,
  negocio_id UUID REFERENCES captia_negocios(id) ON DELETE CASCADE,
  paso INTEGER NOT NULL DEFAULT 1, -- 1=presentacion, 2=seguimiento1, 3=seguimiento2
  asunto TEXT NOT NULL,
  cuerpo TEXT NOT NULL,
  enviado_at TIMESTAMPTZ DEFAULT NOW(),
  respondio BOOLEAN DEFAULT FALSE,
  respondio_at TIMESTAMPTZ
);

-- Posts generados para redes sociales
CREATE TABLE IF NOT EXISTS captia_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id UUID REFERENCES captia_negocios(id) ON DELETE CASCADE,
  red TEXT NOT NULL, -- linkedin | instagram | facebook
  contenido TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente', -- pendiente | aprobado | publicado | descartado
  fecha_generado TIMESTAMPTZ DEFAULT NOW(),
  fecha_publicado TIMESTAMPTZ
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_captia_contactos_negocio ON captia_contactos(negocio_id);
CREATE INDEX IF NOT EXISTS idx_captia_contactos_estado ON captia_contactos(estado);
CREATE INDEX IF NOT EXISTS idx_captia_envios_contacto ON captia_envios(contacto_id);
CREATE INDEX IF NOT EXISTS idx_captia_posts_negocio ON captia_posts(negocio_id);
