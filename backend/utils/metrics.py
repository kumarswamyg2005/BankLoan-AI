import numpy as np
from sklearn.metrics import roc_curve


def compute_ks(y_true, y_prob) -> float:
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    return float(np.max(tpr - fpr))


def compute_gini(auc: float) -> float:
    return 2 * auc - 1
