#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
SUI Faucet Claimer
-----------------
Python version of the SUI Faucet Claimer script originally written in JavaScript.
This tool helps claim SUI tokens from the testnet faucet, supports proxy usage,
and includes captcha solving capabilities.

Original Author: Bastiar - Airdrop Laura
Converted to Python: AI Assistant
"""

import os
import sys
import json
import time
import random
import argparse
import requests
from requests.exceptions import RequestException
from urllib.parse import urlparse
import hashlib
import base64
import binascii

# Try to import necessary libraries, with helpful error messages if missing
try:
    from bip_utils import Bip39MnemonicGenerator, Bip39Languages, Bip39MnemonicValidator, Bip39SeedGenerator
except ImportError:
    print("❌ Missing dependency: bip_utils")
    print("Install with: pip install bip-utils")
    sys.exit(1)

try:
    # First try the expected import structure
    try:
        from sui_python_sdk.sui_crypto import SuiKeyPair
        from sui_python_sdk.sui_client import SuiClient
        from sui_python_sdk.sui_config import SuiConfig
        from sui_python_sdk.sui_types.address import SuiAddress
    except ImportError:
        # Try alternative import approach if the first fails
        from sui import SuiKeyPair, SuiClient, SuiConfig, SuiAddress
except ImportError:
    print("❌ Missing dependency: sui_python_sdk")
    print("Install with: pip install sui_python_sdk")
    sys.exit(1)

# Global configuration
config = {
    "captchaKey": None,
    "proxyFile": "proxies.txt",
    "delay": 15000,
    "retryDelay": 120000,
    "requestsPerIp": 1,
    "maxRetries": 3,
    "captchaUrl": "https://faucet.sui.io",
    "captchaSitekey": "0x4AAAAAAA11HKyGNZq_dUKj"
}

# State tracking
proxy_list = []
current_proxy_index = 0
requests_with_current_proxy = 0

# ====================== UTILITY FUNCTIONS ======================

def display_banner():
    """Display the tool banner in the console"""
    os.system('clear' if os.name != 'nt' else 'cls')
    print('\n')
    print('╔════════════════════════════════════════════════════════════╗')
    print('║                                                            ║')
    print('║                     🚀 AIRDROP LAURA 🚀                    ║')
    print('║                                                            ║')
    print('║                   SUI FAUCET CLAIMER                       ║')
    print('║                                                            ║')
    print('║                  Created by: Bastiar                       ║')
    print('║                                                            ║')
    print('║              📢 Channel: @AirdropLaura                     ║')
    print('║              💬 Group: @AirdropLauraDisc                   ║')
    print('║                                                            ║')
    print('╚════════════════════════════════════════════════════════════╝')
    print('\n')

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='SUI Faucet Claimer')
    parser.add_argument('-k', '--2captcha-key', dest='captcha_key', help='2Captcha API key for solving CAPTCHAs')
    parser.add_argument('-pf', '--proxy-file', default='proxies.txt', help='File containing list of proxies (one per line)')
    parser.add_argument('-d', '--delay', type=int, default=15000, help='Delay between requests in ms')
    parser.add_argument('-rd', '--retry-delay', type=int, default=120000, help='Delay after rate limit in ms')
    parser.add_argument('-c', '--config', default='config.json', help='Configuration file (optional)')
    parser.add_argument('-r', '--requests-per-ip', type=int, default=1, help='Maximum requests per IP')
    parser.add_argument('-m', '--max-retries', type=int, default=3, help='Maximum retries per wallet')
    
    args = parser.parse_args()
    
    # Update global config
    global config
    if args.captcha_key:
        config["captchaKey"] = args.captcha_key
    config["proxyFile"] = args.proxy_file
    config["delay"] = args.delay
    config["retryDelay"] = args.retry_delay
    config["requestsPerIp"] = args.requests_per_ip
    config["maxRetries"] = args.max_retries
    
    return args

def load_config(config_file=None):
    """Load configuration from JSON file"""
    global config
    if config_file is None:
        config_file = config.get("configFile", "config.json")
    
    if os.path.exists(config_file):
        try:
            with open(config_file, 'r') as f:
                file_config = json.load(f)
                # Update global config
                config.update(file_config)
            return True
        except Exception as e:
            print(f'❌ Error loading config file: {str(e)}')
            return False
    return False

def create_example_config(config_file=None):
    """Create an example configuration file"""
    global config
    if config_file is None:
        config_file = config.get("configFile", "config.json")
    
    example_config = {
        "captchaKey": "your_2captcha_api_key_here",
        "proxyFile": "proxies.txt",
        "delay": 15000,
        "retryDelay": 120000,
        "requestsPerIp": 1,
        "maxRetries": 3,
        "captchaUrl": "https://faucet.sui.io",
        "captchaSitekey": "0x4AAAAAAA11HKyGNZq_dUKj"
    }
    
    try:
        with open(config_file, 'w') as f:
            json.dump(example_config, f, indent=2)
        return True
    except Exception as e:
        print(f'❌ Error creating config file: {str(e)}')
        return False

def load_proxies(proxy_file=None):
    """Load proxies from file"""
    global config
    if proxy_file is None:
        proxy_file = config.get("proxyFile", "proxies.txt")
    
    if not os.path.exists(proxy_file):
        return []
    
    try:
        with open(proxy_file, 'r') as f:
            lines = [line.strip() for line in f if line.strip() and not line.strip().startswith('#')]
        
        # Ensure proxies have proper protocol prefix
        proxies = []
        for proxy in lines:
            if not proxy.startswith('http://') and not proxy.startswith('https://'):
                proxy = 'http://' + proxy
            proxies.append(proxy)
        
        return proxies
    except Exception as e:
        print(f'❌ Error loading proxies: {str(e)}')
        return []

def wait_for_enter(message="Press Enter to continue..."):
    """Wait for user to press Enter"""
    input(f"\n{message}")

# ====================== WALLET FUNCTIONS ======================

def parse_wallet_input(input_str):
    """Parse wallet input (mnemonic or private key) and return wallet info"""
    input_str = input_str.strip()
    try:
        # Case 1: Input is a 12-word mnemonic phrase
        if len(input_str.split()) == 12:
            words = input_str.split()
            
            # Validate the mnemonic
            is_valid = Bip39MnemonicValidator().Validate(input_str, Bip39Languages.ENGLISH)
            if not is_valid:
                print("❌ Invalid mnemonic phrase: Not all words are in BIP-39 wordlist")
                return None
            
            try:
                # Generate keypair from mnemonic
                # This part depends on how SuiKeyPair is implemented in Python
                # Using a simplified approach here
                seed_bytes = Bip39SeedGenerator(input_str).Generate()
                keypair = SuiKeyPair.from_private_key(seed_bytes[:32])
                address = keypair.get_address()
                
                return {
                    "mnemonic": input_str,
                    "address": address,
                    "keypair": keypair
                }
            except Exception as e:
                print(f'❌ Error deriving keypair from mnemonic: {str(e)}')
                return None
        
        # Case 2: Input is a 64-character hex private key
        elif len(input_str) == 64 and all(c in '0123456789abcdefABCDEF' for c in input_str):
            try:
                private_key_bytes = bytes.fromhex(input_str)
                keypair = SuiKeyPair.from_private_key(private_key_bytes)
                address = keypair.get_address()
                
                return {
                    "privateKey": input_str,
                    "address": address,
                    "keypair": keypair
                }
            except Exception as e:
                print(f'❌ Error parsing private key: {str(e)}')
                return None
        
        # Case 3: Input starts with suiprivkey1
        elif input_str.startswith('suiprivkey1'):
            try:
                # Decode the base64 part of the key
                # This implementation depends on the exact encoding used
                key_part = input_str[len('suiprivkey1'):]
                # This is a placeholder for the actual decoding implementation
                private_key_bytes = base64.b64decode(key_part)
                keypair = SuiKeyPair.from_private_key(private_key_bytes)
                address = keypair.get_address()
                
                return {
                    "suiPrivKey": input_str,
                    "address": address,
                    "keypair": keypair
                }
            except Exception as e:
                print(f'❌ Error parsing SUI private key: {str(e)}')
                return None
        
        else:
            print('❌ Invalid input format. Please provide a 12-word mnemonic, 64-character hex private key, or SUI private key format.')
            return None
    
    except Exception as e:
        print(f'❌ Error parsing wallet: {str(e)}')
        return None

def create_new_wallet():
    """Generate a new SUI wallet (mnemonic + address)"""
    # Generate mnemonic
    mnemonic = Bip39MnemonicGenerator().FromWordsNumber(12, Bip39Languages.ENGLISH)
    
    # Derive keypair
    seed_bytes = Bip39SeedGenerator(mnemonic).Generate()
    keypair = SuiKeyPair.from_private_key(seed_bytes[:32])
    address = keypair.get_address()
    
    return {
        "mnemonic": mnemonic,
        "address": address,
        "keypair": keypair
    }

def read_wallets():
    """Read wallets from wallets.txt file"""
    try:
        if not os.path.exists('wallets.txt'):
            return []

        with open('wallets.txt', 'r') as f:
            lines = [line.strip() for line in f if line.strip() and not line.strip().startswith('#')]

        wallets = []
        for line in lines:
            wallet = parse_wallet_input(line)
            if wallet:
                wallets.append(wallet)

        return wallets
        
    except Exception as e:
        print(f'❌ Error reading wallets file: {str(e)}')
        return []

# ====================== PROXY FUNCTIONS ======================

def verify_proxy(proxy):
    """Test if a proxy is working"""
    try:
        print(f'🔍 Testing proxy: {proxy.replace("//", "//").replace(":", "****").split("@")[0]}@{proxy.split("@")[1] if "@" in proxy else proxy}')
        
        session = requests.Session()
        session.proxies = {
            'http': proxy,
            'https': proxy
        }
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
        })
        
        # Test proxy by checking IP
        response = session.get('https://api.ipify.org?format=json', timeout=10)
        if response.status_code == 200 and 'ip' in response.json():
            ip = response.json()['ip']
            print(f'✅ Proxy working! IP: {ip}')
            return {
                'success': True,
                'ip': ip
            }
        else:
            print('❌ Proxy test failed: No IP returned')
            return {'success': False}
    
    except Exception as e:
        print(f'❌ Proxy test failed: {str(e)}')
        return {
            'success': False,
            'error': str(e)
        }

# ====================== CAPTCHA FUNCTIONS ======================

async def solve_captcha_with_custom_service(url, sitekey, poll_interval=3000, max_wait=120000, action='', cdata=''):
    """Solve CAPTCHA using custom service (clodpler.prayogatri.my.id)"""
    try:
        # 1. Request a new CAPTCHA task
        params = {'url': url, 'sitekey': sitekey}
        if action:
            params['action'] = action
        if cdata:
            params['cdata'] = cdata
            
        response = requests.get(
            'https://clodpler.prayogatri.my.id/turnstile',
            params=params,
            timeout=10
        )
        
        if not response.ok or not response.json() or 'task_id' not in response.json():
            print(f'❌ CAPTCHA service error (turnstile): {response.json() if response.ok else response.text}')
            return None
            
        task_id = response.json()['task_id']

        # 2. Poll for result
        start_time = time.time()
        while (time.time() - start_time) * 1000 < max_wait:
            time.sleep(poll_interval / 1000)  # Convert ms to seconds
            
            result_response = requests.get(
                'https://clodpler.prayogatri.my.id/result',
                params={'id': task_id},
                timeout=10
            )
            
            if result_response.ok and result_response.json() and 'value' in result_response.json():
                return result_response.json()['value']
            elif result_response.ok and result_response.json() and 'error' in result_response.json():
                print(f'❌ CAPTCHA service error (result): {result_response.json()["error"]}')
                break
            elif result_response.ok and result_response.json():
                print(f'❌ CAPTCHA service response (result): {result_response.json()}')
                
        raise Exception('CAPTCHA solving timed out or failed')
        
    except Exception as e:
        print(f'❌ Error solving CAPTCHA: {str(e)}')
        return None

# ====================== FAUCET FUNCTIONS ======================

async def claim_faucet(wallet, captcha_token, faucet_url='https://faucet.sui.io/gas', retry_count=0):
    """Claim tokens from SUI faucet"""
    global current_proxy_index, requests_with_current_proxy
    try:
        print('🚰 Sending faucet request...')
        
        # Get current proxy or None if no proxies configured
        proxy = proxy_list[current_proxy_index] if proxy_list else None
        
        # Setup session with proxy if available
        session = requests.Session()
        if proxy:
            session.proxies = {'http': proxy, 'https': proxy}
        
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://faucet.sui.io/',
            'Content-Type': 'application/json',
            'X-Captcha-Token': captcha_token
        })
        
        # Update proxy tracking
        if proxy:
            requests_with_current_proxy += 1
            if requests_with_current_proxy >= config['requestsPerIp']:
                current_proxy_index = (current_proxy_index + 1) % len(proxy_list)
                requests_with_current_proxy = 0
                print(f'🔄 Switching to next proxy: {current_proxy_index + 1}/{len(proxy_list)}')
        
        # Make the request to Sui faucet
        response = session.post(
            faucet_url,
            json={
                "FixedAmountRequest": {
                    "recipient": wallet['address']
                }
            },
            timeout=30
        )
        
        # Check response
        if response.ok and response.json() and 'task_id' in response.json():
            print('✅ Faucet request submitted successfully!')
            print(f'📋 Task ID: {response.json()["task_id"]}')
            
            # Check for transaction hash
            if 'tx_digest' in response.json():
                print(f'🧾 Transaction: {response.json()["tx_digest"]}')
            
            return {
                'success': True,
                'taskId': response.json()['task_id'],
                'txDigest': response.json().get('tx_digest')
            }
        else:
            print(f'⚠️ Unknown response format: {response.json() if response.ok else response.text}')
            return {'success': False, 'error': 'Unknown response format'}
    
    except requests.exceptions.RequestException as e:
        # Handle HTTP errors
        if hasattr(e, 'response') and e.response:
            status = e.response.status_code
            print(f'❌ Faucet error: {status}')
            
            # Handle rate limit errors (HTTP 429)
            if status == 429:
                print('⚠️ Rate limit exceeded. Implementing retry with backoff strategy...')
                
                if retry_count < config['maxRetries']:
                    # Calculate exponential backoff delay
                    backoff_delay = config['retryDelay'] * (2 ** retry_count)
                    print(f'🕐 Waiting {backoff_delay/1000} seconds before retry {retry_count + 1}/{config["maxRetries"]}...')
                    
                    # If we have multiple proxies, switch to the next one immediately
                    if len(proxy_list) > 1:
                        current_proxy_index = (current_proxy_index + 1) % len(proxy_list)
                        requests_with_current_proxy = 0
                        print(f'🔄 Switching to next proxy due to rate limit: {current_proxy_index + 1}/{len(proxy_list)}')
                    
                    time.sleep(backoff_delay / 1000)  # Convert ms to seconds
                    print('🔄 Retrying faucet request...')
                    return await claim_faucet(wallet, captcha_token, faucet_url, retry_count + 1)
                else:
                    print('❌ Maximum retry attempts reached. Could not complete faucet claim.')
            
            # Try to determine if it's a Vercel security checkpoint
            try:
                response_data = e.response.text
                is_security_checkpoint = (
                    'Security Checkpoint' in response_data or
                    'Vercel Security' in response_data or
                    '<!DOCTYPE html>' in response_data
                )
                
                if is_security_checkpoint:
                    print('⚠️ Detected security checkpoint. IP may be temporarily blocked.')
                
                print(f'Response data: {"HTML security page (IP blocked)" if is_security_checkpoint else response_data}')
                
                return {
                    'success': False,
                    'error': e.response.text,
                    'status': e.response.status_code,
                    'isRateLimit': status == 429,
                    'isSecurityCheckpoint': is_security_checkpoint
                }
            except:
                pass
        
        print(f'❌ Error during faucet request: {str(e)}')
        return {'success': False, 'error': str(e)}
    
    except Exception as e:
        # Handle other errors
        print(f'❌ Unexpected error: {str(e)}')
        return {'success': False, 'error': str(e)}

# ====================== MENU OPTIONS ======================

async def check_wallets():
    """Menu option 1: Check wallets"""
    print('\n╔════════════════════════════════════════╗')
    print('║            👛 CHECK WALLETS 👛          ║')
    print('╚════════════════════════════════════════╝')
    
    print('\n1. Load from wallets.txt file')
    print('2. Paste private key/mnemonic manually')
    print('3. Back to main menu')
    
    choice = input('\nSelect option (1-3): ')
    
    if choice == '1':
        await check_wallets_from_file()
    elif choice == '2':
        await check_wallet_manual()
    elif choice == '3':
        return
    else:
        print('❌ Invalid choice')
        wait_for_enter()

async def check_wallets_from_file():
    """Check wallets from wallets.txt file"""
    print('\n📁 Checking wallets from file...\n')
    
    if not os.path.exists('wallets.txt'):
        print('❌ wallets.txt file not found!')
        print('📄 Creating example wallets.txt...')
        
        example_content = """# Each line should contain either a seed phrase or private key
# Example with seed phrases:
# word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12

# Example with private keys (64 character hex):
# abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890

# Example with Sui private keys:
# suiprivkey1qqqXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Remove these examples and add your real wallets"""
        
        with open('wallets.txt', 'w') as f:
            f.write(example_content)
        
        print('✅ Example file created. Please edit wallets.txt and try again.')
        wait_for_enter()
        return

    try:
        with open('wallets.txt', 'r') as f:
            lines = [line.strip() for line in f.readlines() if line.strip() and not line.strip().startswith('#')]

        print(f'📂 Found {len(lines)} wallet entries in wallets.txt\n')

        valid_count = 0
        invalid_count = 0

        for i, line in enumerate(lines):
            wallet = parse_wallet_input(line)
            
            if wallet:
                print(f'✅ Wallet {i + 1}: {wallet["address"]}')
                valid_count += 1
            else:
                print(f'❌ Invalid wallet {i + 1}: {line[:20]}...')
                invalid_count += 1
        
        print(f'\n📊 Summary: {valid_count} valid, {invalid_count} invalid wallets')
        wait_for_enter()
    except Exception as e:
        print(f'❌ Error reading wallets file: {str(e)}')
        wait_for_enter()

async def check_wallet_manual():
    """Check a single wallet manually"""
    print('\n✏️  Paste your private key or mnemonic phrase:')
    input_str = input('> ')
    
    wallet = parse_wallet_input(input_str)
    if wallet:
        print('\n✅ Valid wallet!')
        print(f'   Address: {wallet["address"]}')
        print(f'   Type: {"Mnemonic" if "mnemonic" in wallet else "Private Key"}')
    else:
        print('\n❌ Invalid wallet format!')
        print('   Supported formats:')
        print('   - 12-word mnemonic phrase')
        print('   - 64-character hex private key')
        print('   - Sui private key (suiprivkey1...)')
    
    wait_for_enter()

async def check_proxies():
    """Menu option 2: Check proxies"""
    global config
    print('\n╔════════════════════════════════════════╗')
    print('║            🌐 CHECK PROXIES 🌐          ║')
    print('╚════════════════════════════════════════╝')
    
    proxy_file = config.get("proxyFile", "proxies.txt")
    
    if not os.path.exists(proxy_file):
        print(f'\n❌ Proxy file {proxy_file} not found!')
        print('📄 Creating example proxy file...')
        
        example_content = """# List of proxies, one per line in format: protocol://username:password@host:port
http://user1:pass1@host1.example.com:8080
http://user2:pass2@host2.example.com:8080
http://user3:pass3@host3.example.com:8080
# Add more proxies as needed"""
        
        try:
            with open(proxy_file, 'w') as f:
                f.write(example_content)
            print(f'✅ Example file created: {proxy_file}')
            print('Please edit the file with your real proxies.')
        except Exception as e:
            print(f'❌ Error creating proxy file: {str(e)}')
        
        wait_for_enter()
        return
    
    try:
        with open(proxy_file, 'r') as f:
            lines = [line.strip() for line in f if line.strip() and not line.strip().startswith('#')]
        
        print(f'\n📂 Found {len(lines)} proxy entries in {proxy_file}\n')
        
        if len(lines) == 0:
            print('❌ No valid proxy entries found!')
            print('Please add your proxies to the file.')
        else:
            for i, proxy in enumerate(lines[:5]):
                # Mask proxy for display (hide password)
                masked_proxy = proxy
                if '@' in proxy:
                    parts = proxy.split('@')
                    protocol_user = parts[0].rsplit(':', 1)[0]
                    masked_proxy = f"{protocol_user}:****@{parts[1]}"
                print(f'✅ Proxy {i + 1}: {masked_proxy}')
            
            if len(lines) > 5:
                print(f'... and {len(lines) - 5} more proxies')
        
        print(f'\n📊 Total: {len(lines)} proxies loaded')
        wait_for_enter()
    except Exception as e:
        print(f'❌ Error reading proxy file: {str(e)}')
        wait_for_enter()

async def verify_proxies():
    """Menu option 3: Verify proxy functionality"""
    print('\n╔════════════════════════════════════════╗')
    print('║        🧪 VERIFY PROXY FUNCTION 🧪      ║')
    print('╚════════════════════════════════════════╝')
    
    # Load proxies
    proxies = load_proxies()
    if not proxies:
        print('❌ No proxies found. Please add proxies to your proxy file first.')
        wait_for_enter()
        return
    
    print(f'\nFound {len(proxies)} proxies. How many do you want to test?')
    count_str = input(f'Enter number (1-{len(proxies)}), or "all": ')
    
    if count_str.lower() == 'all':
        test_count = len(proxies)
    else:
        try:
            test_count = int(count_str)
        except:
            test_count = 1
        test_count = min(test_count, len(proxies))
    
    print(f'\n🧪 Testing {test_count} out of {len(proxies)} proxies...')
    
    working = 0
    failed = 0
    results = []
    
    for i in range(test_count):
        proxy = proxies[i]
        result = verify_proxy(proxy)
        
        if result['success']:
            working += 1
            results.append({
                'proxy': proxy.replace('//', '//').replace(':', '****').split('@')[0] + '@' + proxy.split('@')[1] if '@' in proxy else proxy,
                'status': 'working',
                'ip': result['ip']
            })
        else:
            failed += 1
            results.append({
                'proxy': proxy.replace('//', '//').replace(':', '****').split('@')[0] + '@' + proxy.split('@')[1] if '@' in proxy else proxy,
                'status': 'failed',
                'error': result.get('error')
            })
        
        # Add short delay between tests
        if i < test_count - 1:
            time.sleep(1)
    
    print('\n╔════════════════════════════════════════╗')
    print('║          📊 PROXY TEST RESULTS 📊       ║')
    print('╚════════════════════════════════════════╝')
    print(f'\n✅ Working: {working}')
    print(f'❌ Failed: {failed}')
    print(f'📊 Success rate: {round((working / test_count) * 100)}%')
    
    if working == 0:
        print('\n⚠️ CRITICAL: No working proxies found! Faucet claims may fail.')
        print('   Please check your proxy list and ensure they are formatted correctly.')
        print('   Format should be: protocol://username:password@host:port')
    
    wait_for_enter()

async def check_captcha_api():
    """Menu option 4: Check Captcha API"""
    print('\n╔════════════════════════════════════════╗')
    print('║          🤖 CHECK CAPTCHA API 🤖        ║')
    print('╚════════════════════════════════════════╝')
    
    # Load current config
    load_config()
    
    if not config['captchaKey'] or config['captchaKey'] == "your_2captcha_api_key_here":
        print('\n❌ No valid 2Captcha API key found!')
        print('Please update your config.json file with a valid API key.')
        
        if not os.path.exists('config.json'):
            print('\n📄 Creating example config.json...')
            create_example_config()
            print('✅ Example config created. Please edit config.json with your API key.')
        
        wait_for_enter()
        return
    
    print('\n🔍 Testing 2Captcha API...')
    captcha_key = config['captchaKey']
    print(f'API Key: {captcha_key[:10]}...{captcha_key[-4:]}')
    
    try:
        # Test API by getting balance
        response = requests.get(
            'https://2captcha.com/res.php',
            params={
                'key': captcha_key,
                'action': 'getbalance',
                'json': 1
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 1:
                print('✅ API key is valid!')
                print(f'💰 Account balance: ${data.get("request")}')
            else:
                print('❌ API key is invalid!')
                print(f'Error: {data.get("error_text") or data.get("request")}')
        else:
            print(f'❌ API request failed with status code: {response.status_code}')
    
    except Exception as e:
        print(f'❌ Error testing API: {str(e)}')
        print('Please check your internet connection and API key.')
    
    wait_for_enter()

async def check_single_balance():
    """Menu option 5: Check balance for specific wallet"""
    print('\n╔════════════════════════════════════════╗')
    print('║          💰 CHECK BALANCE 💰            ║')
    print('╚════════════════════════════════════════╝')
    
    print('\nEnter wallet address or private key/mnemonic:')
    input_str = input('> ')
    
    # Check if input is an address or private key/mnemonic
    if input_str.startswith('0x') and len(input_str) == 66:
        # It's an address
        wallet = {'address': input_str}
    else:
        # Try to parse as private key/mnemonic
        wallet = parse_wallet_input(input_str)
        if not wallet:
            print('❌ Invalid input! Please provide a valid address, private key, or mnemonic.')
            wait_for_enter()
            return
    
    print(f'\n🔍 Checking balance for: {wallet["address"]}')
    
    try:
        # Create client to interact with Sui
        client = SuiClient(SuiConfig.main_net_config())
        
        # Get balance
        balance_response = client.get_balance(wallet["address"])
        
        if balance_response:
            total_balance = int(balance_response.get('totalBalance', 0))
            sui_balance = round(total_balance / 1_000_000_000, 4)  # Convert MIST to SUI
            print(f'✅ Balance: {sui_balance} SUI')
        else:
            print('❌ Failed to get balance')
    
    except Exception as e:
        print(f'❌ Error checking balance: {str(e)}')
    
    wait_for_enter()

async def create_wallets_menu():
    """Menu option 6: Create new wallet(s)"""
    print('\n╔════════════════════════════════════════╗')
    print('║         🆕 CREATE NEW WALLET 🆕         ║')
    print('╚════════════════════════════════════════╝')
    
    count_str = input('\nHow many wallets to create? (default 1): ')
    try:
        count = int(count_str)
    except:
        count = 1
    count = max(1, count)
    
    wallets = []
    for i in range(count):
        w = create_new_wallet()
        wallets.append(w)
        print(f'\nWallet {i+1}:')
        print(f'Mnemonic : {w["mnemonic"]}')
        print(f'Address  : {w["address"]}')
    
    # Optionally save to wallets.txt, address.txt, and pk.txt
    save = input('\nSave these wallets to wallets.txt, address.txt, and pk.txt? (y/N): ')
    if save.lower() == 'y':
        mnemonic_content = ''
        addr_content = ''
        pk_content = ''
        
        for w in wallets:
            mnemonic_content += w["mnemonic"] + '\n'
            addr_content += w["address"] + '\n'
            # Get private key in hex format
            priv_key_hex = binascii.hexlify(w["keypair"].export_private_key()).decode('utf-8')
            pk_content += priv_key_hex + '\n'
        
        with open('wallets.txt', 'a') as f:
            f.write(mnemonic_content)
        with open('address.txt', 'a') as f:
            f.write(addr_content)
        with open('pk.txt', 'a') as f:
            f.write(pk_content)
            
        print('✅ Mnemonic(s) saved to wallets.txt')
        print('✅ Address(es) saved to address.txt')
        print('✅ Private key(s) saved to pk.txt')
    
    wait_for_enter()

async def reset_configuration():
    """Menu option 7: Reset configuration"""
    print('\n╔════════════════════════════════════════╗')
    print('║          🔄 RESET CONFIG 🔄             ║')
    print('╚════════════════════════════════════════╝')
    
    print('\n⚠️  This will reset all configuration files to default examples.')
    confirm = input('Are you sure? (y/N): ')
    
    if confirm.lower() != 'y':
        print('❌ Reset cancelled.')
        wait_for_enter()
        return
    
    try:
        # Reset config.json
        create_example_config()
        print('✅ config.json reset')
        
        # Reset wallets.txt
        wallet_example = """# Each line should contain either a seed phrase or private key
# Example with seed phrases:
# word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12

# Example with private keys (64 character hex):
# abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890

# Example with Sui private keys:
# suiprivkey1qqqXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Remove these examples and add your real wallets"""
        
        with open('wallets.txt', 'w') as f:
            f.write(wallet_example)
        print('✅ wallets.txt reset')
        
        # Reset proxies.txt
        proxy_example = """# List of proxies, one per line in format: protocol://username:password@host:port
http://user1:pass1@host1.example.com:8080
http://user2:pass2@host2.example.com:8080
http://user3:pass3@host3.example.com:8080
# Add more proxies as needed"""
        
        with open('proxies.txt', 'w') as f:
            f.write(proxy_example)
        print('✅ proxies.txt reset')
        
        print('\n🎉 All configuration files have been reset to examples!')
        print('Please edit them with your real data before running the claimer.')
        
    except Exception as e:
        print(f'❌ Error resetting configuration: {str(e)}')
    
    wait_for_enter()

async def run_faucet_claimer():
    """Menu option 8: Run faucet claimer"""
    print('\n╔════════════════════════════════════════╗')
    print('║          🚀 RUN FAUCET CLAIMER 🚀       ║')
    print('╚════════════════════════════════════════╝')
    
    # Track start time
    start_time = time.time()
    
    # Load config and initialize
    load_config()
    global proxy_list
    proxy_list = load_proxies()
    
    print('\n═══════════════════════════════════════════════════════════')
    print('🤖 CAPTCHA Service: Custom (clodpler.prayogatri.my.id)')
    print(f'🌐 Proxies: ✅ {len(proxy_list)} loaded')
    print(f'📊 Requests per IP: {config["requestsPerIp"]}')
    print(f'⏱️  Delay: {config["delay"]}ms')
    print(f'🔄 Retry Delay: {config["retryDelay"]}ms')
    print(f'🔁 Max Retries: {config["maxRetries"]}')
    print('═══════════════════════════════════════════════════════════')

    # Load wallets
    wallets = read_wallets()
    if not wallets:
        print('\n❌ No valid wallets found. Please check wallets.txt file.')
        wait_for_enter()
        return
    
    # Ask for target URL, sitekey, action, and cdata for CAPTCHA
    default_url = config.get('captchaUrl', 'https://faucet.sui.io')
    default_sitekey = config.get('captchaSitekey', '0x4AAAAAAA11HKyGNZq_dUKj')
    
    url = input(f'\nEnter target URL for CAPTCHA (default: {default_url}): ') or default_url
    sitekey = input(f'Enter sitekey for CAPTCHA (default: {default_sitekey}): ') or default_sitekey
    action = input('Enter action for CAPTCHA (optional, press Enter to skip): ')
    cdata = input('Enter cdata for CAPTCHA (optional, press Enter to skip): ')

    print(f'\n🚀 Starting faucet claims for {len(wallets)} wallets...')
    confirm = input('Proceed? (y/N): ')
    if confirm.lower() != 'y':
        return

    # Run faucet claims for each wallet
    results = {
        'success': 0,
        'failed': 0,
        'rateLimited': 0,
        'wallets': []
    }
    
    for i, wallet in enumerate(wallets):
        print(f'\n[{i+1}/{len(wallets)}] Wallet: {wallet["address"]}')
        
        # First check if wallet already has balance to avoid unnecessary requests
        try:
            print('🔍 Checking current balance...')
            client = SuiClient(SuiConfig.main_net_config())
            balance_response = client.get_balance(wallet["address"])
            
            if balance_response:
                total_balance = int(balance_response.get('totalBalance', 0))
                sui_balance = round(total_balance / 1_000_000_000, 4)  # Convert MIST to SUI
                print(f'💰 Current balance: {sui_balance} SUI')
                
                # Skip if balance is already significant (more than 0.05 SUI)
                if sui_balance > 0.05:
                    print('✅ Wallet already has sufficient balance, skipping faucet claim.')
                    results['wallets'].append({
                        'address': wallet["address"],
                        'status': 'skipped',
                        'balance': sui_balance,
                        'message': 'Already has balance'
                    })
                    
                    if i < len(wallets) - 1:
                        print(f'⏱️ Waiting {config["delay"]/1000} seconds before next wallet...')
                        time.sleep(config["delay"] / 1000)
                    continue
            else:
                print('⚠️ Could not get balance information.')
                
        except Exception as e:
            print(f'⚠️ Could not check balance: {str(e)}')
        
        print('🔐 Requesting CAPTCHA token...')
        captcha_token = await solve_captcha_with_custom_service(url, sitekey, 3000, 120000, action, cdata)
        
        if captcha_token and captcha_token != 'CAPTCHA_FAIL':
            print(f'✅ CAPTCHA token: {captcha_token[:40]}...')
            
            # Attempt to claim from faucet
            faucet_url = url + ('/gas' if not url.endswith('/') else 'gas')
            result = await claim_faucet(wallet, captcha_token, faucet_url)
            
            # Wait for a brief moment after claim
            time.sleep(3)
            
            # Check balance change to verify claim if successful
            balance_after = None
            
            if result['success']:
                results['success'] += 1
                try:
                    print('🔍 Checking balance after claim...')
                    client = SuiClient(SuiConfig.main_net_config())
                    balance_response = client.get_balance(wallet["address"])
                    
                    if balance_response:
                        total_balance = int(balance_response.get('totalBalance', 0))
                        balance_after = round(total_balance / 1_000_000_000, 4)  # Convert MIST to SUI
                        print(f'💰 Current balance: {balance_after} SUI')
                except Exception as e:
                    print(f'⚠️ Could not verify balance: {str(e)}')
                
                results['wallets'].append({
                    'address': wallet["address"],
                    'status': 'success',
                    'balance': balance_after,
                    'txDigest': result.get('txDigest')
                })
            else:
                if result.get('isRateLimit'):
                    results['rateLimited'] += 1
                    results['wallets'].append({
                        'address': wallet["address"],
                        'status': 'rate-limited',
                        'message': 'Rate limit exceeded'
                    })
                else:
                    results['failed'] += 1
                    results['wallets'].append({
                        'address': wallet["address"],
                        'status': 'failed',
                        'error': 'Security checkpoint' if result.get('isSecurityCheckpoint') else 'Request failed'
                    })
        else:
            print('❌ Failed to get valid CAPTCHA token, skipping wallet.')
            results['failed'] += 1
            results['wallets'].append({
                'address': wallet["address"],
                'status': 'failed',
                'error': 'CAPTCHA failed'
            })
        
        # Delay before next wallet
        if i < len(wallets) - 1:
            # Add a random delay component to avoid predictable patterns
            jitter = random.randint(0, 3000)  # 0-3 seconds of random jitter
            total_delay = config["delay"] + jitter
            
            print(f'⏱️ Waiting {total_delay/1000} seconds before next wallet...')
            time.sleep(total_delay / 1000)

    print('\n╔════════════════════════════════════════╗')
    print('║          🎯 CLAIM SUMMARY 🎯           ║')
    print('╚════════════════════════════════════════╝')
    
    # Log completion and save results
    runtime_seconds = int((time.time() - start_time))
    print(f'\n✅ Faucet claimer run complete for {len(wallets)} wallets!')
    print(f'⏱️ Total runtime: {runtime_seconds} seconds')
    print(f'\n📊 RESULTS:')
    print(f'   ✓ Success: {results["success"]}')
    print(f'   ✗ Failed: {results["failed"]}')
    print(f'   ⚠️ Rate Limited: {results["rateLimited"]}')
    
    # Save detailed results to log file
    try:
        timestamp = time.strftime('%Y-%m-%d_%H-%M-%S')
        summary_log = f"""
========================================
  SUI FAUCET CLAIM RUN - {timestamp}
========================================
Total wallets: {len(wallets)}
Success: {results['success']}
Failed: {results['failed']}
Rate limited: {results['rateLimited']}
Runtime: {runtime_seconds} seconds

DETAILED RESULTS:
"""
        
        for idx, w in enumerate(results['wallets']):
            balance_info = f" - Balance: {w.get('balance')} SUI" if w.get('balance') else ""
            message_info = f" ({w.get('message')})" if w.get('message') else ""
            error_info = f" ({w.get('error')})" if w.get('error') else ""
            
            summary_log += f"[{idx+1}] {w['address']} - {w['status'].upper()}{balance_info}{message_info}{error_info}\n"
        
        summary_log += "========================================\n"
        
        with open('claim_history.log', 'a') as f:
            f.write(summary_log)
        
        print('\n📝 Detailed results saved to claim_history.log')
    except Exception as e:
        print(f'⚠️ Could not save results to log file: {str(e)}')
    
    # Provide tips based on results
    if results['rateLimited'] > 0:
        print('\n⚠️ RATE LIMITING DETECTED:')
        print(f'   • Try increasing the delay between requests (current: {config["delay"]/1000}s)')
        print('   • Add more proxies to rotate through different IPs')
        print('   • Reduce the number of wallets claimed in a single session')
    
    wait_for_enter()

# ====================== MAIN MENU ======================

async def show_main_menu():
    """Display the main menu and handle user choices"""
    while True:
        display_banner()
        
        print('╔════════════════════════════════════════╗')
        print('║              📋 MAIN MENU 📋            ║')
        print('╚════════════════════════════════════════╝')
        print('')
        print('1. 👛 Check Wallets')
        print('2. 🌐 Check Proxies')
        print('3. 🧪 Verify Proxies')
        print('4. 🤖 Check API Captcha')
        print('5. 🚀 Run Faucet Claimer')
        print('6. 💰 Check Balance')
        print('7. 🆕 Create New Wallet(s)')
        print('8. 🔄 Reset Configuration')
        print('9. ❌ Cancel/Exit')
        print('')
        
        choice = input('Select option (1-9): ')
        
        if choice == '1':
            await check_wallets()
        elif choice == '2':
            await check_proxies()
        elif choice == '3':
            await verify_proxies()
        elif choice == '4':
            await check_captcha_api()
        elif choice == '5':
            await run_faucet_claimer()
        elif choice == '6':
            await check_single_balance()
        elif choice == '7':
            await create_wallets_menu()
        elif choice == '8':
            await reset_configuration()
        elif choice == '9':
            print('\n👋 Thank you for using Airdrop Laura!')
            print('💬 Join our Telegram: @AirdropLaura | @AirdropLauraDisc')
            print('🔗 Website: https://airdroplaura.com')
            sys.exit(0)
        else:
            print('❌ Invalid choice. Please select 1-9.')
            wait_for_enter()

# ====================== MAIN FUNCTION ======================

def main():
    """Initialize and start the program"""
    # Create config file if it doesn't exist
    if not os.path.exists('config.json'):
        create_example_config()
    
    # Parse command line arguments
    parse_arguments()
    
    # Import asyncio and run the main menu
    import asyncio
    
    try:
        asyncio.run(show_main_menu())
    except KeyboardInterrupt:
        print('\n\n👋 Program terminated by user. Goodbye!')
        sys.exit(0)
    except Exception as e:
        print(f'\n❌ Unexpected error: {str(e)}')
        sys.exit(1)

if __name__ == "__main__":
    main()
