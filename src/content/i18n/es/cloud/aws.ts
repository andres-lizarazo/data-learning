import type { LessonI18n } from "../../overlay";

// Spanish overlay for the "AWS for Data" module (Cloud track). Index-matched; text-only.
export const awsEs: Record<string, LessonI18n> = {
  "aws-mental-model": {
    title: "El Modelo Mental de AWS",
    summary: "Regiones y AZs, responsabilidad compartida, y cómo interactúas con AWS.",
    blocks: [
      {
        markdown: `# Qué es realmente 'la nube'

AWS (Amazon Web Services) te renta computadoras, almacenamiento y servicios gestionados **bajo
demanda, por segundo**. En vez de comprar servidores, aprovisionas lo que necesitas, pagas por lo que
usas, y lo apagas cuando terminas. Para los equipos de datos eso significa: levantar un clúster Spark
de 50 nodos por una hora, luego borrarlo.

# Regiones y Zonas de Disponibilidad

AWS es infraestructura física, organizada geográficamente:

- **Región** — un área geográfica (\`us-east-1\`, \`eu-west-1\`). Eliges una por **latencia** (cerca de
  usuarios/datos), **cumplimiento** (leyes de residencia de datos), y **costo** (los precios varían por
  región). La mayoría de los servicios están acotados por región: un bucket de S3 vive en una región.
- **Zona de Disponibilidad (AZ)** — uno o más data centers aislados dentro de una región
  (\`us-east-1a\`, \`us-east-1b\`). Repartir entre AZs te da **alta disponibilidad**: si un data center
  pierde energía, tu carga sobrevive en otro.

> Regla general: elige una región y **mantén tus datos y cómputo en la misma** — la transferencia de
> datos entre regiones es lenta y cuesta dinero. Un job de Spark en \`us-east-1\` leyendo un bucket de
> S3 en \`eu-west-1\` es una bomba clásica de costo + latencia accidental.

# El modelo de responsabilidad compartida

La seguridad se divide:

- **AWS asegura la nube** — data centers físicos, hardware, el hipervisor, los internos de los
  servicios gestionados. ("Seguridad *de* la nube.")
- **Tú aseguras lo que hay dentro** — tus permisos IAM, qué buckets son públicos, tu cifrado, tus
  datos. ("Seguridad *en* la nube.")

Casi cada brecha de AWS en las noticias es del lado del cliente: un bucket de S3 público, una clave con
demasiados permisos. AWS te dio las cerraduras; dejar la puerta abierta es cosa tuya.

# Cómo interactúas realmente con AWS

- **Consola** — la UI web. Genial para aprender e inspección puntual; terrible para cualquier cosa
  repetible (no versionada, no reproducible).
- **CLI** — \`aws s3 ls s3://my-bucket/\`. Scriptable; las habilidades de shell del track de Linux
  aplican directo.
- **SDK** — librerías como **boto3** de Python (\`import boto3\`) para llamar a AWS desde código — cómo
  tus pipelines hablan con S3, Glue, etc.
- **IaC** (Infraestructura como Código) — Terraform / CloudFormation / CDK describen tu infraestructura
  en archivos versionados. Este es el default profesional: reproducible, revisable en un PR, y
  diffeable — la misma disciplina de Git que acabas de aprender, aplicada a la infraestructura.`,
      },
      {
        question: "Bajo el modelo de responsabilidad compartida de AWS, ¿quién es responsable de asegurar que un bucket de S3 con datos de clientes no sea públicamente legible?",
        options: [
          "Tú (el cliente) — AWS asegura la infraestructura, pero los controles de acceso, políticas de bucket, y cifrado de tus datos son 'seguridad EN la nube', tu responsabilidad",
          "AWS — aseguran todo por defecto",
          "Es automáticamente privado y nunca puede hacerse público",
          "Quien creó el método de pago de la cuenta de AWS",
        ],
        explanation:
          "AWS asegura los data centers y los internos de los servicios ('de la nube'); la configuración — IAM, políticas de bucket, ajustes de acceso público, cifrado — es tuya ('en la nube'). La mayoría de las fugas de S3 de portada son buckets de clientes mal configurados, no fallos de AWS.",
      },
      {
        question: "¿Por qué los equipos con experiencia gestionan la infraestructura de AWS con Terraform/CloudFormation en vez de hacer clic en la Consola?",
        options: [
          "La IaC está versionada, es revisable en un PR, reproducible, y diffeable — hacer clic en la Consola es manual, no versionado, e imposible de reproducir de forma fiable",
          "La Consola solo puede crear un recurso por día",
          "La IaC es gratis mientras la Consola cuesta extra",
          "Terraform corre tus cargas más rápido",
        ],
        explanation:
          "La Infraestructura como Código trae el flujo de Git a la infraestructura: los cambios se revisan, el historial es auditable, y un entorno puede reconstruirse idéntico. Los clics en la Consola no dejan registro y se desvían con el tiempo — bien para aprender, no para producción.",
      },
      {
        title: "Fundamentos de AWS",
        cards: [
          { front: "Región", back: "Un área geográfica (us-east-1). Elegida por latencia, cumplimiento/residencia de datos, y costo. La mayoría de los servicios están acotados por región." },
          { front: "Zona de Disponibilidad (AZ)", back: "Data center(s) aislado(s) dentro de una región. Repartir entre AZs da alta disponibilidad si uno falla." },
          { front: "Mantén datos + cómputo co-ubicados", back: "Misma región (idealmente misma AZ) — la transferencia entre regiones es lenta y facturada. Un bug de costo/latencia accidental común." },
          { front: "Modelo de responsabilidad compartida", back: "AWS asegura DE la nube (hardware, hipervisor, internos de servicios); tú aseguras EN la nube (IAM, acceso, cifrado, tus datos)." },
          { front: "Consola / CLI / SDK / IaC", back: "UI web / línea de comandos scriptable / boto3 y otras librerías / infra versionada (Terraform, CloudFormation, CDK)." },
          { front: "boto3", back: "El SDK de AWS para Python — cómo los pipelines llaman a S3, Glue, etc. desde código." },
        ],
      },
    ],
  },
  "aws-iam": {
    title: "IAM: Identidad y Acceso",
    summary: "Usuarios, roles, políticas, mínimo privilegio — y cómo se evalúa una petición.",
    blocks: [
      {
        markdown: `# IAM controla quién puede hacer qué

**IAM** (Identity and Access Management) es el sistema de permisos frente a *cada* llamada a la API de
AWS. Aciértalo y es invisible; equivócate y o no puedes acceder a tus datos o los has expuesto al mundo.

## Los bloques de construcción

- **User** — una identidad de larga vida para una persona (o app legada), con credenciales.
- **Role** — una identidad que un *servicio o sesión* **asume temporalmente**, obteniendo credenciales
  de corta vida. Este es el patrón preferido: tu job de Lambda/EC2/Glue **asume un rol** en vez de
  llevar una clave estática. Sin secretos de larga vida que filtrar.
- **Policy** — un documento JSON que otorga o niega permisos. Adjuntas políticas a usuarios/roles.
- **Group** — un cubo de usuarios que comparten políticas (el grupo "data-engineers").

## Un documento de política

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::data-lake",
        "arn:aws:s3:::data-lake/raw/*"
      ]
    }
  ]
}
\`\`\`

Cada statement tiene un **Effect** (Allow/Deny), una o más **Action** (las llamadas a la API, como
\`s3:GetObject\`), y los **Resource** a los que aplican (identificados por **ARN** — Amazon Resource
Name).

## Cómo se decide una petición

1. **Deny por defecto** — si nada la permite explícitamente, se niega.
2. Un **Allow explícito** que coincida con la acción + recurso la permite.
3. Un **Deny explícito** siempre gana — anula cualquier Allow.

Así: **niega por defecto, permite lo necesario, y un deny explícito le gana a todo.**

## Mínimo privilegio

Otorga los permisos **mínimos** que un principal necesita — este job lee \`s3://lake/raw/*\`, nada más.
Nunca adjuntes \`AdministratorAccess\` a un pipeline "para que funcione". Cuando una clave se filtra (y
las claves se filtran), el mínimo privilegio es la diferencia entre "leer un prefijo" y "es dueño de
toda la cuenta". Es la versión cloud de \`chmod 600\`: da exactamente el acceso requerido, no más.`,
      },
      { title: "Evalúa una petición IAM (deny-por-defecto, gana-el-deny-explícito)" },
      {
        title: "Implementa la evaluación de políticas IAM",
        prompt: `Escribe \`policy_allows(statements, action, resource)\` implementando la lógica de evaluación central
de AWS. Cada statement es un dict con \`"Effect"\` (\`"Allow"\` o \`"Deny"\`), \`"Action"\` (una lista), y
\`"Resource"\` (una lista). Las cadenas de acción y recurso pueden usar \`*\` como comodín (p. ej.
\`"s3:*"\`, \`"arn:...:lake/raw/*"\`).

Reglas, en orden de prioridad:

1. Si **cualquier statement que coincida** tiene \`Effect == "Deny"\`, el resultado es \`False\` (el deny
   explícito siempre gana).
2. Si no, si **cualquier statement** coincide con \`Effect == "Allow"\`, devuelve \`True\`.
3. Si no, devuelve \`False\` (deny por defecto).

Un statement "coincide" cuando la acción pedida coincide con uno de sus patrones \`Action\` **y** el
recurso pedido coincide con uno de sus patrones \`Resource\` (usa el glob matching con \`*\` — \`fnmatch\`
está disponible).`,
        hints: [
          "Usa `fnmatch.fnmatch` para el comodín tanto de acción como de recurso.",
          "Escanea todos los statements: recolecta si existe algún Deny que coincida y si existe algún Allow que coincida.",
          "Devuelve False si existe un Deny que coincide; si no, devuelve si existe un Allow que coincide.",
        ],
      },
      {
        question: "¿Por qué tener un job de Glue/EC2 que ASUME UN ROL es preferible a darle una clave de acceso de larga vida?",
        options: [
          "Un rol provee credenciales de corta vida, auto-rotadas, sin secreto estático que filtrar o hardcodear; una clave de larga vida es un pasivo permanente si se expone",
          "Los roles son gratis mientras las claves de acceso cuestan dinero",
          "Los roles otorgan AdministratorAccess automáticamente",
          "Las claves de acceso no funcionan con S3",
        ],
        explanation:
          "Los roles emiten credenciales temporales que expiran y rotan automáticamente, así que no hay secreto estático en un archivo de config o env var para ser comiteado o robado. Esto — más el mínimo privilegio — es la columna vertebral de la higiene de seguridad de AWS.",
      },
      {
        title: "Vocabulario de IAM",
        cards: [
          { front: "IAM", back: "Identity and Access Management — el sistema de permisos frente a cada llamada a la API de AWS. Deny por defecto." },
          { front: "User vs Role", back: "User = identidad de larga vida para una persona. Role = identidad que un servicio/sesión ASUME temporalmente para credenciales de corta vida (preferido — sin secreto estático)." },
          { front: "Policy", back: "Un documento JSON de statements (Effect + Action + Resource) que otorga/niega permisos. Adjuntado a users/roles/groups." },
          { front: "ARN", back: "Amazon Resource Name — el id único de un recurso, p. ej. arn:aws:s3:::data-lake/raw/*. Usado en el Resource de una política." },
          { front: "Orden de evaluación", back: "1) deny por defecto; 2) un Allow explícito permite; 3) un Deny explícito siempre gana sobre cualquier Allow." },
          { front: "Mínimo privilegio", back: "Otorga solo las acciones/recursos mínimos que un principal necesita. La versión cloud de chmod 600 — limita el radio de explosión cuando una credencial se filtra." },
        ],
      },
    ],
  },
  "aws-s3-data-lake": {
    title: "S3: el Cimiento del Data Lake",
    summary: "Objetos, claves como prefijos, layout de particiones, clases de almacenamiento.",
    blocks: [
      {
        markdown: `# S3 es donde viven los datos

**S3** (Simple Storage Service) es el object store de AWS y el cimiento de casi cada plataforma de
datos en AWS. Es barato, efectivamente infinito, y durable (11 nueves — 99.999999999%). Tu **data
lake** *es* un bucket de S3.

- **Bucket** — un contenedor con nombre global (\`s3://acme-data-lake\`), que vive en una región.
- **Objeto** — un archivo más metadatos. Los objetos son **inmutables**: reemplazas, no editas.
- **Key (clave)** — el nombre completo del objeto dentro del bucket. *Parece* una ruta, pero S3 es un
  **key–value store plano**: no hay carpetas reales. \`raw/orders/2026/01/x.parquet\` es solo una cadena
  de clave.

# Los prefijos son tus "carpetas" — y potencian el partition pruning

Como las herramientas listan objetos por **prefijo de clave**, los ingenieros codifican estructura en
las claves — especialmente **particionando** por fecha:

\`\`\`
s3://lake/orders/year=2026/month=01/day=05/part-000.parquet
s3://lake/orders/year=2026/month=01/day=06/part-000.parquet
s3://lake/orders/year=2026/month=02/day=01/part-000.parquet
\`\`\`

Una consulta de "febrero 2026" solo necesita listar/leer objetos bajo el prefijo
\`orders/year=2026/month=02/\` — **salta** cada otro archivo sin leerlo. Esto es **partition pruning**, y
en S3 es literalmente un filtro de prefijo. La misma idea de particionado que conociste en el track de
warehouse/lakehouse — aquí es donde vive físicamente. El nombrado \`key=value\` (**particionado estilo
Hive**) es lo que deja a Athena/Spark/Glue inferir particiones automáticamente.

# Clases de almacenamiento: paga por el patrón de acceso

No todos los datos se acceden por igual, así que S3 los escalona por costo:

| Clase | Para | Trade-off |
|---|---|---|
| **S3 Standard** | caliente, leído con frecuencia | almacenamiento más caro, acceso barato |
| **Standard-IA** | acceso infrecuente | almacenamiento más barato, tarifa por recuperación |
| **Glacier / Deep Archive** | archivos, cumplimiento | almacenamiento más barato, recuperación toma minutos–horas |

Las **lifecycle policies** mueven objetos entre niveles automáticamente ("tras 90 días → Standard-IA,
tras 1 año → Glacier"), que es cómo un lake mantiene años de historial asequible. Activa **versioning**
para conservar el historial de objetos (deshacer un overwrite/delete), y **encryption** (normalmente
activo por defecto) para proteger los datos en reposo.`,
      },
      { title: "El partition pruning es un filtro de prefijo" },
      {
        title: "Filtra claves de S3 por partición",
        prompt: `Las claves particionadas estilo Hive se ven como
\`orders/year=2026/month=02/day=05/part-000.parquet\`. Escribe \`select_partitions(keys, filters)\` que
devuelva las claves que coinciden con **todos** los filtros de partición dados.

- \`filters\` es un dict como \`{"year": "2026", "month": "02"}\`.
- Una clave coincide con un filtro \`col=val\` si contiene el segmento \`col=val\` entre barras (es decir,
  aparece \`/year=2026/\`, o la clave empieza con \`year=2026/\`).
- Devuelve las claves que coinciden con **cada** filtro, preservando el orden de entrada.
- Un dict \`filters\` vacío coincide con todas las claves.`,
        hints: [
          'Por cada filtro construye la cadena de segmento exacta `f"{col}={val}"` y requiere que aparezca `/{segment}/`.',
          "Para coincidir también un segmento al inicio de la clave, antepón un '/' a la clave antes de buscar: `('/' + key)`.",
          "Conserva una clave solo si TODOS los filtros coinciden — `all(...)` sobre los ítems del filtro.",
        ],
      },
      {
        question: "S3 se describe como un 'key–value store plano', y aun así todos hablan de carpetas. ¿Qué pasa realmente con `raw/orders/2026/file.parquet`?",
        options: [
          "No hay directorios reales — la cadena entera es la clave del objeto. Las herramientas simulan carpetas agrupando por el prefijo '/', que es exactamente lo que hace funcionar el partition pruning basado en prefijo",
          "S3 crea carpetas anidadas reales en disco como un filesystem normal",
          "Cada barra crea un bucket separado",
          "La ruta se ignora; solo importa el nombre del archivo",
        ],
        explanation:
          "S3 mapea una cadena de clave a un objeto; las barras son solo caracteres. Listar por prefijo da la ilusión de carpetas — y como un layout particionado por fecha pone cada día bajo su propio prefijo, una consulta puede listar solo el prefijo relevante y saltar el resto.",
      },
      {
        question: "Guardas 5 años de logs crudos en S3 pero solo consultas los últimos 30 días. ¿Cómo cortas el costo de almacenamiento sin borrar el historial?",
        options: [
          "Una lifecycle policy que transiciona los objetos viejos a Standard-IA, luego Glacier/Deep Archive — almacenamiento barato de largo plazo, con recuperación más lenta que rara vez necesitas",
          "Guardar todo en S3 Standard; ya es lo más barato",
          "Borrar cualquier cosa de más de 30 días",
          "Mover los datos viejos al disco local de una instancia EC2",
        ],
        explanation:
          "Las reglas de lifecycle escalonan los datos por edad automáticamente: los datos calientes quedan en Standard, el historial frío cae a IA y luego Glacier por una fracción del precio. Conservas el historial completo para cumplimiento/backfills y pagas tarifas de archivo por datos que rara vez tocas.",
      },
    ],
  },
  "aws-compute": {
    title: "Cómputo: EC2, Lambda y Contenedores",
    summary: "Servidores vs serverless vs contenedores — y cuándo usar cada uno para datos.",
    blocks: [
      {
        markdown: `# Tres formas de correr código

## EC2 — servidores virtuales

**EC2** (Elastic Compute Cloud) te renta máquinas virtuales por segundo. Eliges un **tipo de instancia**
(balance CPU/RAM/GPU), y gestionas el SO, parches, y escalado. Máximo control, máxima responsabilidad.
Para datos: servicios de larga vida, una base de datos que auto-gestionas, o los nodos bajo un clúster
Spark/EMR.

- **On-demand** — paga por segundo, sin compromiso. Flexible, lo más caro.
- **Spot** — capacidad sobrante hasta ~90% de descuento, pero AWS puede reclamarla con 2 minutos de
  aviso. Perfecto para **batch tolerante a fallos** (tareas de Spark que se pueden reintentar) — una
  enorme palanca de costo para cargas de datos.
- **Reserved / Savings Plans** — comprométete 1–3 años por un descuento sobre la carga base estable.

## Lambda — funciones serverless

**Lambda** corre una función **ante un evento**, con **cero servidores que gestionar**. Subes código;
AWS lo corre cuando se dispara, escala a miles de invocaciones concurrentes, y pagas solo por invocación
+ tiempo de ejecución (nada estando ocioso).

Para datos, Lambda brilla como **pegamento**: "un archivo nuevo aterrizó en S3 → dispara una Lambda para
validarlo / arrancar un job", procesamiento de streams desde Kinesis, backends de API ligeros. Los
límites lo mantienen honesto: máx 15 minutos de ejecución y memoria limitada, así que es para tareas
cortas, no un job de Spark de 3 horas.

## Contenedores — ECS, Fargate, EKS

Empaqueta tu código + dependencias en un **contenedor** (Docker) y córrelo consistentemente en cualquier
lado. En AWS:

- **ECS/EKS** — orquestadores (EKS = Kubernetes gestionado) que agendan contenedores, normalmente sobre
  EC2 que gestionas.
- **Fargate** — **contenedores serverless**: corre un contenedor sin gestionar servidores, como Lambda
  pero sin el límite de 15 minutos — genial para jobs batch containerizados y transformaciones más
  largas.

# Cómo elegir

| Necesidad | Usa |
|---|---|
| Control total / larga vida / clúster auto-gestionado | **EC2** |
| Pegamento corto dirigido por eventos, scale-to-zero | **Lambda** |
| Batch tolerante a fallos barato | **EC2 Spot** (p. ej. bajo EMR) |
| Job containerizado, sin gestión de servidores | **Fargate** |
| Kubernetes gestionado a escala | **EKS** |

La tendencia es hacia **serverless** (Lambda, Fargate, y los servicios de datos serverless de la
siguiente lección): menos ops, pago-por-uso, scale-to-zero — te enfocas en los datos, no en los
servidores.`,
      },
      {
        question: "Un archivo nuevo aterriza en un bucket de S3 y quieres validarlo automáticamente y disparar un job de aguas abajo — una tarea corta que puede dispararse cientos de veces al día. ¿Mejor opción?",
        options: [
          "Lambda — dirigida por eventos, escala automáticamente por invocación, sin costo ocioso, y las tareas cortas caben bien dentro de sus límites de ejecución",
          "Una instancia EC2 corriendo permanentemente haciendo polling del bucket cada segundo",
          "Un clúster Kubernetes de EKS",
          "S3 Glacier",
        ],
        explanation:
          "Eventos de S3 → Lambda es el patrón canónico de pegamento serverless: corre solo cuando llega un archivo, escala con la tasa de eventos, y no cuesta nada estando ocioso. Un poller EC2 de larga vida desperdicia dinero y añade ops; la tarea es demasiado pequeña para un clúster de Kubernetes.",
      },
      {
        question: "¿Por qué EC2 Spot es una gran opción para jobs batch de Spark pero mala para una base de datos primaria con estado?",
        options: [
          "Las instancias Spot pueden reclamarse con ~2 minutos de aviso; Spark reintenta las tareas perdidas así que lo tolera, pero una base de datos primaria perdiendo su nodo abruptamente arriesga downtime/pérdida de datos",
          "Las instancias Spot no pueden correr bases de datos en absoluto por razones de licencia",
          "Spark no se permite en instancias on-demand",
          "Las bases de datos corren más rápido en Spot que en on-demand",
        ],
        explanation:
          "Spot cambia precio por interrumpibilidad. Las cargas tolerantes a fallos y reintentables (batch distribuido) absorben los reclamos por hasta ~90% de ahorro; un servicio con estado y siempre activo quiere la fiabilidad de capacidad on-demand/reserved. Ajustar el modelo de precios a la tolerancia a fallos es una habilidad central de costo.",
      },
      {
        title: "Cómputo de AWS",
        cards: [
          { front: "EC2", back: "Servidores virtuales por segundo. Máx control, gestionas el SO/escalado. Para servicios de larga vida, clústeres auto-gestionados, setups personalizados." },
          { front: "Spot vs On-demand vs Reserved", back: "Spot = hasta ~90% de descuento pero reclamable (genial para batch tolerante a fallos). On-demand = flexible, lo más caro. Reserved/Savings Plans = descuento por un compromiso de 1–3 años sobre carga estable." },
          { front: "Lambda", back: "Funciones serverless disparadas por eventos. Auto-escala, paga por invocación, nada estando ocioso. Máx 15 min de ejecución — para tareas cortas de pegamento, no jobs grandes." },
          { front: "Fargate", back: "Contenedores serverless — corre un contenedor Docker sin servidores que gestionar y sin límite de 15 min. Bueno para batch containerizado/transformaciones más largas." },
          { front: "ECS / EKS", back: "Orquestadores de contenedores. EKS = Kubernetes gestionado; ECS = el scheduler propio de AWS. Corren contenedores sobre EC2 (o Fargate)." },
          { front: "Tendencia serverless", back: "Lambda/Fargate + servicios de datos serverless: menos ops, pago-por-uso, scale-to-zero. Enfócate en los datos, no en gestionar servidores." },
        ],
      },
    ],
  },
  "aws-databases": {
    title: "Bases de Datos en AWS",
    summary: "RDS, DynamoDB, Redshift — ajustando el store a la carga de trabajo.",
    blocks: [
      {
        markdown: `# Elige el store que encaja con la carga

AWS ofrece una base de datos para cada forma de dato. La habilidad no es memorizarlas — es mapear cada
una a los conceptos de **carga de trabajo** que ya conoces (OLTP vs OLAP, relacional vs NoSQL).

## RDS / Aurora — relacional gestionado (OLTP)

**RDS** (Relational Database Service) corre **PostgreSQL/MySQL/etc.** gestionado — AWS maneja backups,
parches, réplicas, failover; tú usas el SQL que ya conoces. **Aurora** es el motor cloud-nativo de AWS,
de mayor rendimiento, compatible con MySQL/Postgres.

- **Carga:** **OLTP** — muchas lecturas/escrituras pequeñas y rápidas de filas individuales; la base de
  datos transaccional de la app (órdenes, usuarios). Orientada a filas, normalizada.

## DynamoDB — NoSQL gestionado (key-value/documento)

**NoSQL** serverless: lookups de milisegundos de un dígito a cualquier escala, sin esquema, sin
servidores. Diseñas alrededor de **patrones de acceso** (una partition key), no tablas normalizadas — y
renuncias a joins/SQL ad-hoc.

- **Carga:** lookups por clave a escala masiva — sesiones de usuario, estado de dispositivos IoT, un
  carrito de compras, un feature store. "Trae ítem por clave, rápido, a cualquier volumen."

## Redshift — data warehouse (OLAP)

El **data warehouse columnar y MPP** (procesamiento masivamente paralelo) de AWS. Guarda datos por
columna y reparte las consultas entre muchos nodos — hecho para escanear miles de millones de filas
para **analytics**, exactamente el warehouse que modelaste con esquemas en estrella.

- **Carga:** **OLAP** — grandes agregaciones, joins sobre tablas de hechos/dimensiones, dashboards de
  BI. **Redshift Spectrum** incluso consulta Parquet directamente en S3.

# La decisión

| Necesitas… | Usa |
|---|---|
| BD transaccional de app, SQL, joins, normalizada | **RDS / Aurora** (OLTP) |
| Lookups por clave rápidos a escala masiva, esquema flexible | **DynamoDB** (NoSQL) |
| Analytics/BI sobre tablas enormes, agregaciones | **Redshift** (warehouse OLAP) |
| SQL sobre archivos en S3 sin cargar | **Athena** (siguiente lección) |

El error clásico es correr analytics en la base de datos OLTP hasta que se derrite — los stores OLTP
orientados a filas y los warehouses OLAP columnares están hechos para patrones de acceso opuestos.
Store correcto, trabajo correcto.`,
      },
      {
        question: "Los analistas corren agregaciones `GROUP BY` pesadas sobre una tabla de hechos de mil millones de filas y está aplastando la base de datos Postgres (RDS) de producción. ¿Cuál es la arquitectura correcta?",
        options: [
          "Mover el analytics a un warehouse OLAP columnar (Redshift), cargado desde la BD OLTP — el RDS orientado a filas está hecho para transacciones, no scans/agregaciones de tabla completa",
          "Añadir más índices al Postgres de RDS hasta que los scans sean rápidos",
          "Cambiar la app a DynamoDB",
          "Correr las agregaciones en Lambda",
        ],
        explanation:
          "El OLTP (RDS orientado a filas) sobresale en lecturas/escrituras puntuales pequeñas; los grandes scans analíticos quieren un warehouse MPP columnar (Redshift) que lee solo las columnas necesarias entre nodos paralelos. Separar los stores transaccionales y analíticos es un movimiento fundamental de arquitectura de datos.",
      },
      {
        question: "¿Qué carga de trabajo es la mejor opción para DynamoDB en vez de RDS o Redshift?",
        options: [
          "El estado de carrito/sesión de millones de usuarios traído por user_id con latencia de milisegundos de un dígito a cualquier escala — un patrón de acceso conocido basado en clave, sin joins ad-hoc",
          "Joins SQL ad-hoc entre tablas normalizadas para un reporte",
          "Escanear una tabla de hechos de mil millones de filas para una agregación trimestral",
          "Un libro mayor de finanzas que necesita transacciones ACID multi-fila y SQL complejo",
        ],
        explanation:
          "DynamoDB está hecho para lookups de alto volumen y baja latencia sobre una clave conocida con esquema flexible — diseñas para el patrón de acceso de antemano. Los joins/SQL ad-hoc apuntan a RDS; los grandes scans analíticos apuntan a Redshift.",
      },
      {
        title: "Bases de datos de AWS",
        cards: [
          { front: "RDS / Aurora", back: "SQL relacional gestionado (Postgres/MySQL). OLTP: muchas lecturas/escrituras de filas pequeñas y rápidas — la base de datos transaccional de la app. Aurora = el motor de mayor rendimiento de AWS." },
          { front: "DynamoDB", back: "Store NoSQL key-value/documento serverless. Lookups de milisegundos de un dígito a cualquier escala; diseña alrededor de patrones de acceso (partition key), sin joins/SQL ad-hoc." },
          { front: "Redshift", back: "Data warehouse columnar y MPP para OLAP: agregaciones/joins sobre tablas de hechos+dimensiones enormes. Spectrum consulta Parquet directamente en S3." },
          { front: "Store OLTP vs OLAP", back: "OLTP = orientado a filas, lecturas/escrituras puntuales (RDS). OLAP = orientado a columnas, grandes scans/agregaciones (Redshift). Patrones de acceso opuestos → sistemas separados." },
          { front: "Anti-patrón clásico", back: "Correr analytics pesado en la BD OLTP de la app hasta que se derrite. Arreglo: replica/carga en un warehouse columnar para el análisis." },
          { front: "Elegir un store", back: "Transaccional+SQL → RDS/Aurora; lookups por clave enormes → DynamoDB; analytics sobre tablas enormes → Redshift; SQL sobre archivos en S3 → Athena." },
        ],
      },
    ],
  },
  "aws-data-stack": {
    title: "El Stack de Datos de AWS",
    summary: "Glue, Athena, EMR, Kinesis, Step Functions — mapeados a lo que ya conoces.",
    blocks: [
      {
        markdown: `# Las versiones gestionadas de todo lo que aprendiste

AWS tiene un servicio para cada etapa de un pipeline de datos. La forma rápida de aprenderlos es mapear
cada uno a un concepto que ya posees:

| Servicio AWS | Qué es | Ya lo conoces como |
|---|---|---|
| **S3** | almacenamiento de objetos | el data lake / capas bronze-silver-gold |
| **Glue Data Catalog** | metastore central de tablas/esquemas | el catálogo de "qué tablas/columnas existen" |
| **Glue ETL** | jobs de ETL Spark serverless | transformaciones de Spark / PySpark |
| **Athena** | SQL serverless sobre archivos S3 | SQL sobre Parquet (como Spark SQL / dbt sobre archivos) |
| **Redshift** | warehouse columnar MPP | el data warehouse de esquema en estrella |
| **EMR** | clústeres Hadoop/Spark gestionados | tu propio clúster Spark grande |
| **Kinesis / MSK** | ingesta de streaming | topics de Kafka y streaming |
| **Step Functions / MWAA** | orquestación (MWAA = Airflow gestionado) | DAGs de Airflow |
| **Lake Formation** | permisos/gobernanza del lake | acceso granular sobre el lake |

# Athena: SQL serverless sobre el lake

**Athena** corre SQL estándar directamente sobre archivos en S3 — sin clúster, sin carga. Lee las
definiciones de tabla del **Glue Data Catalog**, y **pagas por terabyte escaneado.** Ese modelo de
precios convierte en *dinero* dos cosas que ya aprendiste:

- **Particionado** — un \`WHERE year=2026 AND month=02\` poda a un prefijo, así que Athena escanea una
  rebanada en vez de la tabla entera.
- **Formatos columnares (Parquet)** — Athena lee solo las columnas que tu consulta necesita, no cada
  byte de cada fila.

Juntos pueden cortar los bytes escaneados de una consulta — y su factura — 10–100×. Por esto las
lecciones de layout físico no eran académicas: en Athena, el layout *es* costo.

# Un pipeline de referencia

\`\`\`
Kinesis / Glue  →  S3 bronze (crudo)  →  Glue ETL / dbt  →  S3 silver/gold (Parquet, particionado)
                                                                │
                                                Athena  o  Redshift (BI / dashboards)
        orquestado de punta a punta por Step Functions / MWAA (Airflow)
\`\`\`

Cada caja es un servicio, pero la *forma* es el lakehouse medallion que ya construiste — AWS solo provee
implementaciones gestionadas de cada etapa.`,
      },
      { title: "Por qué particionado + columnar recorta la factura de Athena" },
      {
        question: "Athena cobra por terabyte escaneado. ¿Qué dos decisiones de diseño reducen más el costo de un típico `SELECT a, b FROM t WHERE dt = '2026-02-01'`?",
        options: [
          "Particionar los datos por fecha (para que el WHERE pode a un prefijo) y guardarlos como Parquet columnar (para que solo se lean las columnas a y b)",
          "Añadir más nodos de Athena y correr la consulta de noche",
          "Guardar los datos como un CSV gigante sin comprimir por simplicidad",
          "Usar SELECT * para que Athena pueda cachear todo",
        ],
        explanation:
          "El partition pruning corta las FILAS escaneadas al prefijo que coincide; el Parquet columnar corta las COLUMNAS leídas a solo a y b. Combinados encogen los bytes escaneados (y la factura) por órdenes de magnitud — el beneficio concreto de las lecciones de layout de almacenamiento.",
      },
      {
        question: "¿Cómo deberías pensar en Glue, Athena, Redshift, Kinesis, y MWAA al aprenderlos?",
        options: [
          "Como implementaciones gestionadas de AWS de conceptos que ya conoces — Glue≈ETL Spark + un catálogo, Athena≈SQL sobre archivos, Redshift≈el warehouse, Kinesis≈Kafka, MWAA≈Airflow",
          "Como cinco productos no relacionados sin nada en común",
          "Como reemplazos del SQL y Python que ya no necesitas",
          "Como servicios que solo funcionan si los usas todos juntos",
        ],
        explanation:
          "El stack de datos de AWS es el mismo pipeline que has construido — ingesta, almacenar, transformar, servir, orquestar — con servicios gestionados intercambiados por etapa. Mapear cada uno a su concepto subyacente convierte un muro de nombres de producto en cosas que ya entiendes.",
      },
      {
        title: "Stack de datos de AWS",
        cards: [
          { front: "Glue Data Catalog", back: "Un metastore central de metadatos de tabla/columna/partición sobre tus datos en S3. Athena, Redshift Spectrum, y EMR lo leen para saber 'qué tablas existen'." },
          { front: "Glue ETL", back: "Jobs de ETL Spark serverless (más crawlers que infieren esquemas). La versión gestionada de tus transformaciones de PySpark." },
          { front: "Athena", back: "SQL serverless directamente sobre archivos S3, usando el Glue Catalog. Paga por TB escaneado — así que particionar + Parquet cortan el costo directamente." },
          { front: "EMR", back: "Clústeres Hadoop/Spark gestionados para batch personalizado grande — tu propio clúster Spark, aprovisionado y escalado por AWS (a menudo sobre Spot)." },
          { front: "Kinesis / MSK", back: "Ingesta de streaming. Kinesis = streams nativos de AWS; MSK = Kafka gestionado. El modelo de topics/particiones de Kafka del track de streaming." },
          { front: "Step Functions / MWAA", back: "Orquestación. Step Functions = flujos de máquina de estados de AWS; MWAA = Managed Workflows for Apache Airflow (tus DAGs, gestionados)." },
          { front: "Layout = costo en Athena", back: "Como pagas por byte escaneado, el partition pruning + Parquet columnar pueden cortar los datos escaneados de una consulta (y la factura) 10–100×." },
        ],
      },
    ],
  },
  "aws-pipeline-cost": {
    title: "Construir y Operar un Pipeline de Datos",
    summary: "Un lakehouse de referencia en AWS, más básicos de costo y operaciones.",
    blocks: [
      {
        markdown: `# Poniéndolo junto: un lakehouse en AWS

Todo hasta ahora se ensambla en el **lakehouse medallion** que construiste antes, ahora como servicios
gestionados de AWS:

\`\`\`
                 ┌─────────── orquestación: Step Functions / MWAA (Airflow) ───────────┐
                 ▼                                                                       ▼
ingesta ─▶ S3 BRONZE ─▶ Glue/EMR ─▶ S3 SILVER ─▶ dbt/Glue ─▶ S3 GOLD ─▶ Athena / Redshift ─▶ BI
(Kinesis,   (crudo,       (limpio,     (conformado,  (Parquet,     (star schema        (dashboards)
 batch)      inmutable)    validado)    particionado) agregados)    / marts)
\`\`\`

- **Ingesta** eventos/archivos crudos a **S3 bronze** (inmutable, exactamente como se recibió).
- **Transforma** con **Glue** (Spark serverless) o **EMR** (Spark grande) a **silver** (limpio,
  deduplicado, validado) y **gold** (agregados de nivel de negocio), guardados como **Parquet
  particionado**.
- **Sirve** con **Athena** (SQL sobre la capa gold) o **Redshift** (marts cargados) a las herramientas
  de BI.
- **Orquesta** todo el DAG con **Step Functions** o **MWAA**, y compuerta los cambios por el flujo de
  **Git + CI** de los tracks anteriores.
- **Gobierna** el acceso con **IAM** + **Lake Formation** (mínimo privilegio sobre el lake).

Ahora has visto esta forma exacta tres veces — los marts de dbt, el medallion de Databricks, y aquí. El
patrón es portable; el proveedor es un detalle.

# Costo y operaciones que no puedes ignorar

Las facturas de la nube sorprenden a los equipos porque todo es pago-por-uso. Las grandes palancas de
datos:

- **Costo de scan en S3** — particiona + usa Parquet columnar (Athena/Redshift Spectrum facturan por
  byte escaneado). La palanca de costo de analytics más grande.
- **Escalonamiento de almacenamiento** — hazle lifecycle a los datos viejos hacia IA/Glacier.
- **Spot para batch** — Spark tolerante a fallos sobre Spot ahorra hasta ~90%.
- **Apágalo** — los clústeres ociosos (EMR/Redshift) queman dinero 24/7; usa auto-pause, serverless
  (Athena, Redshift Serverless, Fargate), y scale-to-zero.
- **Transferencia de datos** — el egreso/cross-region se factura; mantén el cómputo junto a los datos.
- **Tagging** — etiqueta recursos por equipo/proyecto para poder atribuir la factura y cazar
  desperdicio.

# Observabilidad

- **CloudWatch** — métricas, logs, y alarmas (p. ej. "alerta si el conteo de errores del job nocturno
  > 0", "alerta si el gasto de S3 se dispara"). La versión nativa de AWS del monitoreo y las alertas
  que viste en el track de Calidad de Datos.
- **CloudTrail** — un log de auditoría de cada llamada a la API (quién hizo qué, cuándo) — esencial para
  la revisión de seguridad y depurar "¿quién borró esa tabla?".

Ajustar el tamaño, apagar las cosas, y vigilar la factura no son ocurrencias tardías — en la nube, el
costo es una restricción de ingeniería de primera clase.`,
      },
      {
        question: "Un clúster Spark de EMR corre un job de 2 horas cada noche pero se deja corriendo 24/7. ¿Cuál es el arreglo de mayor palanca?",
        options: [
          "Hacerlo transitorio — levanta el clúster para el job y termínalo después (y corre los workers en Spot); paga por ~2 horas en vez de 24, ahorrando el tiempo ocioso",
          "Actualizar a instancias más grandes para que el job termine más rápido",
          "Mover el clúster a una región distinta",
          "Añadir más buckets de S3 para repartir la carga",
        ],
        explanation:
          "El cómputo ocioso es puro desperdicio bajo pago-por-uso. Los clústeres transitorios/auto-terminantes (o equivalentes serverless) facturan solo por el trabajo, y los workers Spot cortan la tarifa por hora aún más para batch reintentable. 'Apágalo cuando esté ocioso' es el primer reflejo de costo.",
      },
      {
        question: "¿Qué servicio de AWS te da un rastro de auditoría de 'quién llamó a qué API y cuándo' — p. ej. para encontrar quién borró una tabla?",
        options: [
          "CloudTrail — loguea cada llamada a la API de AWS (identidad, acción, tiempo, recurso) para seguridad y forense",
          "CloudWatch — recolecta métricas/logs/alarmas, pero no un rastro de auditoría de identidad por llamada",
          "Las lifecycle policies de S3",
          "Las políticas de IAM",
        ],
        explanation:
          "CloudTrail es el log de auditoría de API (quién/qué/cuándo/dónde) — el recurso para '¿quién borró eso?' y cumplimiento. CloudWatch es para métricas operativas, logs, y alarmas. Son complementarios: CloudTrail para auditoría, CloudWatch para monitoreo/alertas.",
      },
      {
        title: "Pipeline, costo y ops",
        cards: [
          { front: "Forma del lakehouse en AWS", back: "Ingesta→S3 bronze→Glue/EMR→silver→dbt/Glue→gold→Athena/Redshift→BI, orquestado por Step Functions/MWAA. El patrón medallion en servicios gestionados." },
          { front: "Mayor palanca de costo de analytics", back: "Reduce los bytes escaneados: particiona los datos y guárdalos como Parquet columnar (Athena/Spectrum facturan por byte escaneado)." },
          { front: "Apágalo", back: "Los clústeres EMR/Redshift ociosos facturan 24/7. Usa clústeres transitorios, auto-pause, y serverless (Athena, Redshift Serverless, Fargate) para escalar a cero." },
          { front: "Spot para batch", back: "Corre workers Spark tolerantes a fallos sobre instancias Spot para hasta ~90% de ahorro — Spark reintenta las tareas reclamadas." },
          { front: "Costo de transferencia de datos", back: "El tráfico cross-region y de egreso se factura. Mantén el cómputo en la misma región que sus datos para evitar cargos sorpresa." },
          { front: "CloudWatch vs CloudTrail", back: "CloudWatch = métricas, logs, alarmas (monitoreo/alertas). CloudTrail = log de auditoría de cada llamada a la API (quién hizo qué, cuándo)." },
          { front: "Tagging", back: "Etiqueta recursos por equipo/proyecto para atribuir la factura y encontrar desperdicio. El costo es una restricción de ingeniería de primera clase en la nube." },
        ],
      },
    ],
  },
};
