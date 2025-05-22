try:
    from sui_python_sdk.sui_crypto import SuiKeyPair
    print('Import successful')
except ImportError as e:
    print(f'Import failed: {e}')
