import sys
import types
import joblib


def compat_load(path):
    """Load a joblib pkl saved in Kaggle notebook context (__mp_main__)."""
    from services.preprocessor import LoanPreprocessor

    for mod_name in ('__mp_main__', '__main__'):
        if mod_name not in sys.modules:
            sys.modules[mod_name] = types.ModuleType(mod_name)
        sys.modules[mod_name].LoanPreprocessor = LoanPreprocessor

    return joblib.load(path)
