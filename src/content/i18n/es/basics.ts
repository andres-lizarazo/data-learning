import type { LessonI18n } from "../overlay";

// Spanish overlay for the "Python Basics" module. Keyed by lesson id; each `blocks` array
// is parallel to the English lesson's blocks (index-matched). Only text is translated —
// code, tests and solutions come from the English source.
export const basicsEs: Record<string, LessonI18n> = {
  "variables-and-types": {
    title: "Variables y Tipos",
    summary: "Cómo Python guarda datos: enteros, flotantes, cadenas, booleanos, None.",
    blocks: [
      {
        markdown: `# Variables y Tipos

Una **variable** es un nombre que apunta a un valor. Python es de *tipado dinámico*: no
declaras el tipo, simplemente asignas.

\`\`\`python
age = 30          # int (entero)
price = 19.99     # float (flotante)
name = "Ada"      # str (cadena)
is_member = True  # bool (booleano)
nothing = None    # NoneType
\`\`\`

Usa \`type(x)\` para inspeccionar el tipo de un valor. Ejecuta el código de abajo 👇`,
      },
      { title: "Inspeccionar tipos" },
      {
        markdown: `### Mira la asignación paso a paso

Pulsa **Visualizar** y avanza. Fíjate cómo cada variable aparece en el panel de
**Variables** justo cuando se ejecuta su línea.`,
      },
      { title: "Las variables cobran vida" },
      {
        question: "¿Cuál es el tipo de `3 / 2` en Python 3?",
        options: ["int", "float", "str", "Lanza un error"],
        explanation:
          "La división real `/` siempre devuelve un float; usa `//` para división entera.",
      },
      {
        title: "Área de un rectángulo",
        prompt:
          "Escribe una función `area(width, height)` que devuelva el área de un rectángulo.",
      },
    ],
  },
  operators: {
    title: "Operadores y Expresiones",
    summary: "Operadores aritméticos, de comparación y booleanos.",
    blocks: [
      {
        markdown: `# Operadores

| Categoría | Operadores |
|---|---|
| Aritméticos | \`+  -  *  /  //  %  **\` |
| Comparación | \`==  !=  <  <=  >  >=\` |
| Booleanos | \`and  or  not\` |

\`//\` es división entera, \`%\` es módulo (resto), \`**\` es potencia.`,
      },
      { title: "Prueba los operadores" },
      {
        title: "Par o impar",
        prompt: 'Devuelve la cadena `"even"` (par) o `"odd"` (impar) para un entero `n`.',
        hints: [
          "Un número es par cuando el resto de dividir entre 2 es cero: `n % 2 == 0`.",
          'Puedes elegir entre dos valores en una línea con una expresión condicional: `"even" if n % 2 == 0 else "odd"`.',
        ],
      },
    ],
  },
  strings: {
    title: "Cadenas (Strings)",
    summary: "Rebanado (slicing), métodos y f-strings.",
    blocks: [
      {
        markdown: `# Cadenas

Las cadenas son secuencias *inmutables* de caracteres. Indexa con \`[]\`, rebana con
\`[inicio:fin:paso]\` y formatea con **f-strings**.

\`\`\`python
s = "python"
s[0]      # 'p'
s[-1]     # 'n'
s[1:4]    # 'yth'
s[::-1]   # 'nohtyp'  (invertida)
\`\`\`

Métodos comunes: \`.upper() .lower() .strip() .split() .replace() .join()\`.`,
      },
      { title: "Rebanar y transformar" },
      {
        title: "Comprobar palíndromo",
        prompt:
          "Devuelve `True` si `text` se lee igual al derecho y al revés (ignora mayúsculas/minúsculas).",
        hints: [
          "Normaliza primero las mayúsculas para que 'Level' cuente — pásalo todo a minúsculas con `text.lower()`.",
          "Invierte una cadena con el slice `t[::-1]`; entonces un palíndromo es simplemente `t == t[::-1]`.",
        ],
      },
    ],
  },
  conditionals: {
    title: "Condicionales",
    summary: "if / elif / else y veracidad (truthiness).",
    blocks: [
      {
        markdown: `# Condicionales

\`\`\`python
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
else:
    grade = "C"
\`\`\`

**Veracidad (truthiness):** las cosas vacías (\`0\`, \`""\`, \`[]\`, \`{}\`, \`None\`) son
*falsy*; casi todo lo demás es *truthy*.`,
      },
      { title: "Sigue la rama" },
      {
        title: "FizzBuzz (un valor)",
        prompt:
          'Devuelve `"FizzBuzz"` si es divisible entre 15, `"Fizz"` entre 3, `"Buzz"` entre 5, o si no el número como cadena.',
        hints: [
          "Comprueba la divisibilidad entre 15 PRIMERO — si no, 15 entra demasiado pronto en el caso del 3.",
          "Usa el operador módulo: `n % 3 == 0` significa divisible entre 3.",
          "Si ninguno coincide, devuelve el número como cadena con `str(n)`.",
        ],
      },
    ],
  },
  loops: {
    title: "Bucles — míralos fluir",
    summary: "Bucles for y while, range, break/continue — visualizado.",
    blocks: [
      {
        markdown: `# Bucles

Los bucles repiten trabajo. Un \`for\` itera sobre una secuencia; un \`while\` corre
mientras se cumpla una condición.

\`\`\`python
for i in range(5):     # 0,1,2,3,4
    print(i)

while n > 0:
    n -= 1
\`\`\`

La mejor forma de *entender* un bucle es **verlo correr**. Avanza por los ejemplos de
abajo y observa cómo cambian el contador y el acumulador en cada iteración.`,
      },
      { title: "bucle for: sumar números" },
      { title: "bucle while: cuenta atrás con break" },
      {
        markdown: `### Bucles anidados

Un bucle dentro de otro multiplica las iteraciones. Observa cómo se mueven los dos
contadores a la vez.`,
      },
      { title: "bucle anidado: tabla de multiplicar" },
      {
        question: "¿Cuántas veces se ejecuta el cuerpo de `for i in range(2, 10, 2)`?",
        options: ["8", "4", "5", "10"],
        explanation: "range(2,10,2) → 2,4,6,8 → 4 valores.",
      },
      {
        title: "Suma de una lista",
        prompt: "Sin usar `sum()`, devuelve el total de todos los números en `nums`.",
        hints: [
          "Empieza con un acumulador en 0 antes del bucle.",
          "Recorre cada valor con `for x in nums:` y súmalo al acumulador.",
          "Devuelve el acumulador después de que termine el bucle (no dentro de él).",
        ],
      },
    ],
  },
  functions: {
    title: "Funciones",
    summary: "Parámetros, valores de retorno, valores por defecto, *args/**kwargs.",
    blocks: [
      {
        markdown: `# Funciones

Las funciones empaquetan lógica reutilizable. Reciben **parámetros** y \`return\`
(devuelven) un valor.

\`\`\`python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

greet("Ada")                 # 'Hello, Ada!'
greet("Ada", greeting="Hi")  # 'Hi, Ada!'
\`\`\`

\`*args\` recoge argumentos posicionales extra en una tupla; \`**kwargs\` recoge
argumentos con nombre extra en un diccionario.`,
      },
      { title: "Llamar a una función (mira la profundidad de la pila de llamadas)" },
      {
        title: "Máximo de tres",
        prompt: "Devuelve el mayor de tres números `a, b, c` (sin usar `max`).",
        hints: [
          "Asume que el primer valor es el mayor por ahora: `m = a`.",
          "Compara los otros dos contra `m` uno a uno, actualizando `m` cuando encuentres algo mayor (`if b > m: m = b`).",
        ],
      },
    ],
  },
  comprehensions: {
    title: "Comprehensions",
    summary: "Comprehensions de listas, diccionarios y sets — construir datos de forma concisa.",
    blocks: [
      {
        markdown: `# Comprehensions

Una forma compacta de construir colecciones.

\`\`\`python
[x*x for x in range(5)]              # [0, 1, 4, 9, 16]
[x for x in range(10) if x % 2 == 0] # pares
{c: ord(c) for c in "abc"}           # dict comp
{x % 3 for x in range(10)}           # set comp -> {0,1,2}
\`\`\``,
      },
      { title: "Construir colecciones" },
      {
        title: "Cuadrados de los pares",
        prompt:
          "Usando una comprehension, devuelve una lista con los cuadrados de los números pares de `nums`.",
        hints: [
          "Una list comprehension puede transformar y filtrar a la vez: `[expr for x in nums if condición]`.",
          "Quédate solo con los pares con `if x % 2 == 0`, y eleva al cuadrado cada valor con `x*x`.",
        ],
      },
    ],
  },
  errors: {
    title: "Errores y Excepciones",
    summary: "try/except/finally y lanzar errores.",
    blocks: [
      {
        markdown: `# Errores y Excepciones

Maneja errores con elegancia usando \`try\`/\`except\`:

\`\`\`python
try:
    value = int(user_input)
except ValueError:
    value = 0
finally:
    print("done")   # siempre se ejecuta
\`\`\`

Lanza los tuyos con \`raise ValueError("mensaje")\`.`,
      },
      { title: "Capturar un error" },
      {
        title: "Parseo seguro de entero",
        prompt: "Devuelve el valor entero de `s`, o `default` si no se puede parsear.",
        hints: [
          "Envuelve la conversión `int(s)` en un `try` para que una cadena inválida no rompa la función.",
          "`int('oops')` lanza `ValueError` e `int(None)` lanza `TypeError` — captura ambos y `return default`. (Nota: `int('3.5')` también lanza, así que también cae al default.)",
        ],
      },
      {
        title: "Fundamentos de Python — datos clave",
        cards: [
          { front: "`//` vs `/`", back: "`/` es división flotante (`7/2 == 3.5`); `//` es división entera (`7//2 == 3`). `%` es el resto." },
          { front: "Invertir una cadena/lista", back: "Rebana con paso -1: `s[::-1]`. Funciona para cualquier secuencia." },
          { front: '`"even" if n % 2 == 0 else "odd"`', back: "Una expresión condicional (ternaria): `A if cond else B` — elige un valor en línea sin un bloque if completo." },
          { front: "Veracidad de contenedores vacíos", back: "`[]`, `{}`, `\"\"`, `0` y `None` son todos falsy. Los contenedores no vacíos y los números distintos de cero son truthy." },
          { front: "try / except / finally", back: "`try` ejecuta código riesgoso; `except AlgúnError` maneja un fallo concreto; `finally` siempre se ejecuta (limpieza), haya error o no." },
          { front: "f-string", back: "`f\"{name} is {age}\"` interpola expresiones dentro de `{}`. Añade `:.2f` para 2 decimales, `!r` para repr()." },
        ],
      },
    ],
  },
};
