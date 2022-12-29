# helpers for training and evaluating models on data collected for this project
from sklearn.model_selection import train_test_split


def train_val_test_split(X, y, random_state=2022):
    """
    Creates a split of input data into train/test/val parts, according to the following strategy:
    1. randomly pick 80% of original data for "temporary train" split and 20% for (final) test split
    2. randomly pick 80% of "temporary train" split for training and remaining 20% for validation split

    The splits are stratified as well (i.e., we have same target frequency distributions between train, test, and validation)

    Returns X_train, X_val, X_test and y_train, y_val, y_test
    """
    X_train_and_val, X_test, y_train_and_val, y_test = train_test_split(
        X, y, random_state=random_state, test_size=0.2, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_and_val,
        y_train_and_val,
        random_state=random_state,
        test_size=0.2,
        stratify=y_train_and_val,
    )

    return X_train, X_val, X_test, y_train, y_val, y_test
