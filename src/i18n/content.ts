import type { Locale } from "../store/localeStore";
import type { Module, ModuleLevel, Track } from "../types/lesson";

// Localized labels for content-level metadata: module titles/blurbs, track section headings,
// and difficulty levels. English lives on the Module data itself (the source of truth); this
// file supplies the Spanish overlay, keyed by the module id. Anything without a translation
// falls back to the English on the module.
//
// Lesson titles and lesson bodies are intentionally NOT translated here — that is the full
// content-translation phase, out of scope for the chrome pass.

const trackEs: Record<Track, string> = {
  "Foundations & Tooling": "Fundamentos y Herramientas",
  Python: "Python",
  SQL: "SQL",
  "Software Design": "Diseño de Software",
  "Data Engineering": "Ingeniería de Datos",
  Cloud: "Cloud",
};

const levelEs: Record<ModuleLevel, string> = {
  Beginner: "Principiante",
  Intermediate: "Intermedio",
  Advanced: "Avanzado",
};

interface ModuleText {
  title: string;
  blurb: string;
}

// Spanish overlay for every module, keyed by module id.
const moduleEs: Record<string, ModuleText> = {
  linux: {
    title: "Linux y la Línea de Comandos",
    blurb: "Shell, sistema de archivos, pipes y manejo de texto, permisos, procesos, cron.",
  },
  "git-github": {
    title: "Git y GitHub",
    blurb: "Snapshots y el DAG de commits, ramas, rebase, PRs, deshacer, CI para datos.",
  },
  basics: {
    title: "Fundamentos de Python",
    blurb: "Variables, tipos, control de flujo, funciones — las bases.",
  },
  "data-structures": {
    title: "Estructuras de Datos",
    blurb: "Listas, tuplas, diccionarios, sets y pilas/colas — con visuales.",
  },
  "python-oop": {
    title: "POO en Python",
    blurb: "Clases, métodos dunder, herencia vs composición, dataclasses, propiedades.",
  },
  "python-engineering": {
    title: "Ingeniería en Python",
    blurb: "Type hints, excepciones bien hechas, generadores, context managers, archivos, testing.",
  },
  dsa: {
    title: "DSA — Algoritmos",
    blurb: "Dos punteros, recursión, ordenamiento, búsqueda, árboles y grafos — visualizado.",
  },
  libraries: {
    title: "Librerías Esenciales",
    blurb: "collections, itertools, datetime, math/statistics, functools — pilas incluidas.",
  },
  numpy: {
    title: "NumPy",
    blurb: "Arrays n-dimensionales rápidos, indexado, reshaping y matemática vectorizada.",
  },
  pandas: {
    title: "Pandas — Manejo de Datos",
    blurb: "Cargar, seleccionar, limpiar, agrupar, combinar y agregar datos tabulares.",
  },
  viz: {
    title: "Visualización de Datos",
    blurb: "Grafica con matplotlib y seaborn — renderizado en el navegador.",
  },
  ml: {
    title: "Intro a ML (scikit-learn)",
    blurb: "Entrena, ajusta y evalúa modelos reales — regresión, pipelines, validación cruzada y métricas.",
  },
  pyspark: {
    title: "Spark y PySpark",
    blurb: "Procesamiento distribuido: arquitectura, API de DataFrame, Spark SQL, rendimiento.",
  },
  postgres: {
    title: "PostgreSQL",
    blurb: "Consulta una base Postgres real en tu navegador — de SELECT a window functions, JSONB y plpgsql.",
  },
  solid: {
    title: "Principios SOLID",
    blurb: "Cinco principios que mantienen el código mantenible — práctico en Python.",
  },
  "design-patterns": {
    title: "Patrones de Diseño",
    blurb: "Factory, Singleton, Strategy, Adapter, Decorator, Observer — en Python funcional.",
  },
  architecture: {
    title: "Patrones de Arquitectura",
    blurb: "Capas, hexagonal/puertos y adaptadores, inyección de dependencias, composición, idempotencia y reintentos.",
  },
  "data-fundamentals": {
    title: "Fundamentos de Datos",
    blurb: "El panorama de datos: roles, OLTP vs OLAP, formatos de archivo, batch vs streaming.",
  },
  "data-modeling": {
    title: "Modelado de Datos",
    blurb: "Normalización, esquemas en estrella, hechos y dimensiones, claves subrogadas, SCD Tipo 2.",
  },
  "warehouse-lakehouse": {
    title: "Warehouse, Lake y Lakehouse",
    blurb: "Warehouses en capas, ELT, data lakes, Delta/Iceberg, medallion, cargas incrementales.",
  },
  databricks: {
    title: "Databricks",
    blurb: "La plataforma lakehouse: workspace, Delta Lake, Unity Catalog, Jobs, DBSQL.",
  },
  dbt: {
    title: "dbt",
    blurb: "Modelos, DAGs con ref(), materializaciones, tests, snapshots, Jinja — práctico.",
  },
  orchestration: {
    title: "Orquestación (Airflow)",
    blurb: "DAGs, scheduling, backfills, tareas idempotentes — y construye un mini orquestador.",
  },
  "data-quality": {
    title: "Calidad de Datos",
    blurb: "Dimensiones de DQ, restricciones, auditorías de reconciliación, código de validación, observabilidad.",
  },
  streaming: {
    title: "Streaming y Kafka",
    blurb: "Eventos, topics y consumer groups de Kafka, ventanas, semánticas de entrega.",
  },
  aws: {
    title: "AWS para Datos",
    blurb: "IAM, data lakes en S3, cómputo, bases de datos y el stack de datos de AWS.",
  },
};

/** Localized section heading for a track. */
export function trackLabel(track: Track, locale: Locale): string {
  return locale === "es" ? trackEs[track] : track;
}

/** Localized difficulty label for a module level. */
export function levelLabel(level: ModuleLevel, locale: Locale): string {
  return locale === "es" ? levelEs[level] : level;
}

/** Localized module title (falls back to the module's English title). */
export function moduleTitle(m: Module, locale: Locale): string {
  return (locale === "es" && moduleEs[m.id]?.title) || m.title;
}

/** Localized module blurb (falls back to the module's English blurb). */
export function moduleBlurb(m: Module, locale: Locale): string {
  return (locale === "es" && moduleEs[m.id]?.blurb) || m.blurb;
}
