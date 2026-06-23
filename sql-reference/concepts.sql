1. SELECT + WHERE
2. JOIN
3. GROUP BY + HAVING
4. CASE
5. CTE (WITH)
6. Window Functions
7. Índices
8. EXPLAIN ANALYZE
9. JSONB
10. Transacciones


CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(55),
    caption TEXT,
    details TEXT[],

	ADD CONSTRAINT chk_name CHECK (length(name) > 0)
);

-- Índice GIN para búsquedas en el arreglo details
CREATE INDEX idx_products_details_gin
ON products USING GIN (details);

-- Índice GIN para Full Text Search sobre caption
CREATE INDEX idx_products_caption_fts
ON products USING GIN (to_tsvector('english', caption));


DROP TABLE products;


INSERT INTO products 
	(id, name, caption, details)
VALUES
	(
	    1,
	    'iPhone 15',
	    'Apple smartphone',
	    ARRAY['128GB storage', '48MP camera', 'USB-C']
	),
	(
	    2,
	    'Galaxy S25',
	    'Samsung smartphone',
	    ARRAY['256GB storage', '50MP camera', 'Android']
	),
	(
	    3,
	    'MacBook Air M4',
	    'Apple laptop',
	    ARRAY['16GB RAM', '512GB SSD', '13-inch display']
	);

-- borrar algun registro
DELETE FROM products WHERE id = 13;

-- borrar todos los registros
TRUNCATE TABLE products;
-- borrar y restart id incremental
TRUNCATE TABLE products RESTART IDENTITY;

-- TAMAÑO DEL ARREGLO
SELECT
    id,
    name,
    array_length(details, 1) AS num_details
FROM products;

-- BUSCAR DENTRO DEL ARREGLO
SELECT *
FROM products
WHERE 'USB-C' = ANY(details);

-- BUSCAR VARIOS EN ARREGLO
SELECT *
FROM products
WHERE details @> ARRAY['USB-C', '48MP camera'];

-- AGREGAR AL ARREGLO
UPDATE products
SET details = array_append(details, 'Wireless charging')
WHERE id = 1;

-- ELIMINAR DEL ARREGLO
UPDATE products
SET details = array_remove(details, 'USB-C')
WHERE id = 1;


-- CONVERTIR ARREGLO A FILAS
SELECT
    id,
    name,
    unnest(details) AS detail
FROM products;


--TABLA CATEGORIAS
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);


-- CONTRAINT FK
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(55) NOT NULL,
    category_id INTEGER,

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
);



length(text)                              -- Longitud del string
char_length(text)                         -- Longitud en caracteres
octet_length(text)                        -- Longitud en bytes

lower(text)                               -- Convierte a minúsculas
upper(text)                               -- Convierte a mayúsculas
initcap(text)                             -- Primera letra de cada palabra en mayúscula

trim(text)                                -- Elimina espacios al inicio y final
ltrim(text)                               -- Elimina espacios a la izquierda
rtrim(text)                               -- Elimina espacios a la derecha

concat(a, b, c)                           -- Concatena valores
concat_ws('-', a, b, c)                   -- Concatena usando separador
string_agg(col, ',')                      -- Agrupa strings de múltiples filas
col1 || col2                              -- Operador de concatenación

substring(text FROM 1 FOR 5)              -- Extrae una subcadena
left(text, n)                             -- Obtiene los primeros n caracteres
right(text, n)                            -- Obtiene los últimos n caracteres

position('abc' IN text)                   -- Posición de una subcadena
strpos(text, 'abc')                       -- Posición de una subcadena

replace(text, 'old', 'new')               -- Reemplaza texto
translate(text, 'abc', 'xyz')             -- Reemplazo carácter a carácter

split_part(text, ',', 2)                  -- Obtiene una parte de un string dividido
string_to_array(text, ',')                -- Convierte string en array
array_to_string(arr, ',')                 -- Convierte array en string

repeat(text, 3)                           -- Repite el string n veces
reverse(text)                             -- Invierte el string

lpad(text, 10, '0')                       -- Completa a la izquierda
rpad(text, 10, '0')                       -- Completa a la derecha

md5(text)                                 -- Hash MD5
format('Hola %s', nombre)                 -- Formateo estilo printf

ascii(text)                               -- Código ASCII del primer carácter
chr(65)                                   -- Convierte código ASCII a carácter

regexp_replace(text, '[0-9]', '')         -- Reemplazo usando regex
regexp_match(text, '[0-9]+')              -- Primera coincidencia regex
regexp_matches(text, '[0-9]+')            -- Todas las coincidencias regex

regexp_split_to_array(text, ',')          -- Divide usando regex y retorna array
regexp_split_to_table(text, ',')          -- Divide usando regex y retorna filas

to_char(now(), 'YYYY-MM-DD')              -- Convierte fecha/número a texto

LIKE '%abc%'                              -- Búsqueda con comodines
ILIKE '%abc%'                             -- LIKE sin distinguir mayúsculas
SIMILAR TO '(abc|xyz)%'                   -- Patrón tipo regex SQL

text ~ '[0-9]+'                           -- Regex match
text ~* '[0-9]+'                          -- Regex match case-insensitive
text !~ '[0-9]+'                          -- Regex no coincide
text !~* '[0-9]+'                         -- Regex no coincide case-insensitive

unaccent(text)                            -- Elimina acentos (requiere extensión)




now()                                               -- Timestamp actual

current_date                                        -- Fecha actual

current_timestamp                                   -- Timestamp actual (SQL estándar)

created_at::date                                    -- Convertir timestamp a fecha

extract(year FROM fecha)                            -- Obtener año

extract(month FROM fecha)                           -- Obtener mes

extract(day FROM fecha)                             -- Obtener día

date_part('year', fecha)                            -- Obtener año (alternativa a extract)

date_trunc('month', fecha)                          -- Inicio del mes (muy usado para GROUP BY)

date_trunc('day', fecha)                            -- Inicio del día (muy usado para GROUP BY)

date_trunc('week', fecha)                           -- Inicio de la semana

fecha + interval '1 day'                            -- Sumar 1 día

fecha - interval '1 day'                            -- Restar 1 día

now() - interval '30 days'                          -- Últimos 30 días

now() - interval '1 year'                           -- Último año

age(current_date, fecha_nacimiento)                 -- Calcular edad

to_char(fecha, 'YYYY-MM-DD')                        -- Formatear fecha

to_date('2026-06-16', 'YYYY-MM-DD')                 -- Convertir texto a fecha

fecha BETWEEN '2026-01-01' AND '2026-12-31'         -- Filtrar rango de fechas

extract(epoch FROM fecha)                           -- Convertir a Unix timestamp


+                                                   -- Suma

-                                                   -- Resta

*                                                   -- Multiplicación

/                                                   -- División

round()                                             -- Redondeo

floor()                                             -- Redondeo hacia abajo

ceil()                                              -- Redondeo hacia arriba

abs()                                               -- Valor absoluto

greatest()                                          -- Mayor valor

least()                                             -- Menor valor

sum()                                               -- Suma agregada

avg()                                               -- Promedio

count()                                             -- Conteo

min()                                               -- Mínimo

max()                                               -- Máximo

coalesce(valor, 0)                                  -- Reemplazar NULL por 0

nullif(a, b)                                        -- Devuelve NULL si a=b

power()                                             -- Potencias

sqrt()                                              -- Raíz cuadrada

random()                                            -- Aleatorios