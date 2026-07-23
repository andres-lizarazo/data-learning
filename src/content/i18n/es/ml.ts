import type { LessonI18n } from "../overlay";

// Spanish overlay for the "Intro to ML (scikit-learn)" module. Index-matched; text-only.
export const mlEs: Record<string, LessonI18n> = {
  "ml-workflow": {
    title: "El Flujo de ML",
    summary: "Divide los datos, ajusta un modelo, evalúalo.",
    blocks: [
      {
        markdown: `# El flujo de aprendizaje supervisado

1. **Divide** los datos en train/test para medir sobre ejemplos no vistos.
2. **Ajusta** (fit) un modelo sobre el conjunto de entrenamiento.
3. **Predice** sobre el conjunto de test y **evalúa** (p. ej. accuracy).

> La primera ejecución instala scikit-learn en Pyodide — puede tardar un poco la primera vez.`,
      },
      { title: "Entrenar y evaluar un clasificador" },
      {
        title: "Accuracy (exactitud)",
        prompt:
          "Devuelve la **accuracy** de clasificación (fracción de aciertos) de `y_pred` vs `y_true`. Usa `sklearn.metrics.accuracy_score`.",
        hints: [
          "`accuracy_score(y_true, y_pred)` devuelve la fracción de etiquetas que coinciden.",
          "Solo llámala y devuelve el resultado.",
        ],
      },
    ],
  },
  classification: {
    title: "Ajustar un Clasificador",
    summary: "Entrena un árbol de decisión y predice nuevas etiquetas.",
    blocks: [
      {
        markdown: `# Ajustar un clasificador

Cada estimador de scikit-learn sigue la misma API: \`.fit(X, y)\` para aprender, luego
\`.predict(X)\` para etiquetar datos nuevos. \`X\` es un array 2-D (filas = muestras, columnas =
características); \`y\` es la etiqueta por fila.`,
      },
      { title: "Árbol de decisión sobre datos separables" },
      {
        title: "Predecir una etiqueta",
        prompt:
          "Entrena un `DecisionTreeClassifier(random_state=0)` sobre `X_train`/`y_train` y devuelve la etiqueta predicha (como `int`) para la única muestra `x` (una lista de características).",
        hints: [
          "Ajusta el clasificador: `clf = DecisionTreeClassifier(random_state=0).fit(X_train, y_train)`.",
          "`predict` espera una entrada 2-D — envuelve la muestra: `clf.predict([x])`.",
          "Devuelve `int(...)` de la primera predicción.",
        ],
      },
    ],
  },
  regression: {
    title: "Regresión y sus Métricas",
    summary: "Predice valores continuos con LinearRegression; puntúa con MAE, RMSE y R².",
    blocks: [
      {
        markdown: `# Regresión: predecir números

La clasificación predice una **etiqueta** (spam / no spam). La **regresión** predice un
**número continuo** — un precio, una temperatura, una duración.

La API es idéntica — \`.fit(X, y)\` y luego \`.predict(X)\` — pero \`y\` ahora es de valor
real, y puntúas con métricas de regresión en vez de accuracy:

| Métrica | Significado | Notas |
|---|---|---|
| **MAE** | error absoluto medio | mismas unidades que \`y\`, robusto a outliers |
| **MSE** | error cuadrático medio | penaliza más los errores grandes |
| **RMSE** | √MSE | de vuelta en las unidades de \`y\` |
| **R²** | fracción de varianza explicada | 1.0 = perfecto, 0 = igual que la media |

Una \`LinearRegression\` aprende un coeficiente por característica más un intercepto,
ajustando \`ŷ = intercepto + Σ coef_i · x_i\`.`,
      },
      { title: "Ajusta una recta y lee sus métricas" },
      {
        question: "Tu modelo reporta R² = 0.0 en el test. ¿Qué significa?",
        options: [
          "El modelo predice perfectamente.",
          "El modelo no es mejor que predecir siempre la media de y.",
          "La mitad de las predicciones son correctas.",
          "R² nunca puede ser 0, así que es un bug.",
        ],
        explanation:
          "R² compara tu modelo con una baseline que siempre predice ȳ. R²=1 es perfecto, R²=0 empata la baseline de la media, y R² incluso puede ser negativo cuando el modelo es peor que la media.",
      },
      {
        title: "Raíz del error cuadrático medio (RMSE)",
        prompt:
          "Devuelve el **RMSE** entre `y_true` y `y_pred`. Usa `sklearn.metrics.mean_squared_error` y saca la raíz cuadrada.",
        hints: [
          "`mean_squared_error(y_true, y_pred)` te da el MSE.",
          "El RMSE es simplemente la raíz cuadrada: `mse ** 0.5`.",
        ],
      },
    ],
  },
  "preprocessing-pipelines": {
    title: "Preprocesamiento y Pipelines",
    summary: "Escala características sin fugas, y encadena pasos en un solo Pipeline.",
    blocks: [
      {
        markdown: `# Escala características, evita fugas, encadena con Pipelines

Muchos modelos (regresión logística, SVMs, k-NN) asumen que las características viven en una
**escala similar**. \`StandardScaler\` reescala cada columna a media 0, std 1.

**La trampa de la fuga (leakage):** debes hacer \`fit\` del scaler **solo sobre el conjunto de
entrenamiento**, luego aplicarlo al test. Ajustar sobre todos los datos deja que las
estadísticas del test se filtren al entrenamiento e infla tu puntuación.

Un **\`Pipeline\`** empaqueta preprocesamiento + modelo en un solo estimador. Llamar a \`.fit\`
ajusta cada paso en orden; \`.predict\` los aplica. Esto hace la fuga casi imposible — el
scaler se reajusta dentro de cada fold de entrenamiento automáticamente.

\`\`\`python
Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression())])
\`\`\`

Para datasets que mezclan columnas numéricas y categóricas, \`ColumnTransformer\` aplica un
transformador distinto a cada subconjunto de columnas.`,
      },
      { title: "Un pipeline de escalar + clasificar" },
      {
        question: "¿Cuándo deberías ajustar un StandardScaler en un flujo train/test?",
        options: [
          "Ajustar sobre todo el dataset antes de dividir.",
          "Ajustar solo sobre el train, luego transformar train y test.",
          "Ajustar por separado sobre train y sobre test.",
          "El escalado no hace falta si usas un Pipeline.",
        ],
        explanation:
          "Ajustar sobre todos los datos filtra estadísticas del test al entrenamiento. Ajusta solo sobre train. Un Pipeline lo maneja por ti: el scaler se reajusta sobre la porción de entrenamiento en cada fit/fold.",
      },
      {
        title: "Construye un clasificador escalado",
        prompt:
          "Construye un `Pipeline` de `StandardScaler` y luego `LogisticRegression(max_iter=1000)`, ajústalo sobre `X_train`/`y_train`, y devuelve la **accuracy** sobre `X_test`/`y_test`.",
        hints: [
          'Construye `Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])`.',
          "Ajústalo, luego `accuracy_score(y_test, pipe.predict(X_test))`.",
        ],
      },
    ],
  },
  "cross-validation": {
    title: "Validación Cruzada y Over/Underfitting",
    summary: "Estima el rendimiento de forma robusta con k-fold CV; diagnostica over- y underfitting.",
    blocks: [
      {
        markdown: `# Una división miente; k folds dicen la verdad

Una sola división train/test es ruidosa — una división con suerte favorece a un mal modelo.
La **validación cruzada k-fold** divide los datos en \`k\` partes, entrena en \`k-1\` y prueba
en el fold retenido, rotando por los \`k\`. Reportas la **media ± std** de las puntuaciones.

**Overfitting vs underfitting** — la tensión central:

- **Overfit:** puntuación alta en train, baja en test. El modelo memorizó ruido. Demasiado
  complejo (p. ej. un árbol de decisión sin límite). Solución: simplificar, regularizar, más datos.
- **Underfit:** puntuación baja en train *y* en test. El modelo es demasiado simple para
  capturar el patrón. Solución: añadir características, reducir regularización, modelo más rico.
- **Buen ajuste:** las puntuaciones de train y test son ambas altas y cercanas.`,
      },
      { title: "cross_val_score, y un árbol que hace overfit" },
      {
        question: "Un modelo puntúa 0.99 en train pero 0.62 en test. Esto es una señal clásica de…",
        options: [
          "Underfitting — el modelo es demasiado simple.",
          "Overfitting — el modelo memorizó los datos de entrenamiento.",
          "Fuga de datos del conjunto de test.",
          "Un modelo perfectamente sano.",
        ],
        explanation:
          "Una brecha grande train-menos-test es la firma del overfitting: el modelo capturó ruido que no generaliza. El underfitting muestra puntuaciones bajas en ambos.",
      },
      {
        title: "Diagnostica el ajuste",
        prompt:
          'Dados `train_acc` y `test_acc` (ambos entre 0 y 1), devuelve un diagnóstico:\n\n- `"overfit"` cuando el train es fuerte (≥ 0.9) pero el test se queda atrás (test < train − 0.15).\n- `"underfit"` cuando el propio train es débil (train < 0.7).\n- `"good"` en otro caso.\n\nComprueba **underfit primero**, luego overfit.',
        hints: [
          "Devuelve 'underfit' primero cuando `train_acc < 0.7` — un modelo débil es underfit sin importar la brecha.",
          "Luego 'overfit' cuando `train_acc >= 0.9 and test_acc < train_acc - 0.15`.",
          "En otro caso devuelve 'good'.",
        ],
      },
    ],
  },
  "classification-metrics": {
    title: "Métricas de Clasificación",
    summary: "Más allá de accuracy: matriz de confusión, precision, recall, F1 y ROC-AUC.",
    blocks: [
      {
        markdown: `# Cuando la accuracy miente

Con datos desbalanceados, la accuracy engaña: si el 99% de las transacciones son legítimas,
un modelo que predice "legítima" para todo puntúa 99% — y atrapa **cero** fraudes.

La **matriz de confusión** desglosa las predicciones en TP, FP, FN, TN. De ahí:

- **Precision** = TP / (TP + FP) — *de las que marqué, ¿cuántas acerté?*
- **Recall** = TP / (TP + FN) — *de los positivos reales, ¿cuántos atrapé?*
- **F1** = media armónica de precision y recall — un número que equilibra ambos.
- **ROC-AUC** — mide qué tan bien el modelo separa las clases en todos los umbrales
  (0.5 = azar, 1.0 = perfecto).

Precision vs recall es un **trade-off** que ajustas al costo de cada error: un filtro de spam
favorece precision (no descartar correo real); un tamizaje de cáncer favorece recall (no
perder un caso).`,
      },
      { title: "Matriz de confusión y reporte" },
      {
        question:
          "Construyes un detector de fraude: el fraude es raro, y perder un fraude es muy costoso. ¿Qué métrica importa más?",
        options: [
          "Accuracy — lo resume todo.",
          "Recall — atrapar tantos fraudes reales como sea posible.",
          "Precision — nunca dar una falsa alarma.",
          "R² — explica la varianza.",
        ],
        explanation:
          "Perder un fraude (un falso negativo) es el error caro, así que optimizas recall = TP/(TP+FN). La accuracy es inútil aquí porque las clases están muy desbalanceadas; R² es una métrica de regresión.",
      },
      {
        title: "Precision y recall",
        prompt:
          "Devuelve una tupla `(precision, recall)` para la clase positiva (etiqueta `1`) usando `sklearn.metrics.precision_score` y `recall_score`.",
        hints: [
          "`precision_score(y_true, y_pred)` y `recall_score(y_true, y_pred)` usan por defecto la etiqueta positiva 1.",
          "Devuélvelos como tupla: `(precision_score(...), recall_score(...))`.",
        ],
      },
      {
        title: "Métricas de ML y validación — repaso rápido",
        cards: [
          { front: "Accuracy", back: "(TP + TN) / todas las predicciones. Engañosa con datos desbalanceados." },
          { front: "Precision", back: "TP / (TP + FP). De las que marqué positivas, ¿cuántas acerté?" },
          { front: "Recall (sensibilidad)", back: "TP / (TP + FN). De los positivos reales, ¿cuántos atrapé?" },
          { front: "F1 score", back: "Media armónica de precision y recall — equilibra ambos en un número." },
          { front: "R²", back: "Fracción de varianza explicada. 1 = perfecto, 0 = empata la baseline de la media, puede ser negativo." },
          { front: "RMSE", back: "√(error cuadrático medio). En las mismas unidades que y; penaliza los errores grandes." },
          { front: "Overfitting", back: "Puntuación alta en train, baja en test. El modelo memorizó ruido → simplificar / regularizar / más datos." },
          { front: "Underfitting", back: "Puntuación baja en train Y test. Modelo demasiado simple → modelo más rico / más características / menos regularización." },
          { front: "Validación cruzada k-fold", back: "Divide en k folds, entrena en k−1 prueba en 1, rota. Reporta media ± std — más robusto que una sola división." },
          { front: "Fuga de datos (escalado)", back: "Ajusta el scaler solo sobre el train. Un Pipeline lo reajusta por fold automáticamente." },
        ],
      },
    ],
  },
};
