import os
from threading import Lock
import numpy as np
import pandas as pd
import joblib
import shap

try:
    from services.preprocessor import LoanPreprocessor
    from services.ood_detector import OODDetector
    from utils.compat_unpickler import compat_load
except ModuleNotFoundError:
    from backend.services.preprocessor import LoanPreprocessor
    from backend.services.ood_detector import OODDetector
    from backend.utils.compat_unpickler import compat_load

MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
_PREDICTOR = None
_PREDICTOR_LOCK = Lock()

_EXPLANATIONS = {
    'LatePaymentTotal':                         ("late payments", "on-time payment record"),
    'NumberOfTimes90DaysLate':                  ("90+ day late payments", "no severe delinquencies"),
    'NumberOfTime30-59DaysPastDueNotWorse':      ("30-59 day late payments", "no minor delinquencies"),
    'NumberOfTime60-89DaysPastDueNotWorse':      ("60-89 day late payments", "no moderate delinquencies"),
    'RevolvingUtilizationOfUnsecuredLines':      ("high credit card utilization", "low credit utilization"),
    'CreditUtilizationRisk':                     ("high credit utilization risk", "healthy credit utilization"),
    'DebtRatio':                                 ("high debt-to-income ratio", "manageable debt ratio"),
    'DebtToIncome':                              ("high total debt burden", "low total debt burden"),
    'MonthlyIncome':                             ("lower monthly income", "strong monthly income"),
    'IncomePerDependent':                        ("low income per dependent", "good income per dependent"),
    'age':                                       ("age factor", "age factor"),
    'AgeGroup':                                  ("age group factor", "age group factor"),
    'NumberOfOpenCreditLinesAndLoans':           ("many open credit lines", "healthy credit mix"),
    'NumberRealEstateLoansOrLines':              ("real estate loan count", "real estate ownership"),
    'NumberOfDependents':                        ("number of dependents", "dependent count"),
}


class LoanPredictor:
    def __init__(self):
        self.ensemble = joblib.load(os.path.join(MODELS_DIR, 'ensemble_model.pkl'))
        self.lgbm = joblib.load(os.path.join(MODELS_DIR, 'lgbm_model.pkl'))
        self.preprocessor: LoanPreprocessor = compat_load(os.path.join(MODELS_DIR, 'preprocessor.pkl'))
        self.feature_cols: list = joblib.load(os.path.join(MODELS_DIR, 'feature_columns.pkl'))
        self.explainer = shap.TreeExplainer(self.lgbm)
        self.ood = OODDetector()

    def predict(self, customer_data: dict) -> dict:
        # Map frontend snake_case keys to dataset column names
        key_map = {
            'NumberOfTime30_59DaysPastDueNotWorse': 'NumberOfTime30-59DaysPastDueNotWorse',
            'NumberOfTime60_89DaysPastDueNotWorse': 'NumberOfTime60-89DaysPastDueNotWorse',
        }
        mapped = {key_map.get(k, k): v for k, v in customer_data.items()}

        raw_df = pd.DataFrame([mapped])
        processed = self.preprocessor.transform(raw_df)[self.feature_cols]

        default_prob = float(self.ensemble.predict_proba(processed)[0][1])
        approval_prob = 1.0 - default_prob

        similarity = self.ood.get_similarity_score(processed)
        adjusted_prob = round(approval_prob * similarity['confidence_multiplier'], 4)

        risk_score = int(300 + approval_prob * 600)

        if approval_prob >= 0.65 and similarity['similarity_label'] != 'Low':
            decision = 'APPROVE'
        elif approval_prob < 0.35:
            decision = 'REJECT'
        else:
            decision = 'MANUAL_REVIEW'

        shap_vals = self.explainer.shap_values(processed)
        sv = shap_vals[1][0] if isinstance(shap_vals, list) else shap_vals[0]

        shap_list = []
        for feat, val, imp in zip(self.feature_cols, processed.iloc[0], sv):
            neg_label, pos_label = _EXPLANATIONS.get(feat, (feat, feat))
            direction = 'positive' if imp > 0 else 'negative'
            if imp > 0:
                explanation = f"{pos_label.capitalize()} positively impacts your profile"
            else:
                explanation = f"{neg_label.capitalize()} negatively impacts your profile"
            shap_list.append({
                'feature': feat,
                'value': round(float(val), 4),
                'shap_impact': round(float(imp), 4),
                'direction': direction,
                'explanation': explanation
            })

        shap_list.sort(key=lambda x: abs(x['shap_impact']), reverse=True)
        top6 = shap_list[:6]

        positive_factors = [s for s in shap_list if s['shap_impact'] > 0][:3]
        negative_factors = [s for s in shap_list if s['shap_impact'] < 0][:3]

        suggestions = self._generate_suggestions(negative_factors, mapped)

        return {
            'decision': decision,
            'approval_probability': round(approval_prob, 4),
            'adjusted_probability': adjusted_prob,
            'risk_score': risk_score,
            'decision_threshold': 0.35,
            'similarity': similarity,
            'shap_values': top6,
            'top_positive_factors': positive_factors,
            'top_negative_factors': negative_factors,
            'what_if_suggestions': suggestions
        }

    def _generate_suggestions(self, negative_factors: list, raw: dict) -> list:
        suggestions = []
        for factor in negative_factors[:2]:
            feat = factor['feature']
            val = factor['value']

            if feat == 'LatePaymentTotal':
                suggestions.append(
                    f"Clearing your {int(val)} overdue payment(s) could improve approval chances by ~15%"
                )
            elif feat in ('NumberOfTimes90DaysLate',):
                suggestions.append(
                    f"Resolving {int(val)} severe delinquency record(s) would significantly strengthen your profile"
                )
            elif feat in ('DebtRatio', 'DebtToIncome'):
                suggestions.append(
                    f"Reducing your debt ratio from {val:.2f} to below 0.40 would significantly improve your profile"
                )
            elif feat in ('RevolvingUtilizationOfUnsecuredLines', 'CreditUtilizationRisk'):
                suggestions.append(
                    f"Lowering credit card utilization from {val:.0%} to below 30% could boost your score by ~10%"
                )
            elif feat == 'MonthlyIncome':
                suggestions.append(
                    "Increasing documented monthly income or adding a co-applicant could improve eligibility"
                )
            else:
                suggestions.append(
                    f"Improving your {feat.replace('_', ' ').lower()} profile could help your application"
                )
        return suggestions


def get_predictor() -> LoanPredictor:
    global _PREDICTOR
    if _PREDICTOR is None:
        with _PREDICTOR_LOCK:
            if _PREDICTOR is None:
                _PREDICTOR = LoanPredictor()
    return _PREDICTOR


def reset_predictor_cache():
    global _PREDICTOR
    with _PREDICTOR_LOCK:
        _PREDICTOR = None
