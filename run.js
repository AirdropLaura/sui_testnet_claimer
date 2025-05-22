const fs = require("fs");
const axios = require("axios");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { HttpsProxyAgent } = require("https-proxy-agent");
const readline = require('readline');

// Import dari mysten/sui.js versi 0.30.0
const { Ed25519Keypair, JsonRpcProvider, RawSigner } = require("@mysten/sui.js");
const { wordlist } = require("@scure/bip39/wordlists/english");

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Banner display
function displayBanner() {
  console.clear();
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║                     🚀 AIRDROP LAURA 🚀                    ║');
  console.log('║                                                            ║');
  console.log('║                   SUI FAUCET CLAIMER                       ║');
  console.log('║                                                            ║');
  console.log('║                  Created by: Bastiar                       ║');
  console.log('║                                                            ║');
  console.log('║              📢 Channel: @AirdropLaura                     ║');
  console.log('║              💬 Group: @AirdropLauraDisc                   ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');
}

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('2captcha-key', {
    alias: 'k',
    type: 'string',
    description: '2Captcha API key untuk menyelesaikan CAPTCHA'
  })
  .option('proxy-file', {
    alias: 'pf',
    type: 'string',
    default: 'proxies.txt',
    description: 'File yang berisi daftar proxy (satu per baris)'
  })
  .option('delay', {
    alias: 'd',
    type: 'number',
    default: 15000,
    description: 'Delay antara requests dalam ms'
  })
  .option('retry-delay', {
    alias: 'rd',
    type: 'number',
    default: 120000,
    description: 'Delay setelah rate limit dalam ms'
  })
  .option('config', {
    alias: 'c',
    type: 'string',
    default: 'config.json',
    description: 'File konfigurasi (opsional)'
  })
  .option('requests-per-ip', {
    alias: 'r',
    type: 'number',
    default: 1,
    description: 'Jumlah maksimal request per IP'
  })
  .option('max-retries', {
    alias: 'm',
    type: 'number',
    default: 3,
    description: 'Jumlah maksimal retries per wallet'
  })
  .help()
  .alias('help', 'h')
  .argv;

// Config object
let config = {
  captchaKey: argv['2captcha-key'] || null,
  proxyFile: argv['proxy-file'] || 'proxies.txt',
  delay: argv.delay || 15000,
  retryDelay: argv['retry-delay'] || 120000,
  requestsPerIp: argv['requests-per-ip'] || 1,
  maxRetries: argv['max-retries'] || 3
};

// State tracking
let proxyList = [];
let currentProxyIndex = 0;
let requestsWithCurrentProxy = 0;

// Function to prompt user input
function question(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

// Function to wait for enter key
function waitForEnter(message = "Press Enter to continue...") {
  return new Promise((resolve) => {
    rl.question(`\n${message}`, () => {
      resolve();
    });
  });
}

// Load config file if exists
function loadConfig() {
  const configFile = argv.config;
  if (fs.existsSync(configFile)) {
    try {
      const fileConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      config = { ...config, ...fileConfig };
      return true;
    } catch (error) {
      console.error('❌ Error loading config file:', error.message);
      return false;
    }
  }
  return false;
}

// Create example config file
function createExampleConfig() {
  const configFile = argv.config;
  const exampleConfig = {
    captchaKey: "your_2captcha_api_key_here",
    proxyFile: "proxies.txt",
    delay: 15000,
    retryDelay: 120000,
    requestsPerIp: 1,
    maxRetries: 3,
    captchaUrl: "https://faucet.sui.io",
    captchaSitekey: "0x4AAAAAAA11HKyGNZq_dUKj"
  };
  
  try {
    fs.writeFileSync(configFile, JSON.stringify(exampleConfig, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error creating config file:', error.message);
    return false;
  }
}

// Fungsi untuk parsing seed phrase atau private key Sui
function parseWalletInput(input) {
  input = input.trim();
  try {
    if (input.split(' ').length === 12) {
      // Seed phrase (bip39 mnemonic)
      const words = input.split(' ');
      const isValid = words.length === 12 && words.every(word => wordlist.includes(word));
      
      if (!isValid) {
        console.error('❌ Invalid mnemonic format');
        return null;
      }
      
      try {
        // Buat keypair dari mnemonic - update untuk Sui.js terbaru
        const keypair = Ed25519Keypair.deriveKeypair(input);
        const address = keypair.getPublicKey().toSuiAddress();
        
        return {
          keypair,
          address,
          mnemonic: input
        };
      } catch (e) {
        console.error('❌ Error deriving keypair from mnemonic:', e.message);
        return null;
      }
    } 
    // Cek format "suiprivkey1qqqXXXXXX"
    else if (input.startsWith('suiprivkey1')) {
      try {
        // Metode dekoding khusus untuk format suiprivkey1
        const base64UrlKey = input.substring(11); // Hilangkan "suiprivkey1"
        
        // Pertama, konversi dari base64url ke base64 standar
        let base64 = base64UrlKey.replace(/-/g, '+').replace(/_/g, '/');
        // Tambahkan padding jika perlu
        while (base64.length % 4) {
          base64 += '=';
        }
        
        // Kemudian decode ke buffer
        const buffer = Buffer.from(base64, 'base64');
        
        // Ekstrak hanya 32 byte pertama (kunci private)
        if (buffer.length < 32) {
          throw new Error(`Secretkey too short: ${buffer.length} bytes`);
        }
        
        const privateKeyBytes = buffer.slice(0, 32);
        const keypair = Ed25519Keypair.fromSecretKey(new Uint8Array(privateKeyBytes));
        const address = keypair.getPublicKey().toSuiAddress();
        
        return {
          keypair,
          address,
          privateKey: input
        };
      } catch (e) {
        console.error('❌ Error parsing Sui private key:', e.message);
        return null;
      }
    }
    else if (/^[0-9a-fA-F]{64}$/.test(input)) {
      // Private key (hex format)
      try {
        const privateKeyBytes = Uint8Array.from(Buffer.from(input, 'hex'));
        const keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
        const address = keypair.getPublicKey().toSuiAddress();
        
        return {
          keypair,
          address,
          privateKey: input
        };
      } catch (e) {
        console.error('❌ Error parsing hex private key:', e.message);
        return null;
      }
    } else {
      return null;
    }
  } catch (error) {
    console.error('❌ Error parsing wallet:', error.message);
    return null;
  }
}

// Menu option 1: Check Wallets
async function checkWallets() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║            👛 CHECK WALLETS 👛          ║');
  console.log('╚════════════════════════════════════════╝');
  
  console.log('\n1. Load from wallets.txt file');
  console.log('2. Paste private key/mnemonic manually');
  console.log('3. Back to main menu');
  
  const choice = await question('\nSelect option (1-3): ');
  
  switch(choice) {
    case '1':
      await checkWalletsFromFile();
      break;
    case '2':
      await checkWalletManual();
      break;
    case '3':
      return;
    default:
      console.log('❌ Invalid choice');
      await waitForEnter();
  }
}

async function checkWalletsFromFile() {
  console.log('\n📁 Checking wallets from file...\n');
  
  if (!fs.existsSync('wallets.txt')) {
    console.log('❌ wallets.txt file not found!');
    console.log('📄 Creating example wallets.txt...');
    
    const exampleContent = `# Each line should contain either a seed phrase or private key
# Example with seed phrases:
# word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12

# Example with private keys (64 character hex):
# abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890

# Example with Sui private keys:
# suiprivkey1qqqXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Remove these examples and add your real wallets`;
    
    fs.writeFileSync('wallets.txt', exampleContent);
    console.log('✅ Example file created. Please edit wallets.txt and try again.');
    await waitForEnter();
    return;
  }

  try {
    const walletsContent = fs.readFileSync('wallets.txt', 'utf8');
    const lines = walletsContent.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '' && !line.startsWith('#'));

    console.log(`📂 Found ${lines.length} wallet entries in wallets.txt\n`);

    let validCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const wallet = parseWalletInput(line);
      
      if (wallet) {
        console.log(`✅ Wallet ${i + 1}: ${wallet.address}`);
        validCount++;
      } else {
        console.log(`❌ Invalid wallet ${i + 1}: ${line.substring(0, 20)}...`);
        invalidCount++;
      }
    }
    
    console.log(`\n📊 Summary: ${validCount} valid, ${invalidCount} invalid wallets`);
    await waitForEnter();
  } catch (error) {
    console.error('❌ Error reading wallets file:', error.message);
    await waitForEnter();
  }
}

async function checkWalletManual() {
  console.log('\n✏️  Paste your private key or mnemonic phrase:');
  const input = await question('> ');
  
  const wallet = parseWalletInput(input);
  if (wallet) {
    console.log(`\n✅ Valid wallet!`);
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Type: ${wallet.mnemonic ? 'Mnemonic' : 'Private Key'}`);
  } else {
    console.log('\n❌ Invalid wallet format!');
    console.log('   Supported formats:');
    console.log('   - 12-word mnemonic phrase');
    console.log('   - 64-character hex private key');
    console.log('   - Sui private key (suiprivkey1...)');
  }
  
  await waitForEnter();
}

// Menu option 2: Check Proxies
async function checkProxies() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║            🌐 CHECK PROXIES 🌐          ║');
  console.log('╚════════════════════════════════════════╝');
  
  if (!fs.existsSync(config.proxyFile)) {
    console.log(`\n❌ Proxy file ${config.proxyFile} not found!`);
    console.log('📄 Creating example proxy file...');
    
    const exampleContent = `# List of proxies, one per line in format: protocol://username:password@host:port
http://user1:pass1@host1.example.com:8080
http://user2:pass2@host2.example.com:8080
http://user3:pass3@host3.example.com:8080
# Add more proxies as needed`;
    
    try {
      fs.writeFileSync(config.proxyFile, exampleContent);
      console.log(`✅ Example file created: ${config.proxyFile}`);
      console.log('Please edit the file with your real proxies.');
    } catch (error) {
      console.error('❌ Error creating proxy file:', error.message);
    }
    await waitForEnter();
    return;
  }
  
  try {
    const content = fs.readFileSync(config.proxyFile, 'utf8');
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '' && !line.startsWith('#'));
    
    console.log(`\n📂 Found ${lines.length} proxy entries in ${config.proxyFile}\n`);
    
    if (lines.length === 0) {
      console.log('❌ No valid proxy entries found!');
      console.log('Please add your proxies to the file.');
    } else {
      for (let i = 0; i < lines.length && i < 5; i++) {
        // Mask proxy for display (hide password)
        const maskedProxy = lines[i].replace(/(\/\/[^:]+:)([^@]+)(@.+)/, '$1****$3');
        console.log(`✅ Proxy ${i + 1}: ${maskedProxy}`);
      }
      
      if (lines.length > 5) {
        console.log(`... and ${lines.length - 5} more proxies`);
      }
    }
    
    console.log(`\n📊 Total: ${lines.length} proxies loaded`);
    await waitForEnter();
  } catch (error) {
    console.error('❌ Error reading proxy file:', error.message);
    await waitForEnter();
  }
}

// Menu option 3: Check Captcha API
async function checkCaptchaAPI() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║          🤖 CHECK CAPTCHA API 🤖        ║');
  console.log('╚════════════════════════════════════════╝');
  
  // Load current config
  loadConfig();
  
  if (!config.captchaKey || config.captchaKey === "your_2captcha_api_key_here") {
    console.log('\n❌ No valid 2Captcha API key found!');
    console.log('Please update your config.json file with a valid API key.');
    
    if (!fs.existsSync('config.json')) {
      console.log('\n📄 Creating example config.json...');
      createExampleConfig();
      console.log('✅ Example config created. Please edit config.json with your API key.');
    }
    await waitForEnter();
    return;
  }
  
  console.log('\n🔍 Testing 2Captcha API...');
  console.log(`API Key: ${config.captchaKey.substring(0, 10)}...${config.captchaKey.slice(-4)}`);
  
  try {
    // Test API by getting balance
    const response = await axios.get('https://2captcha.com/res.php', {
      params: {
        key: config.captchaKey,
        action: 'getbalance',
        json: 1
      },
      timeout: 10000
    });
    
    if (response.data.status === 1) {
      console.log('✅ API key is valid!');
      console.log(`💰 Account balance: $${response.data.request}`);
    } else {
      console.log('❌ API key is invalid!');
      console.log(`Error: ${response.data.error_text || response.data.request}`);
    }
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('Please check your internet connection and API key.');
  }
  
  await waitForEnter();
}

// Menu option 4: Check Balance for Specific Wallet
async function checkSingleBalance() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║          💰 CHECK BALANCE 💰            ║');
  console.log('╚════════════════════════════════════════╝');
  
  console.log('\nEnter wallet address or private key/mnemonic:');
  const input = await question('> ');
  
  let wallet;
  
  // Check if input is an address or private key/mnemonic
  if (input.startsWith('0x') && input.length === 66) {
    // It's an address
    wallet = { address: input };
  } else {
    // Try to parse as private key/mnemonic
    wallet = parseWalletInput(input);
    if (!wallet) {
      console.log('❌ Invalid input! Please provide a valid address, private key, or mnemonic.');
      await waitForEnter();
      return;
    }
  }
  
  console.log(`\n🔍 Checking balance for: ${wallet.address}`);
  
  try {
    const endpoint = 'https://fullnode.testnet.sui.io';
    const axiosClient = axios.create({
      baseURL: endpoint,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const response = await axiosClient.post('', {
      jsonrpc: '2.0',
      id: 1,
      method: 'suix_getBalance',
      params: [wallet.address, '0x2::sui::SUI']
    });
    
    if (response.data && response.data.result && typeof response.data.result.totalBalance !== 'undefined') {
      const balance = response.data.result.totalBalance;
      const suiBalance = (parseInt(balance) / 1000000000).toFixed(4); // Convert MIST to SUI
      console.log(`✅ Balance: ${suiBalance} SUI`);
    } else {
      console.log('❌ Failed to get balance');
    }
  } catch (error) {
    console.error('❌ Error checking balance:', error.message);
  }
  
  await waitForEnter();
}

// Menu option 5: Reset Configuration
async function resetConfiguration() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║          🔄 RESET CONFIG 🔄             ║');
  console.log('╚════════════════════════════════════════╝');
  
  console.log('\n⚠️  This will reset all configuration files to default examples.');
  const confirm = await question('Are you sure? (y/N): ');
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Reset cancelled.');
    await waitForEnter();
    return;
  }
  
  try {
    // Reset config.json
    createExampleConfig();
    console.log('✅ config.json reset');
    
    // Reset wallets.txt
    const walletExample = `# Each line should contain either a seed phrase or private key
# Example with seed phrases:
# word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12

# Example with private keys (64 character hex):
# abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890

# Example with Sui private keys:
# suiprivkey1qqqXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Remove these examples and add your real wallets`;
    
    fs.writeFileSync('wallets.txt', walletExample);
    console.log('✅ wallets.txt reset');
    
    // Reset proxies.txt
    const proxyExample = `# List of proxies, one per line in format: protocol://username:password@host:port
http://user1:pass1@host1.example.com:8080
http://user2:pass2@host2.example.com:8080
http://user3:pass3@host3.example.com:8080
# Add more proxies as needed`;
    
    fs.writeFileSync('proxies.txt', proxyExample);
    console.log('✅ proxies.txt reset');
    
    console.log('\n🎉 All configuration files have been reset to examples!');
    console.log('Please edit them with your real data before running the claimer.');
    
  } catch (error) {
    console.error('❌ Error resetting configuration:', error.message);
  }
  
  await waitForEnter();
}

// Load proxies from file
function loadProxies() {
  if (!fs.existsSync(config.proxyFile)) {
    return [];
  }
  
  try {
    const content = fs.readFileSync(config.proxyFile, 'utf8');
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '' && !line.startsWith('#'));
    
    return lines.map(proxy => {
      // Ensure proxy starts with http:// or https://
      if (!proxy.startsWith('http://') && !proxy.startsWith('https://')) {
        return 'http://' + proxy;
      }
      return proxy;
    });
  } catch (error) {
    console.error(`❌ Error loading proxies: ${error.message}`);
    return [];
  }
}

// Custom CAPTCHA solver using clodpler.prayogatri.my.id
async function solveCaptchaWithCustomService(url, sitekey, pollInterval = 3000, maxWait = 120000, action = '', cdata = '') {
  try {
    // 1. Request a new CAPTCHA task
    const params = { url, sitekey };
    if (action) params.action = action;
    if (cdata) params.cdata = cdata;
    const taskRes = await axios.get('https://clodpler.prayogatri.my.id/turnstile', {
      params,
      timeout: 10000
    });
    if (!taskRes.data || !taskRes.data.task_id) {
      console.error('❌ CAPTCHA service error (turnstile):', taskRes.data);
      throw new Error('No task_id returned from CAPTCHA service');
    }
    const taskId = taskRes.data.task_id;

    // 2. Poll for result
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      await new Promise(res => setTimeout(res, pollInterval));
      const resultRes = await axios.get('https://clodpler.prayogatri.my.id/result', {
        params: { id: taskId },
        timeout: 10000
      });
      if (resultRes.data && resultRes.data.value) {
        return resultRes.data.value;
      } else if (resultRes.data && resultRes.data.error) {
        console.error('❌ CAPTCHA service error (result):', resultRes.data.error);
        break;
      } else if (resultRes.data) {
        // Show any other response for debugging
        console.error('❌ CAPTCHA service response (result):', resultRes.data);
      }
    }
    throw new Error('CAPTCHA solving timed out or failed');
  } catch (err) {
    console.error('❌ Error solving CAPTCHA:', err.message);
    return null;
  }
}

// Function to generate a new Sui wallet (mnemonic + address)
function createNewWallet() {
  // Generate a random mnemonic (12 words)
  const bip39 = require('@scure/bip39');
  const mnemonic = bip39.generateMnemonic(wordlist, 128); // 12 words
  const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
  const address = keypair.getPublicKey().toSuiAddress();
  return { mnemonic, address };
}

// Menu option: Create new wallet(s)
async function createWalletsMenu() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║         🆕 CREATE NEW WALLET 🆕         ║');
  console.log('╚════════════════════════════════════════╝');
  const countStr = await question('\nHow many wallets to create? (default 1): ');
  const count = Math.max(1, parseInt(countStr) || 1);
  const wallets = [];
  for (let i = 0; i < count; i++) {
    const w = createNewWallet();
    // Attach keypair for later use (for saving pk)
    const mnemonic = w.mnemonic;
    const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
    wallets.push({ ...w, keypair });
    console.log(`\nWallet ${i+1}:`);
    console.log(`Mnemonic : ${w.mnemonic}`);
    console.log(`Address  : ${w.address}`);
  }
  // Optionally save to wallets.txt, address.txt, and pk.txt
  const save = await question('\nSave these wallets to wallets.txt, address.txt, and pk.txt? (y/N): ');
  if (save.toLowerCase() === 'y') {
    let mnemonicContent = '';
    let addrContent = '';
    let pkContent = '';
    for (const w of wallets) {
      mnemonicContent += w.mnemonic + '\n';
      addrContent += w.address + '\n';
      const privKeyHex = Buffer.from(w.keypair.export().privateKey).toString('hex');
      pkContent += privKeyHex + '\n';
    }
    fs.appendFileSync('wallets.txt', mnemonicContent);
    fs.appendFileSync('address.txt', addrContent);
    fs.appendFileSync('pk.txt', pkContent);
    console.log('✅ Mnemonic(s) saved to wallets.txt');
    console.log('✅ Address(es) saved to address.txt');
    console.log('✅ Private key(s) saved to pk.txt');
  }
  await waitForEnter();
}

// Function to claim tokens from Sui faucet
async function claimFaucet(wallet, captchaToken, faucetUrl = 'https://faucet.sui.io/gas', retryCount = 0) {
  try {
    console.log('🚰 Sending faucet request...');
    
    // Get current proxy or null if no proxies configured
    const proxy = proxyList.length > 0 ? 
      proxyList[currentProxyIndex] : null;
    
    // Create axios instance with proxy if available
    const axiosInstance = proxy ? 
      axios.create({ 
        httpsAgent: new HttpsProxyAgent(proxy),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://faucet.sui.io/'
        }
      }) : 
      axios.create({
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://faucet.sui.io/'
        }
      });
    
    // Update proxy tracking
    if (proxy) {
      requestsWithCurrentProxy++;
      if (requestsWithCurrentProxy >= config.requestsPerIp) {
        currentProxyIndex = (currentProxyIndex + 1) % proxyList.length;
        requestsWithCurrentProxy = 0;
        console.log(`🔄 Switching to next proxy: ${currentProxyIndex + 1}/${proxyList.length}`);
      }
    }
    
    // Make the request to Sui faucet
    const response = await axiosInstance.post(faucetUrl, {
      FixedAmountRequest: {
        recipient: wallet.address
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Captcha-Token': captchaToken
      },
      timeout: 30000
    });
    
    // Process response
    if (response.data && response.data.task_id) {
      console.log('✅ Faucet request submitted successfully!');
      console.log(`📋 Task ID: ${response.data.task_id}`);
      
      // Check for transaction hash or other success indicators
      if (response.data.tx_digest) {
        console.log(`🧾 Transaction: ${response.data.tx_digest}`);
      }
      
      return {
        success: true,
        taskId: response.data.task_id,
        txDigest: response.data.tx_digest || null
      };
    } else {
      console.log('⚠️ Unknown response format:', response.data);
      return { success: false, error: 'Unknown response format' };
    }
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      console.log(`❌ Faucet error: ${status}`);
      
      // Handle rate limit errors (HTTP 429)
      if (status === 429) {
        console.log('⚠️ Rate limit exceeded. Implementing retry with backoff strategy...');
        
        if (retryCount < config.maxRetries) {
          // Calculate exponential backoff delay (retry 1: 1x, retry 2: 2x, retry 3: 4x the retryDelay)
          const backoffDelay = config.retryDelay * Math.pow(2, retryCount);
          console.log(`🕐 Waiting ${backoffDelay/1000} seconds before retry ${retryCount + 1}/${config.maxRetries}...`);
          
          // If we have multiple proxies, switch to the next one immediately
          if (proxyList.length > 1) {
            currentProxyIndex = (currentProxyIndex + 1) % proxyList.length;
            requestsWithCurrentProxy = 0;
            console.log(`🔄 Switching to next proxy due to rate limit: ${currentProxyIndex + 1}/${proxyList.length}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          console.log('🔄 Retrying faucet request...');
          return claimFaucet(wallet, captchaToken, faucetUrl, retryCount + 1);
        } else {
          console.log('❌ Maximum retry attempts reached. Could not complete faucet claim.');
        }
      }
      
      // Try to determine if it's a Vercel security checkpoint
      const responseData = error.response.data;
      const isSecurityCheckpoint = typeof responseData === 'string' && 
        (responseData.includes('Security Checkpoint') || 
         responseData.includes('Vercel Security') ||
         responseData.includes('<!DOCTYPE html>'));
      
      if (isSecurityCheckpoint) {
        console.log('⚠️ Detected security checkpoint. IP may be temporarily blocked.');
      }
      
      console.log('Response data:', typeof responseData === 'string' ? 
        'HTML security page (IP blocked)' : responseData);
      
      return { 
        success: false, 
        error: error.response.data,
        status: error.response.status,
        isRateLimit: status === 429,
        isSecurityCheckpoint
      };
    } else if (error.request) {
      // The request was made but no response was received
      console.log('❌ No response received from faucet server');
      return { success: false, error: 'No response from server' };
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('❌ Error setting up request:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Main faucet claimer function (existing implementation)
async function runFaucetClaimer() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║          🚀 RUN FAUCET CLAIMER 🚀       ║');
  console.log('╚════════════════════════════════════════╝');
  
  // Track start time
  const startTime = Date.now();
  
  // Load config and initialize
  loadConfig();
  proxyList = loadProxies();
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🤖 CAPTCHA Service: Custom (clodpler.prayogatri.my.id)');
  console.log('🌐 Proxies:', `✅ ${proxyList.length} loaded`);
  console.log('📊 Requests per IP:', config.requestsPerIp);
  console.log('⏱️  Delay:', `${config.delay}ms`);
  console.log('🔄 Retry Delay:', `${config.retryDelay}ms`);
  console.log('🔁 Max Retries:', config.maxRetries);
  console.log('═══════════════════════════════════════════════════════════');

  // Load wallets
  const wallets = readWallets();
  if (wallets.length === 0) {
    console.log('\n❌ No valid wallets found. Please check wallets.txt file.');
    await waitForEnter();
    return;
  }
  
  // Ask for target URL, sitekey, action, and cdata for CAPTCHA
  const defaultUrl = config.captchaUrl || 'https://faucet.sui.io';
  const defaultSitekey = config.captchaSitekey || '0x4AAAAAAA11HKyGNZq_dUKj';
  
  const url = await question(`\nEnter target URL for CAPTCHA (default: ${defaultUrl}): `) || defaultUrl;
  const sitekey = await question(`Enter sitekey for CAPTCHA (default: ${defaultSitekey}): `) || defaultSitekey;
  const action = await question('Enter action for CAPTCHA (optional, press Enter to skip): ');
  const cdata = await question('Enter cdata for CAPTCHA (optional, press Enter to skip): ');

  console.log(`\n🚀 Starting faucet claims for ${wallets.length} wallets...`);
  const confirm = await question('Proceed? (y/N): ');
  if (confirm.toLowerCase() !== 'y') {
    return;
  }

  // Run faucet claims for each wallet
  const results = {
    success: 0,
    failed: 0,
    rateLimited: 0,
    wallets: []
  };
  
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    console.log(`\n[${i+1}/${wallets.length}] Wallet: ${wallet.address}`);
    
    // First check if wallet already has balance to avoid unnecessary requests
    try {
      console.log('🔍 Checking current balance...');
      const provider = new JsonRpcProvider('https://fullnode.testnet.sui.io');
      const balanceResponse = await provider.getBalance({
        owner: wallet.address,
        coinType: '0x2::sui::SUI'
      });
      const suiBalance = (parseInt(balanceResponse.totalBalance) / 1000000000).toFixed(4);
      console.log(`💰 Current balance: ${suiBalance} SUI`);
      
      // Skip if balance is already significant (more than 0.05 SUI)
      if (parseFloat(suiBalance) > 0.05) {
        console.log(`✅ Wallet already has sufficient balance, skipping faucet claim.`);
        results.wallets.push({
          address: wallet.address,
          status: 'skipped',
          balance: suiBalance,
          message: 'Already has balance'
        });
        
        if (i < wallets.length - 1) {
          console.log(`⏱️ Waiting ${config.delay/1000} seconds before next wallet...`);
          await new Promise(res => setTimeout(res, config.delay));
        }
        continue;
      }
    } catch (err) {
      console.log('⚠️ Could not check balance, proceeding with claim attempt.');
    }
    
    console.log('🔐 Requesting CAPTCHA token...');
    const captchaToken = await solveCaptchaWithCustomService(url, sitekey, 3000, 120000, action, cdata);
    
    if (captchaToken && captchaToken !== 'CAPTCHA_FAIL') {
      console.log('✅ CAPTCHA token:', captchaToken.substring(0, 40) + '...');
      
      // Attempt to claim from faucet
      const faucetUrl = url.endsWith('/') ? url + 'gas' : url + '/gas';
      const result = await claimFaucet(wallet, captchaToken, faucetUrl);
      
      // Wait for a brief moment after claim
      await new Promise(res => setTimeout(res, 3000));
      
      // Check balance change to verify claim if successful
      let balanceAfter = null;
      
      if (result.success) {
        results.success++;
        try {
          console.log('🔍 Checking balance after claim...');
          const provider = new JsonRpcProvider('https://fullnode.testnet.sui.io');
          const balanceResponse = await provider.getBalance({
            owner: wallet.address,
            coinType: '0x2::sui::SUI'
          });
          balanceAfter = (parseInt(balanceResponse.totalBalance) / 1000000000).toFixed(4);
          console.log(`💰 Current balance: ${balanceAfter} SUI`);
        } catch (err) {
          console.log('⚠️ Could not verify balance:', err.message);
        }
        
        results.wallets.push({
          address: wallet.address,
          status: 'success',
          balance: balanceAfter,
          txDigest: result.txDigest
        });
      } else {
        if (result.isRateLimit) {
          results.rateLimited++;
          results.wallets.push({
            address: wallet.address,
            status: 'rate-limited',
            message: 'Rate limit exceeded'
          });
        } else {
          results.failed++;
          results.wallets.push({
            address: wallet.address,
            status: 'failed',
            error: result.isSecurityCheckpoint ? 'Security checkpoint' : 'Request failed'
          });
        }
      }
    } else {
      console.log('❌ Failed to get valid CAPTCHA token, skipping wallet.');
      results.failed++;
      results.wallets.push({
        address: wallet.address,
        status: 'failed',
        error: 'CAPTCHA failed'
      });
    }
    
    // Delay before next wallet
    if (i < wallets.length - 1) {
      // Add a random delay component to avoid predictable patterns (which can trigger rate limits)
      const jitter = Math.floor(Math.random() * 3000); // 0-3 seconds of random jitter
      const totalDelay = config.delay + jitter;
      
      console.log(`⏱️ Waiting ${totalDelay/1000} seconds before next wallet...`);
      await new Promise(res => setTimeout(res, totalDelay));
    }
  }

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║          🎯 CLAIM SUMMARY 🎯           ║');
  console.log('╚════════════════════════════════════════╝');
  
  // Log completion and save results
  console.log(`\n✅ Faucet claimer run complete for ${wallets.length} wallets!`);
  console.log(`⏱️ Total runtime: ${Math.floor((Date.now() - startTime) / 1000)} seconds`);
  console.log(`\n📊 RESULTS:`);
  console.log(`   ✓ Success: ${results.success}`);
  console.log(`   ✗ Failed: ${results.failed}`);
  console.log(`   ⚠️ Rate Limited: ${results.rateLimited}`);
  
  // Save detailed results to log file
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const summaryLog = `
========================================
  SUI FAUCET CLAIM RUN - ${timestamp}
========================================
Total wallets: ${wallets.length}
Success: ${results.success}
Failed: ${results.failed}
Rate limited: ${results.rateLimited}
Runtime: ${Math.floor((Date.now() - startTime) / 1000)} seconds

DETAILED RESULTS:
${results.wallets.map((w, idx) => {
  return `[${idx+1}] ${w.address} - ${w.status.toUpperCase()}${w.balance ? ' - Balance: ' + w.balance + ' SUI' : ''}${w.message ? ' (' + w.message + ')' : ''}${w.error ? ' (' + w.error + ')' : ''}`;
}).join('\n')}
========================================
`;
    fs.appendFileSync('claim_history.log', summaryLog);
    console.log('\n📝 Detailed results saved to claim_history.log');
  } catch (err) {
    console.log('⚠️ Could not save results to log file');
  }
  
  // Provide tips based on results
  if (results.rateLimited > 0) {
    console.log('\n⚠️ RATE LIMITING DETECTED:');
    console.log('   • Try increasing the delay between requests (current: ' + config.delay/1000 + 's)');
    console.log('   • Add more proxies to rotate through different IPs');
    console.log('   • Reduce the number of wallets claimed in a single session');
  }
  
  await waitForEnter();
}

// Function to read wallets for actual execution
function readWallets() {
  try {
    if (!fs.existsSync('wallets.txt')) {
      return [];
    }

    const walletsContent = fs.readFileSync('wallets.txt', 'utf8');
    const lines = walletsContent.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '' && !line.startsWith('#'));

    const wallets = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const wallet = parseWalletInput(line);
      
      if (wallet) {
        wallets.push(wallet);
      }
    }

    return wallets;
    
  } catch (error) {
    console.error('❌ Error reading wallets file:', error);
    return [];
  }
}

// Function to verify proxy functionality
async function verifyProxy(proxy) {
  try {
    console.log(`🔍 Testing proxy: ${proxy.replace(/(\/\/[^:]+:)([^@]+)(@.+)/, '$1****$3')}`);
    
    const agent = new HttpsProxyAgent(proxy);
    const instance = axios.create({ 
      httpsAgent: agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      },
      timeout: 10000
    });
    
    // Test proxy by making a request to check IP
    const response = await instance.get('https://api.ipify.org?format=json');
    if (response.data && response.data.ip) {
      console.log(`✅ Proxy working! IP: ${response.data.ip}`);
      return {
        success: true,
        ip: response.data.ip
      };
    } else {
      console.log('❌ Proxy test failed: No IP returned');
      return { success: false };
    }
  } catch (error) {
    console.log(`❌ Proxy test failed: ${error.message}`);
    return { 
      success: false,
      error: error.message 
    };
  }
}

// Enhanced proxy check functionality
async function verifyProxies() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║        🧪 VERIFY PROXY FUNCTION 🧪      ║');
  console.log('╚════════════════════════════════════════╝');
  
  // Load proxies
  const proxies = loadProxies();
  if (proxies.length === 0) {
    console.log('❌ No proxies found. Please add proxies to your proxy file first.');
    await waitForEnter();
    return;
  }
  
  console.log(`\nFound ${proxies.length} proxies. How many do you want to test?`);
  const countStr = await question(`Enter number (1-${proxies.length}), or "all": `);
  
  let testCount;
  if (countStr.toLowerCase() === 'all') {
    testCount = proxies.length;
  } else {
    testCount = Math.min(parseInt(countStr) || 1, proxies.length);
  }
  
  console.log(`\n🧪 Testing ${testCount} out of ${proxies.length} proxies...`);
  
  let working = 0;
  let failed = 0;
  const results = [];
  
  for (let i = 0; i < testCount; i++) {
    const proxy = proxies[i];
    const result = await verifyProxy(proxy);
    
    if (result.success) {
      working++;
      results.push({
        proxy: proxy.replace(/(\/\/[^:]+:)([^@]+)(@.+)/, '$1****$3'),
        status: 'working',
        ip: result.ip
      });
    } else {
      failed++;
      results.push({
        proxy: proxy.replace(/(\/\/[^:]+:)([^@]+)(@.+)/, '$1****$3'),
        status: 'failed',
        error: result.error
      });
    }
    
    // Add short delay between tests
    if (i < testCount - 1) {
      await new Promise(res => setTimeout(res, 1000));
    }
  }
  
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║          📊 PROXY TEST RESULTS 📊       ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\n✅ Working: ${working}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success rate: ${Math.round((working / testCount) * 100)}%`);
  
  if (working === 0) {
    console.log('\n⚠️ CRITICAL: No working proxies found! Faucet claims may fail.');
    console.log('   Please check your proxy list and ensure they are formatted correctly.');
    console.log('   Format should be: protocol://username:password@host:port');
  }
  
  await waitForEnter();
}

// Main menu function
async function showMainMenu() {
  while (true) {
    displayBanner();
    
    console.log('╔════════════════════════════════════════╗');
    console.log('║              📋 MAIN MENU 📋            ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    console.log('1. 👛 Check Wallets');
    console.log('2. 🌐 Check Proxies');
    console.log('3. 🧪 Verify Proxies');
    console.log('4. 🤖 Check API Captcha');
    console.log('5. 🚀 Run Faucet Claimer');
    console.log('6. 💰 Check Balance');
    console.log('7. 🆕 Create New Wallet(s)');
    console.log('8. 🔄 Reset Configuration');
    console.log('9. ❌ Cancel/Exit');
    console.log('');
    
    const choice = await question('Select option (1-9): ');
    
    switch(choice) {
      case '1':
        await checkWallets();
        break;
      case '2':
        await checkProxies();
        break;
      case '3':
        await verifyProxies();
        break;
      case '4':
        await checkCaptchaAPI();
        break;
      case '5':
        await runFaucetClaimer();
        break;
      case '6':
        await checkSingleBalance();
        break;
      case '7':
        await createWalletsMenu();
        break;
      case '8':
        await resetConfiguration();
        break;
      case '9':
        console.log('\n👋 Thank you for using Airdrop Laura!');
        console.log('💬 Join our Telegram: @AirdropLaura | @AirdropLauraDisc');
        console.log('🔗 Website: https://airdroplaura.com');
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('❌ Invalid choice. Please select 1-9.');
        await waitForEnter();
    }
  }
}

// Initialize and start the program
async function main() {
  // Create config file if it doesn't exist
  if (!fs.existsSync('config.json')) {
    createExampleConfig();
  }
  
  // Show main menu
  await showMainMenu();
}

// Start the program
main().catch(error => {
  console.error('❌ Program error:', error);
  rl.close();
  process.exit(1);
});
