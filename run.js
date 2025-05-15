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
    default: 10000,
    description: 'Delay antara requests dalam ms'
  })
  .option('retry-delay', {
    alias: 'rd',
    type: 'number',
    default: 60000,
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
  delay: argv.delay || 10000,
  retryDelay: argv['retry-delay'] || 60000,
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
    delay: 10000,
    retryDelay: 60000,
    requestsPerIp: 1,
    maxRetries: 3
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

// Main faucet claimer function (existing implementation)
async function runFaucetClaimer() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║          🚀 RUN FAUCET CLAIMER 🚀       ║');
  console.log('╚════════════════════════════════════════╝');
  
  // Load config and initialize
  loadConfig();
  proxyList = loadProxies();
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🤖 2Captcha API:', config.captchaKey && config.captchaKey !== "your_2captcha_api_key_here" ? '✅ Enabled' : '❌ Disabled');
  console.log('🌐 Proxies:', `✅ ${proxyList.length} loaded`);
  console.log('📊 Requests per IP:', config.requestsPerIp);
  console.log('⏱️  Delay:', `${config.delay}ms`);
  console.log('🔄 Retry Delay:', `${config.retryDelay}ms`);
  console.log('🔁 Max Retries:', config.maxRetries);
  console.log('═══════════════════════════════════════════════════════════');
  
  // Check if we have valid configuration
  if (!config.captchaKey || config.captchaKey === "your_2captcha_api_key_here") {
    console.log('\n⚠️  Warning: No valid 2Captcha API key found!');
    const proceed = await question('Continue without CAPTCHA solving? (y/N): ');
    if (proceed.toLowerCase() !== 'y') {
      return;
    }
  }
  
  // Load wallets
  const wallets = readWallets();
  if (wallets.length === 0) {
    console.log('\n❌ No valid wallets found. Please check wallets.txt file.');
    await waitForEnter();
    return;
  }
  
  console.log(`\n🚀 Starting faucet claims for ${wallets.length} wallets...`);
  const confirm = await question('Proceed? (y/N): ');
  if (confirm.toLowerCase() !== 'y') {
    return;
  }
  
  // Run the actual claimer (you'll need to implement the rest of the faucet logic here)
  console.log('\n🎯 Running faucet claimer...');
  // ... (rest of the faucet claimer implementation)
  
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
    console.log('3. 🤖 Check API Captcha');
    console.log('4. 🚀 Run Faucet Claimer');
    console.log('5. 💰 Check Balance');
    console.log('6. 🔄 Reset Configuration');
    console.log('7. ❌ Cancel/Exit');
    console.log('');
    
    const choice = await question('Select option (1-7): ');
    
    switch(choice) {
      case '1':
        await checkWallets();
        break;
      case '2':
        await checkProxies();
        break;
      case '3':
        await checkCaptchaAPI();
        break;
      case '4':
        await runFaucetClaimer();
        break;
      case '5':
        await checkSingleBalance();
        break;
      case '6':
        await resetConfiguration();
        break;
      case '7':
        console.log('\n👋 Thank you for using Airdrop Laura!');
        console.log('💬 Join our Telegram: @AirdropLaura | @AirdropLauraDisc');
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('❌ Invalid choice. Please select 1-7.');
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
