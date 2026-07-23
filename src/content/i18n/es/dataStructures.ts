import type { LessonI18n } from "../overlay";

// Spanish overlay for the "Data Structures" module. Blocks are index-matched to the English
// lesson; only text is translated (code stays as-is).
export const dataStructuresEs: Record<string, LessonI18n> = {
  lists: {
    title: "Listas",
    summary: "Secuencias ordenadas y mutables — el caballo de batalla de Python.",
    blocks: [
      {
        markdown: `# Listas

Una **lista** es una colección ordenada y mutable. Indexa desde \`0\`; los índices
negativos cuentan desde el final.

\`\`\`python
nums = [10, 20, 30]
nums.append(40)     # añadir al final
nums.insert(0, 5)   # insertar en un índice
nums.pop()          # quitar y devolver el último
nums[1] = 99        # mutar en el sitio
\`\`\`

\`nums.sort()\` ordena **en el sitio** y devuelve \`None\`. La función \`sorted(nums)\`
en cambio **devuelve una lista nueva ordenada** y deja \`nums\` intacta — úsala cuando
necesites conservar el orden original.`,
      },
      {
        title: "Indexar una lista",
        caption: "Cada caja es un elemento; el número de abajo es su índice.",
      },
      { title: "Operaciones con listas" },
      { title: "Aliasing — ¡cambia a la vista de Objetos!" },
      {
        title: "Segundo mayor",
        prompt:
          "Devuelve el segundo valor **distinto** más grande de `nums` (asume al menos dos valores distintos).",
        hints: [
          "Primero construye una lista de los valores *distintos* de `nums` — recórrela y quédate con un valor solo la primera vez que lo veas (usa `in` para comprobar si ya lo recogiste).",
          "Una vez tengas los valores distintos, ordénalos con `sorted(...)` — el segundo mayor es el penúltimo de esa lista ordenada.",
        ],
      },
    ],
  },
  tuples: {
    title: "Tuplas",
    summary: "Secuencias inmutables; desempaquetado y como claves de diccionario.",
    blocks: [
      {
        markdown: `# Tuplas

Una **tupla** es como una lista pero **inmutable**. Ideal para registros fijos y como
claves de diccionario.

\`\`\`python
point = (3, 4)
x, y = point          # desempaquetado
coords = {(0,0): "origin"}  # las tuplas pueden ser claves
\`\`\``,
      },
      { title: "Desempaquetado" },
      {
        question: "¿Qué operación lanza un error sobre una tupla `t = (1, 2, 3)`?",
        options: ["t[0]", "len(t)", "t[0] = 9", "t + (4,)"],
        explanation: "Las tuplas son inmutables — no se permite asignar a un elemento.",
      },
    ],
  },
  dicts: {
    title: "Diccionarios",
    summary: "Mapas clave→valor con búsqueda O(1).",
    blocks: [
      {
        markdown: `# Diccionarios

Un **dict** mapea claves a valores con búsqueda promedio **O(1)** (es una tabla hash).

\`\`\`python
prices = {"apple": 3, "pear": 2}
prices["apple"]            # 3
prices.get("banana", 0)    # 0 (por defecto, sin KeyError)
for k, v in prices.items():
    ...
\`\`\``,
      },
      { title: "Contar con un dict" },
      {
        title: "Frecuencia de palabras",
        prompt:
          "Devuelve un dict que mapee cada palabra de la lista `words` a cuántas veces aparece.",
        hints: [
          "Empieza con un dict vacío y recorre `words`, contando cada una.",
          "`counts.get(w, 0)` devuelve el conteo actual (o 0 la primera vez que ves `w`), así que `counts[w] = counts.get(w, 0) + 1` incrementa de forma segura.",
        ],
      },
    ],
  },
  sets: {
    title: "Conjuntos (Sets)",
    summary: "Colecciones sin orden y sin duplicados; pertenencia rápida y álgebra de conjuntos.",
    blocks: [
      {
        markdown: `# Conjuntos (Sets)

Un **set** guarda elementos únicos con pruebas de pertenencia rápidas y soporta
álgebra de conjuntos:

\`\`\`python
a = {1, 2, 3}
b = {2, 3, 4}
a | b   # unión         {1,2,3,4}
a & b   # intersección  {2,3}
a - b   # diferencia    {1}
\`\`\``,
      },
      { title: "Deduplicar y álgebra de conjuntos" },
      {
        title: "Elementos comunes",
        prompt: "Devuelve una **lista ordenada** de los valores que aparecen en `a` y en `b`.",
        hints: [
          "Convierte cada lista en un `set` para que la pertenencia sea rápida y los duplicados colapsen.",
          "Los valores en ambos son la intersección `set(a) & set(b)`; envuélvela en `sorted(...)` para devolver una lista ordenada.",
        ],
      },
    ],
  },
  "stacks-queues": {
    title: "Pilas y Colas",
    summary: "Patrones LIFO y FIFO sobre listas / deque.",
    blocks: [
      {
        markdown: `# Pilas y Colas

Una **pila** (stack) es Last-In-First-Out (LIFO): apilas y desapilas por el mismo extremo.
Una **cola** (queue) es First-In-First-Out (FIFO): encolas por atrás, desencolas por el
frente.

\`\`\`python
stack = []
stack.append(1); stack.append(2)
stack.pop()          # 2  (LIFO)

from collections import deque
q = deque()
q.append(1); q.append(2)
q.popleft()          # 1  (FIFO)
\`\`\``,
      },
      {
        title: "Pila (LIFO)",
        caption: "Observa los valores apilados y desapilados por el mismo extremo (la cima).",
      },
      {
        title: "Cola (FIFO)",
        caption: "Los elementos salen por el frente en el orden en que llegaron.",
      },
      {
        title: "Paréntesis balanceados",
        prompt:
          "Devuelve `True` si la cadena `s` de `()[]{}` está balanceada y correctamente anidada.",
        hints: [
          "Usa una pila (una lista): apila cada símbolo de apertura.",
          "Ante un símbolo de cierre, la cima de la pila debe ser su apertura correspondiente.",
          "Al final la pila debe estar vacía — si no, algún símbolo de apertura nunca se cerró.",
        ],
      },
      {
        title: "Estructuras de datos — elige la correcta",
        cards: [
          { front: "list vs tuple", back: "Ambas son secuencias ordenadas; una **lista** es mutable (`.append`, asignación de elementos), una **tupla** es inmutable — usable como clave de dict o elemento de set." },
          { front: "Cuándo usar un dict", back: "Búsquedas clave→valor en O(1) promedio. Contar, agrupar, cachear, 'buscar por id'." },
          { front: "Qué te da un set", back: "Elementos únicos + pertenencia O(1) + álgebra de conjuntos (`|` unión, `&` intersección, `-` diferencia). Sin orden, sin duplicados." },
          { front: "`dict.get(k, default)`", back: "Devuelve el valor de `k`, o `default` si la clave no está — sin `KeyError`. Ideal para contadores: `d[k] = d.get(k, 0) + 1`." },
          { front: "Pila (LIFO) vs Cola (FIFO)", back: "Pila: apilar/desapilar por el mismo extremo (`.append`/`.pop` de una lista). Cola: añadir por un extremo, quitar por el otro (`collections.deque`)." },
          { front: "Aliasing vs copiar una lista", back: "`b = a` hace que ambos nombres apunten a la MISMA lista; `c = a[:]` (o `list(a)`) crea una copia independiente." },
        ],
      },
    ],
  },
};
