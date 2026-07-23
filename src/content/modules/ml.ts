import type { Module } from "../../types/lesson";

// Intro to machine learning with scikit-learn — runs real sklearn in the browser via
// Pyodide. Covers the full supervised-learning arc: workflow, classification,
// regression, preprocessing/pipelines, model validation, and evaluation metrics.
export const ml: Module = {
  id: "ml",
  title: "Intro to ML (scikit-learn)",
  blurb: "Fit, tune and evaluate real models — regression, pipelines, cross-validation and metrics.",
  level: "Advanced",
  icon: "🤖",
  status: "deep",
  lessons: [
    {
      id: "ml-workflow",
      title: "The ML Workflow",
      summary: "Split data, fit a model, evaluate it.",
      minutes: 13,
      blocks: [
        {
          kind: "prose",
          markdown: `# The supervised-learning workflow

1. **Split** data into train/test so you can measure on unseen examples.
2. **Fit** a model on the training set.
3. **Predict** on the test set and **evaluate** (e.g. accuracy).

> The first run installs scikit-learn into Pyodide — this can take a while the first time.`,
        },
        {
          kind: "runnable",
          title: "Train & evaluate a classifier",
          packages: ["scikit-learn"],
          code: `from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score

X, y = load_iris(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0)

clf = DecisionTreeClassifier(random_state=0).fit(Xtr, ytr)
pred = clf.predict(Xte)

print("train/test sizes:", len(Xtr), len(Xte))
print("accuracy:", round(accuracy_score(yte, pred), 3))`,
        },
        {
          kind: "challenge",
          title: "Accuracy score",
          prompt:
            "Return the classification **accuracy** (fraction correct) of `y_pred` vs `y_true`. Use `sklearn.metrics.accuracy_score`.",
          packages: ["scikit-learn"],
          starterCode: `from sklearn.metrics import accuracy_score

def accuracy(y_true, y_pred):
    pass`,
          tests: [
            { name: "3/4", assertion: "assert accuracy([1,0,1,1], [1,0,0,1]) == 0.75" },
            { name: "perfect", assertion: "assert accuracy([0,1], [0,1]) == 1.0" },
            { name: "none", assertion: "assert accuracy([1,1], [0,0]) == 0.0", hidden: true },
          ],
          hints: [
            "`accuracy_score(y_true, y_pred)` returns the fraction of matching labels.",
            "Just call it and return the result.",
          ],
          solution: `from sklearn.metrics import accuracy_score

def accuracy(y_true, y_pred):
    return accuracy_score(y_true, y_pred)`,
          xp: 70,
        },
      ],
    },
    {
      id: "classification",
      title: "Fitting a Classifier",
      summary: "Train a decision tree and predict new labels.",
      minutes: 11,
      blocks: [
        {
          kind: "prose",
          markdown: `# Fitting a classifier

Every scikit-learn estimator follows the same API: \`.fit(X, y)\` to learn, then
\`.predict(X)\` to label new data. \`X\` is a 2-D array (rows = samples, columns =
features); \`y\` is the label per row.`,
        },
        {
          kind: "runnable",
          title: "Decision tree on separable data",
          packages: ["scikit-learn"],
          code: `from sklearn.tree import DecisionTreeClassifier

X = [[0], [1], [2], [10], [11], [12]]
y = [0, 0, 0, 1, 1, 1]
clf = DecisionTreeClassifier(random_state=0).fit(X, y)
print(clf.predict([[1], [11]]))   # -> [0 1]`,
        },
        {
          kind: "challenge",
          title: "Predict a label",
          prompt:
            "Train a `DecisionTreeClassifier(random_state=0)` on `X_train`/`y_train` and return the predicted label (as an `int`) for the single sample `x` (a feature list).",
          packages: ["scikit-learn"],
          starterCode: `from sklearn.tree import DecisionTreeClassifier

def predict_label(X_train, y_train, x):
    pass`,
          tests: [
            {
              name: "high → 1",
              assertion:
                "assert predict_label([[0],[1],[10],[11]], [0,0,1,1], [10]) == 1",
            },
            {
              name: "low → 0",
              assertion:
                "assert predict_label([[0],[1],[10],[11]], [0,0,1,1], [0]) == 0",
            },
          ],
          hints: [
            "Fit the classifier: `clf = DecisionTreeClassifier(random_state=0).fit(X_train, y_train)`.",
            "`predict` expects a 2-D input — wrap the sample: `clf.predict([x])`.",
            "Return `int(...)` of the first prediction.",
          ],
          solution: `from sklearn.tree import DecisionTreeClassifier

def predict_label(X_train, y_train, x):
    clf = DecisionTreeClassifier(random_state=0).fit(X_train, y_train)
    return int(clf.predict([x])[0])`,
          xp: 80,
        },
      ],
    },
    {
      id: "regression",
      title: "Regression & Its Metrics",
      summary: "Predict continuous values with LinearRegression; score with MAE, RMSE and R².",
      minutes: 14,
      blocks: [
        {
          kind: "prose",
          markdown: `# Regression: predicting numbers

Classification predicts a **label** (spam / not spam). **Regression** predicts a
**continuous number** — a price, a temperature, a duration.

The API is identical — \`.fit(X, y)\` then \`.predict(X)\` — but \`y\` is now real-valued,
and you score with regression metrics instead of accuracy:

| Metric | Meaning | Notes |
|---|---|---|
| **MAE** | mean absolute error | same units as \`y\`, robust to outliers |
| **MSE** | mean squared error | penalizes large errors more |
| **RMSE** | √MSE | back in the units of \`y\` |
| **R²** | fraction of variance explained | 1.0 = perfect, 0 = no better than the mean |

A \`LinearRegression\` learns a coefficient per feature plus an intercept, fitting
\`ŷ = intercept + Σ coef_i · x_i\`.`,
        },
        {
          kind: "runnable",
          title: "Fit a line and read its metrics",
          packages: ["scikit-learn"],
          code: `import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# y is roughly 3*x + 2 with a little noise
X = np.array([[0], [1], [2], [3], [4], [5]])
y = np.array([2.1, 4.9, 8.2, 10.8, 14.1, 17.0])

model = LinearRegression().fit(X, y)
pred = model.predict(X)

print("coef:", round(float(model.coef_[0]), 2), " intercept:", round(float(model.intercept_), 2))
print("MAE :", round(mean_absolute_error(y, pred), 3))
print("RMSE:", round(mean_squared_error(y, pred) ** 0.5, 3))
print("R2  :", round(r2_score(y, pred), 4))`,
        },
        {
          kind: "quiz",
          question:
            "Your model reports R² = 0.0 on the test set. What does that mean?",
          options: [
            { text: "The model predicts perfectly." },
            {
              text: "The model is no better than always predicting the mean of y.",
              correct: true,
            },
            { text: "Half the predictions are correct." },
            { text: "R² can never be 0, so it's a bug." },
          ],
          explanation:
            "R² compares your model to a baseline that always predicts ȳ. R²=1 is perfect, R²=0 ties the mean baseline, and R² can even go negative when the model is worse than the mean.",
        },
        {
          kind: "challenge",
          title: "Root mean squared error",
          prompt:
            "Return the **RMSE** between `y_true` and `y_pred`. Use `sklearn.metrics.mean_squared_error` and take the square root.",
          packages: ["scikit-learn"],
          starterCode: `from sklearn.metrics import mean_squared_error

def rmse(y_true, y_pred):
    pass`,
          tests: [
            { name: "off by 1", assertion: "assert rmse([0, 0, 0], [1, 1, 1]) == 1.0" },
            { name: "perfect", assertion: "assert rmse([1, 2, 3], [1, 2, 3]) == 0.0" },
            {
              name: "mixed",
              assertion: "assert round(rmse([2, 4, 6], [1, 4, 9]), 4) == 1.8257",
              hidden: true,
            },
          ],
          hints: [
            "`mean_squared_error(y_true, y_pred)` gives you the MSE.",
            "RMSE is just the square root: `mse ** 0.5`.",
          ],
          solution: `from sklearn.metrics import mean_squared_error

def rmse(y_true, y_pred):
    return mean_squared_error(y_true, y_pred) ** 0.5`,
          xp: 80,
        },
      ],
    },
    {
      id: "preprocessing-pipelines",
      title: "Preprocessing & Pipelines",
      summary: "Scale features without leaking, and chain steps into one Pipeline.",
      minutes: 15,
      blocks: [
        {
          kind: "prose",
          markdown: `# Scale features, avoid leakage, chain with Pipelines

Many models (logistic regression, SVMs, k-NN) assume features live on a **similar
scale**. \`StandardScaler\` rescales each column to mean 0, std 1.

**The leakage trap:** you must \`fit\` the scaler on the **training set only**, then
apply it to the test set. Fitting on all the data lets test-set statistics bleed into
training and inflates your score.

A **\`Pipeline\`** bundles preprocessing + model into one estimator. Calling \`.fit\`
fits every step in order; \`.predict\` applies them. This makes leakage almost
impossible — the scaler is re-fit inside each training fold automatically.

\`\`\`python
Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression())])
\`\`\`

For datasets that mix numeric and categorical columns, \`ColumnTransformer\` applies a
different transformer to each subset of columns.`,
        },
        {
          kind: "runnable",
          title: "A scale + classify pipeline",
          packages: ["scikit-learn"],
          code: `from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score

X, y = load_iris(return_X_y=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0)

pipe = Pipeline([
    ("scale", StandardScaler()),
    ("clf", LogisticRegression(max_iter=1000)),
])
pipe.fit(Xtr, ytr)                       # scaler fit on train only — no leakage
print("accuracy:", round(accuracy_score(yte, pipe.predict(Xte)), 3))`,
        },
        {
          kind: "quiz",
          question:
            "When should you fit a StandardScaler for a train/test workflow?",
          options: [
            {
              text: "Fit on the whole dataset before splitting.",
            },
            {
              text: "Fit on the training set only, then transform both train and test.",
              correct: true,
            },
            { text: "Fit separately on train and on test." },
            { text: "Scaling isn't needed if you use a Pipeline." },
          ],
          explanation:
            "Fitting on all the data leaks test statistics into training. Fit on train only. A Pipeline handles this for you: the scaler is re-fit on the training portion inside each fit/fold.",
        },
        {
          kind: "challenge",
          title: "Build a scaled classifier",
          prompt:
            "Build a `Pipeline` of `StandardScaler` then `LogisticRegression(max_iter=1000)`, fit it on `X_train`/`y_train`, and return the **accuracy** on `X_test`/`y_test`.",
          packages: ["scikit-learn"],
          starterCode: `from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score

def pipeline_accuracy(X_train, y_train, X_test, y_test):
    pass`,
          tests: [
            {
              name: "separable → 1.0",
              assertion:
                "assert pipeline_accuracy([[0],[1],[10],[11]], [0,0,1,1], [[2],[9]], [0,1]) == 1.0",
            },
            {
              name: "returns a fraction",
              assertion:
                "assert 0.0 <= pipeline_accuracy([[0],[1],[10],[11]], [0,0,1,1], [[0],[11]], [0,1]) <= 1.0",
              hidden: true,
            },
          ],
          hints: [
            'Construct `Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])`.',
            "Fit it, then `accuracy_score(y_test, pipe.predict(X_test))`.",
          ],
          solution: `from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score

def pipeline_accuracy(X_train, y_train, X_test, y_test):
    pipe = Pipeline([
        ("scale", StandardScaler()),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    pipe.fit(X_train, y_train)
    return accuracy_score(y_test, pipe.predict(X_test))`,
          xp: 90,
        },
      ],
    },
    {
      id: "cross-validation",
      title: "Cross-Validation & Over/Underfitting",
      summary: "Estimate performance robustly with k-fold CV; diagnose over- and underfitting.",
      minutes: 15,
      blocks: [
        {
          kind: "prose",
          markdown: `# One split lies; k folds tell the truth

A single train/test split is noisy — a lucky split flatters a bad model.
**k-fold cross-validation** splits the data into \`k\` parts, trains on \`k-1\` and tests
on the held-out fold, rotating through all \`k\`. You report the **mean ± std** of the
scores.

**Overfitting vs underfitting** — the core tension:

- **Overfit:** high training score, low test score. The model memorized noise. Too
  complex (e.g. an unbounded decision tree). Fix: simplify, regularize, more data.
- **Underfit:** low training *and* low test score. The model is too simple to capture
  the pattern. Fix: add features, reduce regularization, use a richer model.
- **Good fit:** train and test scores are both high and close together.`,
        },
        {
          kind: "runnable",
          title: "cross_val_score, and a tree that overfits",
          packages: ["scikit-learn"],
          code: `from sklearn.datasets import load_iris
from sklearn.model_selection import cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier

X, y = load_iris(return_X_y=True)

scores = cross_val_score(LogisticRegression(max_iter=1000), X, y, cv=5)
print("CV scores:", [round(s, 3) for s in scores])
print("mean %.3f  std %.3f" % (scores.mean(), scores.std()))

# An unbounded tree fits training perfectly but generalizes worse.
deep = DecisionTreeClassifier(random_state=0).fit(X, y)
print("deep tree train accuracy:", round(deep.score(X, y), 3))   # ~1.0 = memorized`,
        },
        {
          kind: "quiz",
          question:
            "A model scores 0.99 on training data but 0.62 on the test set. This is a classic sign of…",
          options: [
            { text: "Underfitting — the model is too simple." },
            { text: "Overfitting — the model memorized the training data.", correct: true },
            { text: "Data leakage from the test set." },
            { text: "A perfectly healthy model." },
          ],
          explanation:
            "A large train-minus-test gap is the signature of overfitting: the model captured noise it can't generalize. Underfitting instead shows low scores on both.",
        },
        {
          kind: "challenge",
          title: "Diagnose the fit",
          prompt:
            "Given a `train_acc` and `test_acc` (both between 0 and 1), return a diagnosis:\n\n- `\"overfit\"` when training is strong (≥ 0.9) but test lags badly (test < train − 0.15).\n- `\"underfit\"` when training itself is weak (train < 0.7).\n- `\"good\"` otherwise.\n\nCheck **underfit first**, then overfit.",
          starterCode: `def diagnose(train_acc, test_acc):
    pass`,
          tests: [
            { name: "overfit", assertion: "assert diagnose(0.99, 0.62) == 'overfit'" },
            { name: "underfit", assertion: "assert diagnose(0.55, 0.53) == 'underfit'" },
            { name: "good", assertion: "assert diagnose(0.93, 0.90) == 'good'" },
            {
              name: "weak-but-close is underfit",
              assertion: "assert diagnose(0.60, 0.58) == 'underfit'",
              hidden: true,
            },
          ],
          hints: [
            "Return 'underfit' first when `train_acc < 0.7` — a weak model is underfit regardless of the gap.",
            "Then 'overfit' when `train_acc >= 0.9 and test_acc < train_acc - 0.15`.",
            "Otherwise return 'good'.",
          ],
          solution: `def diagnose(train_acc, test_acc):
    if train_acc < 0.7:
        return "underfit"
    if train_acc >= 0.9 and test_acc < train_acc - 0.15:
        return "overfit"
    return "good"`,
          xp: 85,
        },
      ],
    },
    {
      id: "classification-metrics",
      title: "Classification Metrics",
      summary: "Beyond accuracy: confusion matrix, precision, recall, F1 and ROC-AUC.",
      minutes: 14,
      blocks: [
        {
          kind: "prose",
          markdown: `# When accuracy lies

On imbalanced data, accuracy is misleading: if 99% of transactions are legitimate,
a model that predicts "legit" for everything scores 99% — and catches **zero** fraud.

The **confusion matrix** breaks predictions into TP, FP, FN, TN. From it:

- **Precision** = TP / (TP + FP) — *of the ones I flagged, how many were right?*
- **Recall** = TP / (TP + FN) — *of the real positives, how many did I catch?*
- **F1** = harmonic mean of precision and recall — one number balancing both.
- **ROC-AUC** — ranks how well the model separates classes across all thresholds
  (0.5 = random, 1.0 = perfect).

Precision vs recall is a **trade-off** you tune to the cost of each error: a spam
filter favors precision (don't drop real mail); cancer screening favors recall
(don't miss a case).`,
        },
        {
          kind: "runnable",
          title: "Confusion matrix & report",
          packages: ["scikit-learn"],
          code: `from sklearn.metrics import confusion_matrix, classification_report

y_true = [1, 1, 1, 0, 0, 0, 0, 0]
y_pred = [1, 1, 0, 0, 0, 1, 0, 0]

print(confusion_matrix(y_true, y_pred))   # rows = actual, cols = predicted
print(classification_report(y_true, y_pred, digits=3))`,
        },
        {
          kind: "quiz",
          question:
            "You're building a fraud detector: fraud is rare, and missing a fraud is very costly. Which metric matters most?",
          options: [
            { text: "Accuracy — it summarizes everything." },
            { text: "Recall — catch as many real frauds as possible.", correct: true },
            { text: "Precision — never raise a false alarm." },
            { text: "R² — it explains the variance." },
          ],
          explanation:
            "Missing fraud (a false negative) is the expensive error, so you optimize recall = TP/(TP+FN). Accuracy is useless here because the classes are highly imbalanced; R² is a regression metric.",
        },
        {
          kind: "challenge",
          title: "Precision & recall",
          prompt:
            "Return a `(precision, recall)` tuple for the positive class (label `1`) using `sklearn.metrics.precision_score` and `recall_score`.",
          packages: ["scikit-learn"],
          starterCode: `from sklearn.metrics import precision_score, recall_score

def prec_recall(y_true, y_pred):
    pass`,
          tests: [
            {
              name: "1 TP, 1 FN",
              assertion:
                "assert prec_recall([1, 1, 0, 0], [1, 0, 0, 0]) == (1.0, 0.5)",
            },
            {
              name: "1 TP, 1 FP",
              assertion:
                "assert prec_recall([1, 0, 0, 1], [1, 1, 0, 0]) == (0.5, 0.5)",
              hidden: true,
            },
          ],
          hints: [
            "`precision_score(y_true, y_pred)` and `recall_score(y_true, y_pred)` default to the positive label 1.",
            "Return them as a tuple: `(precision_score(...), recall_score(...))`.",
          ],
          solution: `from sklearn.metrics import precision_score, recall_score

def prec_recall(y_true, y_pred):
    return (precision_score(y_true, y_pred), recall_score(y_true, y_pred))`,
          xp: 85,
        },
        {
          kind: "flashcards",
          title: "ML metrics & validation — quick recall",
          cards: [
            { front: "Accuracy", back: "(TP + TN) / all predictions. Misleading on imbalanced data." },
            { front: "Precision", back: "TP / (TP + FP). Of the ones I flagged positive, how many were right?" },
            { front: "Recall (sensitivity)", back: "TP / (TP + FN). Of the real positives, how many did I catch?" },
            { front: "F1 score", back: "Harmonic mean of precision and recall — balances both in one number." },
            { front: "R²", back: "Fraction of variance explained. 1 = perfect, 0 = ties the mean baseline, can be negative." },
            { front: "RMSE", back: "√(mean squared error). In the same units as y; penalizes large errors." },
            { front: "Overfitting", back: "High train score, low test score. Model memorized noise → simplify / regularize / more data." },
            { front: "Underfitting", back: "Low train AND test score. Model too simple → richer model / more features / less regularization." },
            { front: "k-fold cross-validation", back: "Split into k folds, train on k−1 test on 1, rotate. Report mean ± std — more robust than one split." },
            { front: "Data leakage (scaling)", back: "Fit the scaler on the training set only. A Pipeline re-fits it per fold automatically." },
          ],
        },
      ],
    },
  ],
};
