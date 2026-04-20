import os
import json
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.metrics import (
    roc_auc_score, roc_curve, precision_score,
    recall_score, f1_score, confusion_matrix
)
from lightgbm import LGBMClassifier
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE

try:
    from services.preprocessor import LoanPreprocessor
except ModuleNotFoundError:
    from backend.services.preprocessor import LoanPreprocessor

BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, '..', 'data', 'cs-training.csv')
MODELS_DIR = os.path.join(BASE_DIR, '..', 'models')


class ModelTrainer:
    def train(self) -> dict:
        os.makedirs(MODELS_DIR, exist_ok=True)

        df = pd.read_csv(DATA_PATH, index_col=0)

        preprocessor = LoanPreprocessor()
        df_processed = preprocessor.fit_transform(df)

        TARGET = 'SeriousDlqin2yrs'
        feature_cols = [c for c in df_processed.columns if c != TARGET]

        X = df_processed[feature_cols]
        y = df_processed[TARGET]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, stratify=y, random_state=42
        )

        smote = SMOTE(random_state=42, k_neighbors=5)
        X_train_bal, y_train_bal = smote.fit_resample(X_train, y_train)

        n_neg = (y_train == 0).sum()
        n_pos = (y_train == 1).sum()
        ratio = n_neg / n_pos

        lgbm = LGBMClassifier(
            n_estimators=500, learning_rate=0.05, max_depth=6,
            num_leaves=31, class_weight='balanced',
            random_state=42, n_jobs=-1, verbose=-1
        )
        lgbm.fit(X_train_bal, y_train_bal)

        rf = RandomForestClassifier(
            n_estimators=300, max_depth=8, min_samples_leaf=5,
            class_weight='balanced', random_state=42, n_jobs=-1
        )
        rf.fit(X_train_bal, y_train_bal)

        xgb = XGBClassifier(
            n_estimators=400, learning_rate=0.05, max_depth=5,
            scale_pos_weight=ratio, eval_metric='auc',
            random_state=42, n_jobs=-1, verbosity=0
        )
        xgb.fit(X_train_bal, y_train_bal)

        ensemble = VotingClassifier(
            estimators=[('lgbm', lgbm), ('rf', rf), ('xgb', xgb)],
            voting='soft', weights=[2, 1, 1]
        )
        ensemble.fit(X_train_bal, y_train_bal)

        joblib.dump(lgbm,     os.path.join(MODELS_DIR, 'lgbm_model.pkl'))
        joblib.dump(rf,       os.path.join(MODELS_DIR, 'rf_model.pkl'))
        joblib.dump(xgb,      os.path.join(MODELS_DIR, 'xgb_model.pkl'))
        joblib.dump(ensemble, os.path.join(MODELS_DIR, 'ensemble_model.pkl'))
        joblib.dump(X_train_bal, os.path.join(MODELS_DIR, 'X_train_reference.pkl'))
        joblib.dump(feature_cols, os.path.join(MODELS_DIR, 'feature_columns.pkl'))

        y_prob = ensemble.predict_proba(X_test)[:, 1]
        y_pred = (y_prob >= 0.35).astype(int)

        train_prob = ensemble.predict_proba(X_train)[:, 1]

        auc = roc_auc_score(y_test, y_prob)
        train_auc = roc_auc_score(y_train, train_prob)
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        ks = float(np.max(tpr - fpr))

        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = cm.ravel()

        feat_imp = dict(zip(
            feature_cols,
            [float(v) for v in lgbm.feature_importances_]
        ))

        metrics = {
            'train_auc':  round(float(train_auc), 4),
            'test_auc':   round(float(auc), 4),
            'gini':       round(float(2 * auc - 1), 4),
            'ks_statistic': round(ks, 4),
            'precision':  round(float(precision_score(y_test, y_pred)), 4),
            'recall':     round(float(recall_score(y_test, y_pred)), 4),
            'f1':         round(float(f1_score(y_test, y_pred)), 4),
            'confusion_matrix': {
                'TP': int(tp), 'FP': int(fp), 'TN': int(tn), 'FN': int(fn)
            },
            'feature_importances': feat_imp
        }

        with open(os.path.join(MODELS_DIR, 'metrics.json'), 'w') as f:
            json.dump(metrics, f, indent=2)

        return metrics
