import type { LessonI18n } from "../overlay";

// Spanish overlay for the "DSA — Algorithms" module. Index-matched; text-only (code/tests
// come from the English source). dsa-viz blocks translate title + caption; visualizers use
// English labels internally, which is fine.
export const dsaEs: Record<string, LessonI18n> = {
  "two-pointers": {
    title: "Arrays y Dos Punteros",
    summary: "Un patrón que convierte muchos escaneos O(n²) en O(n).",
    blocks: [
      {
        markdown: `# Dos Punteros

Mantén dos índices que se mueven uno hacia el otro (o en la misma dirección). Es un
patrón de referencia para arrays ordenados, inversiones y problemas de suma de pares.

\`\`\`python
lo, hi = 0, len(arr) - 1
while lo < hi:
    ...
    lo += 1; hi -= 1
\`\`\``,
      },
      {
        title: "Dos punteros convergiendo",
        caption: "Los punteros izquierdo y derecho se mueven hacia dentro hasta cruzarse.",
      },
      {
        title: "Two-sum (ordenado)",
        prompt:
          "Dada una lista **ordenada** `nums` y un `target`, devuelve los índices base-0 `[i, j]` de dos números que suman `target` (i < j). Usa dos punteros para O(n).",
        hints: [
          "Pon un puntero al inicio (`lo`) y otro al final (`hi`).",
          "Si la suma es muy pequeña, mueve `lo` a la derecha; si es muy grande, mueve `hi` a la izquierda.",
          "Cuando `nums[lo] + nums[hi] == target`, devuelve `[lo, hi]`.",
        ],
      },
    ],
  },
  hashing: {
    title: "Hashing y Mapas de Frecuencia",
    summary: "Cambia espacio por búsquedas O(1).",
    blocks: [
      {
        markdown: `# Hashing

Los dicts/sets dan pertenencia y conteo promedio **O(1)**. Muchos problemas de "encontrar
un par / encontrar un duplicado / agrupar por" se vuelven lineales con un hash map.

Por dentro, una tabla hash mapea cada clave a un **bucket** vía \`hash(key) % n\`. Cuando
dos claves caen en el mismo bucket (una **colisión**), se guardan en una pequeña cadena.

Cuando necesitas el **índice** y el **valor** a la vez en un bucle — útil cuando vas a
guardar uno de ellos en un hash map — usa \`enumerate(...)\` en vez de un contador manual.
Produce pares \`(index, value)\`:

\`\`\`python
for i, x in enumerate([10, 20, 30]):
    print(i, x)   # 0 10 | 1 20 | 2 30
\`\`\``,
      },
      {
        title: "Hashing con encadenamiento",
        caption: "Cada clave va al bucket key % 7; las colisiones se añaden a la cadena del bucket.",
      },
      {
        title: "Two-sum (sin ordenar)",
        prompt:
          "Devuelve los índices `[i, j]` de dos números en `nums` que suman `target`. Una pasada con un dict: O(n).",
        hints: [
          "Recorre la lista una vez con `enumerate` para tener cada valor Y su índice.",
          "Para el valor actual `x`, su pareja es `target - x`. Mantén un dict de los valores ya vistos mapeados a su índice.",
          "Si `target - x` ya está en ese dict, encontraste el par — devuelve `[seen[target - x], i]`. Si no, guarda `seen[x] = i` y continúa.",
        ],
      },
      {
        question: "¿Por qué el two-sum de una pasada usa un dict (hash map) en vez de un bucle anidado?",
        options: [
          "La pertenencia/búsqueda en un dict es O(1), convirtiendo el escaneo de pares O(n²) en O(n)",
          "Un dict mantiene los números ordenados para búsqueda binaria",
          "Los dicts usan menos memoria que una lista",
          "Evita la recursión",
        ],
        explanation:
          "Mientras escaneas, guardas cada valor→índice y le preguntas al dict si el complemento necesario ya se vio — una pregunta O(1). Eso reemplaza el bucle interno, así que el trabajo total baja de O(n²) a O(n) (a cambio de O(n) de espacio).",
      },
    ],
  },
  "sliding-window": {
    title: "Ventana Deslizante",
    summary: "Una ventana móvil convierte trabajo repetido sobre sub-arrays en O(n).",
    blocks: [
      {
        markdown: `# Ventana Deslizante

Cuando un problema pregunta por sub-arrays/substrings **contiguos** de tamaño fijo (o
creciente), desliza una ventana por los datos y actualiza un agregado de forma incremental
en vez de recalcularlo cada vez — O(n) en lugar de O(n·k).

Rastrea el mejor valor visto con la función \`max(a, b)\` (devuelve el mayor) — p. ej.
\`best = max(best, window)\` actualiza \`best\` solo cuando \`window\` lo supera.`,
      },
      {
        title: "Suma máxima de ventana",
        caption: "La ventana de tamaño k se desliza un paso a la vez; rastrea la mejor suma vista.",
      },
      {
        title: "Suma máxima de una ventana de tamaño k",
        prompt:
          "Devuelve la **suma máxima** de cualquier ventana contigua de tamaño `k` en `nums` (asume 1 ≤ k ≤ len).",
        hints: [
          "Calcula la suma de la primera ventana (los primeros k elementos).",
          "Para deslizar: suma el nuevo elemento de la derecha y resta el que sale por la izquierda.",
          "Mantén un máximo corriente de las sumas de ventana.",
        ],
      },
    ],
  },
  recursion: {
    title: "Recursión",
    summary: "Funciones que se llaman a sí mismas — y la pila de llamadas.",
    blocks: [
      {
        markdown: `# Recursión

Una función recursiva resuelve un problema llamándose a sí misma sobre una entrada **más
pequeña**, deteniéndose en un **caso base**. Cada llamada añade un frame a la **pila de
llamadas**.

\`\`\`python
def factorial(n):
    if n <= 1:        # caso base
        return 1
    return n * factorial(n - 1)
\`\`\`

Observa la pila crecer al bajar y deshacerse al volver 👇`,
      },
      {
        title: "Pila de llamadas de factorial(4)",
        caption: "Amarillo = frame ejecutándose ahora; verde = devolviendo un valor.",
      },
      {
        title: "fib(5) — ramificación exponencial",
        caption: "El Fibonacci ingenuo recalcula las mismas llamadas — motivación para DP.",
      },
      {
        title: "Suma recursiva",
        prompt: "Devuelve la suma de `nums` usando recursión (sin bucles, sin `sum`).",
        hints: [
          "Caso base: la suma de una lista vacía es `0` — eso detiene la recursión.",
          "Si no, la respuesta es el primer elemento más la suma del *resto*: `nums[0] + rsum(nums[1:])`.",
        ],
      },
    ],
  },
  backtracking: {
    title: "Backtracking",
    summary: "Explora opciones con DFS, deshaciendo cada una para probar la siguiente.",
    blocks: [
      {
        markdown: `# Backtracking

El backtracking construye una solución de forma incremental: **elige**, recurre, y luego
**deshaz** la elección y prueba la siguiente. Explora un árbol de decisiones — ideal para
subconjuntos, permutaciones, combinaciones y puzzles como N-Reinas.

\`\`\`python
def backtrack(i, path):
    if i == len(items):
        record(path); return
    backtrack(i + 1, path)          # saltar items[i]
    path.append(items[i])
    backtrack(i + 1, path)          # elegir items[i]
    path.pop()                       # deshacer
\`\`\``,
      },
      {
        title: "Todos los subconjuntos de {1, 2, 3}",
        caption: "En cada elemento, ramifica en saltar vs elegir; recoge un subconjunto en cada hoja.",
      },
      {
        title: "Todos los subconjuntos",
        prompt:
          "Devuelve **todos los subconjuntos** de `nums` (el conjunto potencia) como una lista de listas. El orden no importa.",
        hints: [
          "Hay 2^n subconjuntos — cada elemento está dentro o fuera.",
          "Recurre con un índice y un path actual; al final, añade una copia del path.",
          "Después de la rama 'elegir', saca el elemento para restaurar el estado (backtrack).",
        ],
      },
    ],
  },
  sorting: {
    title: "Algoritmos de Ordenamiento",
    summary: "Bubble, insertion, selection, merge, quick — animados.",
    blocks: [
      {
        markdown: `# Ordenamiento

Los ordenamientos por comparación reordenan elementos. Observa cada algoritmo trabajar,
luego compara su comportamiento.

| Algoritmo | Tiempo promedio | Estable | In-place |
|---|---|---|---|
| Bubble | O(n²) | sí | sí |
| Insertion | O(n²) | sí | sí |
| Selection | O(n²) | no | sí |
| Merge | O(n log n) | sí | no |
| Quick | O(n log n) | no | sí |`,
      },
      {
        title: "Bubble Sort",
        caption: "Las comparaciones adyacentes llevan el mayor valor al final en cada pasada.",
      },
      { title: "Insertion Sort" },
      {
        title: "Merge Sort",
        caption: "Divide en mitades, luego fusiona las secuencias ordenadas.",
      },
      {
        title: "Quick Sort",
        caption: "Particiona alrededor de un pivote, luego recurre en cada lado.",
      },
      { title: "Anima tu propio ordenamiento" },
      {
        title: "Implementa insertion sort",
        prompt:
          "Devuelve una nueva lista ordenada (ascendente). Implementa insertion sort tú mismo (no llames a `sorted`/`.sort`).",
        hints: [
          "Copia la entrada primero (`a = list(nums)`) para ordenar una lista nueva y dejar la original intacta.",
          "Recorre del índice 1 al final. Cada elemento es la `key` que insertas en la parte ya ordenada a su izquierda.",
          "Desplaza a la derecha cada vecino izquierdo mayor que `key`, luego coloca `key` en el hueco que se abre.",
        ],
      },
    ],
  },
  "binary-search": {
    title: "Búsqueda Binaria",
    summary: "Búsqueda O(log n) sobre datos ordenados.",
    blocks: [
      {
        markdown: `# Búsqueda Binaria

Sobre datos **ordenados**, reduce a la mitad el espacio de búsqueda en cada paso: O(log n).

\`\`\`python
lo, hi = 0, len(a) - 1
while lo <= hi:
    mid = (lo + hi) // 2
    if a[mid] == target: return mid
    if a[mid] < target: lo = mid + 1
    else: hi = mid - 1
\`\`\``,
      },
      { title: "Traza una búsqueda binaria" },
      {
        title: "Búsqueda binaria",
        prompt:
          "Devuelve el índice de `target` en la lista ordenada `a`, o `-1` si no está. Debe ser O(log n).",
        hints: [
          "Rastrea una ventana con dos punteros, `lo = 0` y `hi = len(a) - 1`, y repite mientras `lo <= hi`.",
          "Revisa el medio: `mid = (lo + hi) // 2`. Si `a[mid] == target` terminaste.",
          "Si el medio es muy pequeño, el target está a la derecha (`lo = mid + 1`); si es muy grande, a la izquierda (`hi = mid - 1`). Devuelve `-1` si la ventana se cierra.",
        ],
      },
    ],
  },
  "linked-lists": {
    title: "Listas Enlazadas",
    summary: "Nodos enlazados por punteros; inserción y borrado.",
    blocks: [
      {
        markdown: `# Listas Enlazadas

Cada **nodo** guarda un valor y una referencia al nodo \`next\`. La inserción/borrado en
una posición conocida es O(1) (solo reenlazas punteros), pero el acceso aleatorio es O(n).`,
      },
      {
        title: "Append, prepend, delete",
        caption: "Borrar reenlaza el `next` del nodo previo saltándose el nodo removido.",
      },
      {
        title: "Invierte una lista enlazada",
        prompt:
          "Un nodo es `{'val': x, 'next': node_or_None}`. Devuelve la cabeza de la lista invertida.",
        hints: [
          "Mantén tres referencias mientras recorres: `prev` (empieza en None), `cur` (empieza en la cabeza), y un temporal `nxt`.",
          "Antes de girar el puntero de un nodo, guarda `nxt = cur['next']` para no perder el resto de la lista.",
          "Apunta `cur['next']` de vuelta a `prev`, luego avanza todo: `prev = cur; cur = nxt`. Cuando `cur` es None, `prev` es la nueva cabeza.",
        ],
      },
    ],
  },
  trees: {
    title: "Árboles y Recorridos de BST",
    summary: "Árboles binarios de búsqueda y recorridos in/pre/post/level-order.",
    blocks: [
      {
        markdown: `# Árboles

Un **árbol binario de búsqueda** mantiene los valores menores a la izquierda, los mayores
a la derecha — así la búsqueda es O(log n) cuando está balanceado. Los recorridos visitan
los nodos en distintos órdenes:

- **In-order** (I, nodo, D) → orden ordenado para un BST
- **Pre-order** (nodo, I, D) → copiar/serializar
- **Post-order** (I, D, nodo) → borrar/evaluar
- **Level-order** (BFS) → por niveles`,
      },
      {
        title: "Recorrido in-order",
        caption: "In-order sobre un BST produce los valores en orden ascendente.",
      },
      { title: "Level-order (BFS)" },
      {
        title: "Recorrido in-order",
        prompt:
          "Un nodo es `{'val': v, 'left': L, 'right': R}` (los hijos pueden ser None). Devuelve la lista de valores en **in-order**.",
        hints: [
          "Caso base: un subárbol vacío (`root is None`) aporta una lista vacía `[]`.",
          "In-order significa: todo del subárbol IZQUIERDO, luego el valor de este nodo, luego todo del subárbol DERECHO.",
          "Recurre y concatena: `inorder(root['left']) + [root['val']] + inorder(root['right'])`.",
        ],
      },
    ],
  },
  heaps: {
    title: "Heaps y Colas de Prioridad",
    summary: "Un árbol que mantiene el mínimo (o máximo) en la raíz en O(log n).",
    blocks: [
      {
        markdown: `# Heaps

Un **heap binario** es un árbol completo donde cada padre es ≤ sus hijos (min-heap). El
mínimo siempre está en la raíz, e insertar/extraer son **O(log n)** vía *sift-up* /
*sift-down*. Se almacena compactamente en un array: los hijos de \`i\` viven en \`2i+1\` y
\`2i+2\`.

El módulo \`heapq\` de Python convierte cualquier lista en un min-heap:

\`\`\`python
import heapq
h = []
heapq.heappush(h, 5)
heapq.heappop(h)       # el más pequeño
heapq.nsmallest(3, xs) # los k más pequeños
\`\`\``,
      },
      {
        title: "Construyendo un min-heap",
        caption: "Cada inserción añade al final, luego hace sift-up mientras sea menor que su padre.",
      },
      {
        title: "k más pequeños",
        prompt: "Devuelve los `k` valores más pequeños de `nums`, ordenados ascendente. Usa `heapq`.",
        hints: [
          "`heapq.nsmallest(k, nums)` devuelve los k más pequeños (más o menos sin orden).",
          "Envuélvelo en `sorted(...)` para devolverlos ascendente.",
        ],
      },
    ],
  },
  graphs: {
    title: "Grafos — BFS y DFS",
    summary: "Recorre redes en anchura y en profundidad.",
    blocks: [
      {
        markdown: `# Recorrido de Grafos

Un **grafo** son nodos + aristas, a menudo guardado como lista de adyacencia
\`{node: [neighbors]}\`.

- **BFS** usa una **cola** (FIFO) → explora nivel por nivel (camino más corto en grafos
  no ponderados).
- **DFS** usa una **pila**/recursión (LIFO) → se sumerge profundo antes de retroceder.`,
      },
      {
        title: "Búsqueda en Anchura (BFS)",
        caption: "La cola mantiene la frontera; los nodos visitados se ponen verdes.",
      },
      {
        title: "Búsqueda en Profundidad (DFS)",
        caption: "DFS usa una pila — se sumerge lo más profundo posible primero.",
      },
      {
        title: "Nodos alcanzables (BFS)",
        prompt:
          "Dado un dict de adyacencia `graph` y un nodo `start`, devuelve el **set** de todos los nodos alcanzables desde `start` (incluyendo `start`).",
        hints: [
          "Rastrea un set `seen` (empiézalo con `start`) y una lista de trabajo de nodos por explorar (empiézala con `[start]`).",
          "Saca un nodo, luego mira sus vecinos vía `graph.get(node, [])` — el default de `.get` maneja nodos sin aristas salientes.",
          "Añade cada vecino no visto a `seen` y a la lista de trabajo. Cuando la lista se vacía, `seen` es tu respuesta.",
        ],
      },
    ],
  },
  dijkstra: {
    title: "Grafos Ponderados y Dijkstra",
    summary: "Caminos más cortos cuando las aristas tienen costos.",
    blocks: [
      {
        markdown: `# El algoritmo de Dijkstra

Cuando las aristas tienen **pesos** (costos), BFS ya no encuentra el camino más corto.
**Dijkstra** fija codiciosamente el nodo no visitado más cercano, luego **relaja** sus
aristas (mejora la distancia tentativa de un vecino si pasar por este nodo es más barato).
Un min-heap mantiene a mano el siguiente nodo más cercano → O((V+E) log V).

\`\`\`python
import heapq
dist = {n: float("inf") for n in graph}
dist[start] = 0
pq = [(0, start)]
while pq:
    d, u = heapq.heappop(pq)
    for v, w in graph[u]:
        if d + w < dist[v]:
            dist[v] = d + w
            heapq.heappush(pq, (dist[v], v))
\`\`\``,
      },
      {
        title: "Caminos más cortos desde A",
        caption: "Amarillo = nodo fijándose; la etiqueta sobre cada nodo es su mejor distancia.",
      },
      {
        title: "Distancias más cortas",
        prompt:
          "`graph` mapea cada nodo a una lista de aristas `[neighbor, weight]`. Devuelve un dict de la **distancia más corta** desde `start` a cada nodo (usa `float('inf')` para los inalcanzables). Usa Dijkstra con `heapq`.",
        hints: [
          "Inicia cada distancia en infinito excepto `dist[start] = 0`.",
          "Saca el nodo más cercano de un heap; sáltalo si ya encontraste algo mejor.",
          "Relaja cada arista: si `d + w < dist[v]`, actualiza y haz push de `(dist[v], v)`.",
        ],
      },
    ],
  },
  tries: {
    title: "Tries (Árboles de Prefijos)",
    summary: "Un árbol de caracteres para búsquedas de prefijo rápidas.",
    blocks: [
      {
        markdown: `# Tries

Un **trie** guarda cadenas por carácter a lo largo de las aristas del árbol, así los
prefijos compartidos comparten nodos. Las búsquedas y comprobaciones de prefijo corren en
O(longitud de la palabra), independiente de cuántas palabras haya. Un trie simple en Python
son solo dicts anidados:

\`\`\`python
trie = {}
for ch in "cat":
    trie = trie.setdefault(ch, {})
trie["$"] = True   # marca el fin de una palabra
\`\`\``,
      },
      { title: "Construir y consultar un trie" },
      {
        title: "Búsqueda por prefijo",
        prompt:
          "Implementa `build(words)` (un trie de dicts anidados) y `has_prefix(trie, prefix)` que devuelva `True` si alguna palabra guardada empieza con `prefix`.",
        hints: [
          "En `build`, recorre/crea un nodo dict anidado por carácter con `setdefault`.",
          "En `has_prefix`, sigue cada carácter; si falta uno, devuelve False.",
          "Llegar al fin del prefijo sin fallo significa True.",
        ],
      },
    ],
  },
  "dynamic-programming": {
    title: "Intro a Programación Dinámica",
    summary: "Memoización y tablas bottom-up.",
    blocks: [
      {
        markdown: `# Programación Dinámica

La DP resuelve problemas con **subproblemas solapados** guardando resultados.

- **Memoización** (top-down): cachea resultados recursivos.
- **Tabulación** (bottom-up): rellena una tabla iterativamente.

Recuerda que el árbol de recursión de \`fib\` recalculaba las mismas llamadas — la DP lo
arregla, convirtiendo O(2ⁿ) en O(n).`,
      },
      { title: "Fibonacci bottom-up" },
      {
        title: "Subir escaleras",
        prompt:
          "Puedes subir 1 o 2 escalones a la vez. Devuelve el número de formas distintas de llegar al escalón `n` (n ≥ 0). Es Fibonacci disfrazado.",
        hints: [
          "Las formas de llegar al escalón n = ways(n-1) + ways(n-2) — es Fibonacci.",
          "Rastrea los dos últimos valores y avánzalos en un bucle.",
          "Base: hay 1 forma de estar en el escalón 0.",
        ],
      },
    ],
  },
  "dp-coin-change": {
    title: "DP — Cambio de Monedas",
    summary: "Tabla bottom-up para el clásico problema de mínimo de monedas.",
    blocks: [
      {
        markdown: `# Cambio de Monedas (DP bottom-up)

Dadas denominaciones de monedas y un \`amount\` objetivo, encuentra el **mínimo de monedas**
que suman a él. Construye una tabla donde \`dp[a]\` = mínimo de monedas para formar el monto \`a\`:

- \`dp[0] = 0\`; todo lo demás empieza en "infinito".
- Para cada monto \`a\`, prueba cada moneda \`c ≤ a\`: \`dp[a] = min(dp[a], dp[a-c] + 1)\`.
- Si \`dp[amount]\` sigue siendo infinito, es imposible → devuelve -1.`,
      },
      { title: "Rellenando la tabla dp" },
      {
        title: "Cambio de monedas",
        prompt:
          "Devuelve el **número mínimo de monedas** que suman a `amount`, o `-1` si es imposible. `coins` son denominaciones positivas.",
        hints: [
          "Haz un array dp de tamaño amount+1, dp[0]=0, el resto un 'infinito' grande.",
          "Para cada monto a, relaja con cada moneda: dp[a] = min(dp[a], dp[a-c]+1).",
          "Si dp[amount] sigue en 'infinito' al final, devuelve -1.",
        ],
      },
      {
        title: "Complejidad y patrones — practica hasta el reflejo",
        cards: [
          { front: "Big-O de búsqueda en dict/set", back: "Promedio **O(1)** (tabla hash). Peor caso O(n) con colisiones patológicas, pero trátalo como O(1)." },
          { front: "Complejidad de búsqueda binaria", back: "**O(log n)** — reduce a la mitad el espacio en cada paso. Requiere entrada **ordenada**." },
          { front: "Ganancia de dos punteros / ventana deslizante", back: "Convierte un escaneo O(n²) de pares/subarrays en **O(n)** moviendo punteros en vez de reiniciar." },
          { front: "Hash map como patrón", back: "Cambia espacio por tiempo: guarda valores vistos → búsqueda O(1). Resuelve two-sum, duplicados, group-by en una pasada." },
          { front: "BFS vs DFS", back: "BFS usa una **cola** → camino más corto en grafos no ponderados, orden por niveles. DFS usa una **pila/recursión** → explorar profundo, backtracking, orden topológico." },
          { front: "¿Cuándo es programación dinámica?", back: "Subproblemas solapados + subestructura óptima. Cachea subresultados (memoiza) o rellena una tabla dp bottom-up (cambio de monedas, subir escaleras)." },
          { front: "Las dos partes obligatorias de la recursión", back: "Un **caso base** (detiene la recursión) y un **paso recursivo** sobre una entrada estrictamente menor. Sin caso base → desbordamiento de pila." },
        ],
      },
    ],
  },
  "dp-knapsack": {
    title: "DP — Mochila 0/1",
    summary: "Maximiza valor bajo un presupuesto de peso, tomando cada objeto a lo sumo una vez.",
    blocks: [
      {
        markdown: `# Mochila 0/1 (0/1 Knapsack)

Tienes objetos, cada uno con un **peso** y un **valor**, y una mochila que aguanta a lo
sumo \`W\` de peso. Maximiza el valor total, tomando **cada objeto a lo sumo una vez** (eso
es el "0/1").

Usa una tabla 1-D donde \`dp[w]\` = mejor valor alcanzable con capacidad \`w\`:

- Empieza \`dp = [0, 0, …, 0]\` (tamaño \`W+1\`).
- Para cada objeto, recorre la capacidad **de \`W\` hacia abajo hasta el peso del objeto**:
  \`dp[w] = max(dp[w], dp[w - weight] + value)\`.

> **¿Por qué recorrer la capacidad al revés?** Ir de alto a bajo asegura que \`dp[w - weight]\`
> todavía se refiere a la fila *antes* de este objeto — así cada objeto se usa a lo sumo una
> vez. De izquierda a derecha dejaría elegir un objeto repetidamente (esa es la mochila *sin
> límite*).`,
      },
      { title: "Rellenando la tabla de la mochila" },
      {
        question: "En la mochila 0/1 con tabla 1-D, ¿por qué recorremos la capacidad de alto a bajo?",
        options: [
          "Para que cada objeto se cuente a lo sumo una vez — el orden inverso mantiene dp[w-weight] en el estado del objeto anterior.",
          "Es más rápido que de bajo a alto.",
          "Para evitar desbordamiento de enteros.",
          "El orden no importa; cualquiera funciona.",
        ],
        explanation:
          "De izquierda a derecha leería un valor dp ya actualizado para el objeto actual, dejando tomarlo varias veces (mochila sin límite). De derecha a izquierda preserva el estado anterior, imponiendo la regla 0/1.",
      },
      {
        title: "Mochila 0/1",
        prompt:
          "Devuelve el **valor total máximo** que puedes cargar dados `weights`, `values` (misma longitud) y capacidad `W`, tomando cada objeto a lo sumo una vez.",
        hints: [
          "Haz `dp = [0]*(W+1)`.",
          "Para cada objeto i, recorre `w` de `W` hacia abajo hasta `weights[i]` y relaja `dp[w] = max(dp[w], dp[w-weights[i]] + values[i])`.",
          "La respuesta es `dp[W]`.",
        ],
      },
    ],
  },
  "dp-lis": {
    title: "DP — Subsecuencia Creciente Más Larga",
    summary: "Longitud de la subsecuencia estrictamente creciente más larga con una tabla O(n²).",
    blocks: [
      {
        markdown: `# Subsecuencia Creciente Más Larga (LIS)

Dado un array, encuentra la longitud de la subsecuencia **estrictamente creciente** más
larga (los elementos mantienen su orden pero no tienen que ser contiguos).

Sea \`dp[i]\` = la longitud de la subsecuencia creciente más larga **que termina en el
índice \`i\`**. Cada elemento por sí solo es una subsecuencia de longitud 1, así que empieza
todo en \`dp[i] = 1\`, luego:

\`\`\`
dp[i] = 1 + max(dp[j] para cada j < i donde a[j] < a[i])
\`\`\`

La respuesta es \`max(dp)\`. Esto es **O(n²)** (una variante de patience-sorting llega a O(n log n)).`,
      },
      { title: "Construyendo el array dp" },
      {
        question: "En esta DP, ¿qué representa `dp[i]`?",
        options: [
          "La longitud de la subsecuencia creciente más larga que termina en el índice i.",
          "El valor del elemento más grande visto hasta ahora.",
          "El número de elementos menores que a[i].",
          "La subsecuencia más larga que empieza en el índice 0.",
        ],
        explanation:
          "Anclar la subsecuencia en su último elemento (índice i) da la recurrencia limpia dp[i] = 1 + max(dp[j]) sobre elementos menores anteriores. La respuesta global es max(dp).",
      },
      {
        title: "Longitud de la LIS",
        prompt:
          "Devuelve la longitud de la subsecuencia estrictamente creciente más larga de `nums`. Una lista vacía tiene longitud `0`.",
        hints: [
          "Protege la lista vacía primero: `if not nums: return 0`.",
          "Inicia `dp = [1]*len(nums)`; para cada i, mira atrás a cada j<i con `nums[j] < nums[i]`.",
          "Devuelve `max(dp)`.",
        ],
      },
    ],
  },
  "dp-edit-distance": {
    title: "DP — Distancia de Edición",
    summary: "Mínimas ediciones insertar/borrar/reemplazar entre dos cadenas con una tabla 2-D.",
    blocks: [
      {
        markdown: `# Distancia de Edición (Levenshtein)

El número mínimo de **inserciones, borrados o reemplazos** de un carácter para convertir
la cadena \`a\` en la cadena \`b\`.

Usa una tabla 2-D donde \`dp[i][j]\` = ediciones para convertir los primeros \`i\` caracteres
de \`a\` en los primeros \`j\` de \`b\`:

- Casos base: \`dp[i][0] = i\` (borrar todo), \`dp[0][j] = j\` (insertar todo).
- Si los caracteres actuales coinciden (\`a[i-1] == b[j-1]\`): \`dp[i][j] = dp[i-1][j-1]\` (gratis).
- Si no, paga 1 por el más barato de los tres movimientos:
  \`dp[i][j] = 1 + min(dp[i-1][j]\` (borrar), \`dp[i][j-1]\` (insertar), \`dp[i-1][j-1]\` (reemplazar)\`)\`.

La respuesta es \`dp[len(a)][len(b)]\`.`,
      },
      { title: "Rellenando la tabla 2-D" },
      {
        question: "Cuando los caracteres actuales coinciden, el movimiento de la DP es…",
        options: [
          "Arrastrar la diagonal gratis: dp[i][j] = dp[i-1][j-1].",
          "Sumar 1 a la diagonal: dp[i][j] = 1 + dp[i-1][j-1].",
          "Tomar el mínimo de los tres vecinos más 1.",
          "Reiniciar dp[i][j] a 0.",
        ],
        explanation:
          "Los caracteres que coinciden no cuestan nada, así que heredas el subproblema de la diagonal. Solo pagas 1 (y tomas el mín de borrar/insertar/reemplazar) cuando los caracteres difieren.",
      },
      {
        title: "Distancia de edición",
        prompt:
          "Devuelve la **distancia de edición** de Levenshtein entre las cadenas `a` y `b` (mín. ediciones insertar/borrar/reemplazar).",
        hints: [
          "Construye `dp` de tamaño `(len(a)+1) x (len(b)+1)`; rellena la primera fila/columna con 0..n y 0..m.",
          "Coincidencia → diagonal; diferencia → `1 + min(arriba, izquierda, diagonal)`.",
          "Devuelve `dp[len(a)][len(b)]`.",
        ],
      },
    ],
  },
  "big-o": {
    title: "Complejidad Big-O",
    summary: "Razona sobre cómo crecen el tiempo y el espacio con el tamaño de la entrada.",
    blocks: [
      {
        markdown: `# Big-O: cómo crece el costo

Big-O describe cómo crece el trabajo de un algoritmo a medida que el tamaño de la entrada
\`n\` se hace grande — ignorando constantes y términos de menor orden. Se trata de
**crecimiento**, no de segundos de cronómetro.

| Clase | Nombre | Ejemplo |
|---|---|---|
| \`O(1)\` | constante | búsqueda en dict/set, indexar un array |
| \`O(log n)\` | logarítmica | búsqueda binaria, operaciones en árbol balanceado |
| \`O(n)\` | lineal | una pasada sobre una lista |
| \`O(n log n)\` | linearítmica | buenos ordenamientos (merge, heap, Timsort) |
| \`O(n²)\` | cuadrática | bucle anidado sobre todos los pares |
| \`O(2ⁿ)\` | exponencial | subconjuntos/recursión ingenua sin memo |
| \`O(n!)\` | factorial | permutaciones por fuerza bruta |

**Leyendo código:** un bucle sobre \`n\` es \`O(n)\`; un bucle dentro de otro es \`O(n²)\`;
partir el problema a la mitad en cada paso (\`n → n/2 → …\`) es \`O(log n)\`. Quédate con el
término **dominante**: \`O(n² + n)\` es solo \`O(n²)\`.

**La complejidad de espacio** cuenta la memoria extra de la misma forma — una tabla dp de
tamaño \`n\` es \`O(n)\` de espacio; una tabla 2-D es \`O(n·m)\`. **Amortizado** promedia el
costo sobre muchas operaciones (un \`append\` a una lista de Python es \`O(1)\` amortizado aunque
ocasionalmente redimensione).`,
      },
      { title: "Misma respuesta, distinto crecimiento" },
      {
        question:
          "Una función recorre la lista, y dentro de ese bucle corre un segundo bucle sobre toda la lista. Su complejidad temporal es…",
        options: ["O(n²)", "O(n)", "O(n log n)", "O(log n)"],
        explanation:
          "n iteraciones, cada una haciendo n trabajo → n·n = O(n²). Una sola pasada es O(n); reducir la entrada a la mitad repetidamente es O(log n).",
      },
      {
        question: "¿Qué describe el crecimiento cuando un algoritmo reduce la entrada a la mitad en cada paso?",
        options: ["O(log n)", "O(n)", "O(n²)", "O(1)"],
        explanation:
          "Reducir a la mitad repetidamente llega a 1 en unos log₂(n) pasos — el sello de la búsqueda binaria y las operaciones en árbol balanceado.",
      },
      {
        title: "Comprobación de duplicados en tiempo lineal",
        prompt:
          "Devuelve `True` si `nums` contiene algún duplicado, si no `False` — en tiempo **O(n)** usando un set.",
        hints: [
          "Un `set` da pruebas de pertenencia O(1).",
          "Compara `len(set(nums))` con `len(nums)`, o construye el set mientras escaneas y devuelve temprano ante un repetido.",
        ],
      },
    ],
  },
};
