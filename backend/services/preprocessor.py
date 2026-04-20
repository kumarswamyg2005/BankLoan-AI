import os
import numpy as np
import pandas as pd
import joblib

MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')


class LoanPreprocessor:
    def __init__(self):
        self.income_median = None
        self.age_median = None
        self.iqr_bounds = {}
        self.feature_columns = None

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        self.income_median = df['MonthlyIncome'].median()
        self.age_median = df['age'].median()
        df['MonthlyIncome'] = df['MonthlyIncome'].fillna(self.income_median)
        df['NumberOfDependents'] = df['NumberOfDependents'].fillna(0)
        df['age'] = df['age'].fillna(self.age_median).clip(18, 100).astype(int)

        numeric_cols = [
            'RevolvingUtilizationOfUnsecuredLines', 'DebtRatio',
            'MonthlyIncome', 'NumberOfOpenCreditLinesAndLoans',
            'NumberRealEstateLoansOrLines', 'NumberOfDependents'
        ]
        for col in numeric_cols:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower = Q1 - 1.5 * IQR
            upper = Q3 + 1.5 * IQR
            self.iqr_bounds[col] = (lower, upper)
            df[col] = df[col].clip(lower, upper)

        df = self._engineer_features(df)
        self.feature_columns = [c for c in df.columns if c != 'SeriousDlqin2yrs']

        os.makedirs(MODELS_DIR, exist_ok=True)
        joblib.dump(self, os.path.join(MODELS_DIR, 'preprocessor.pkl'))
        return df

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df['MonthlyIncome'] = df['MonthlyIncome'].fillna(self.income_median)
        df['NumberOfDependents'] = df['NumberOfDependents'].fillna(0)
        df['age'] = df['age'].fillna(self.age_median).clip(18, 100).astype(int)

        for col, (lower, upper) in self.iqr_bounds.items():
            if col in df.columns:
                df[col] = df[col].clip(lower, upper)

        df = self._engineer_features(df)
        return df

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df['DebtToIncome'] = df['DebtRatio'] * df['MonthlyIncome']

        late_cols = [
            'NumberOfTime30-59DaysPastDueNotWorse',
            'NumberOfTime60-89DaysPastDueNotWorse',
            'NumberOfTimes90DaysLate'
        ]
        existing_late = [c for c in late_cols if c in df.columns]
        df['LatePaymentTotal'] = df[existing_late].sum(axis=1)
        df['CreditUtilizationRisk'] = df['RevolvingUtilizationOfUnsecuredLines']
        df['IncomePerDependent'] = df['MonthlyIncome'] / (df['NumberOfDependents'] + 1)

        age_bins = [0, 25, 35, 50, 65, 200]
        age_labels = [0, 1, 2, 3, 4]
        df['AgeGroup'] = pd.cut(
            df['age'], bins=age_bins, labels=age_labels
        ).cat.add_categories([-1]).fillna(-1).astype(int)
        return df
