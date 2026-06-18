import type { Module } from "../../types/lesson";

// Intro to machine learning with scikit-learn — runs real sklearn in the browser via
// Pyodide. "starter" breadth: the core supervised-learning workflow.
export const ml: Module = {
  id: "ml",
  title: "Intro to ML (scikit-learn)",
  blurb: "Train/test split, fit a model, measure accuracy — in the browser.",
  level: "Advanced",
  icon: "🤖",
  status: "starter",
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
  ],
};
