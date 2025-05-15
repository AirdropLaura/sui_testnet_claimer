# 🚀 SUI Faucet Claimer - Airdrop Laura

## 📋 Description
Automated SUI testnet faucet claimer with CAPTCHA solving support and proxy rotation.

### Created by: Bastiar
### 📢 Channel: [@AirdropLaura](https://t.me/AirdropLaura)
### 💬 Group: [@AirdropLauraDisc](https://t.me/AirdropLauraDisc)

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ installed
- 2Captcha API key (optional but recommended)
- Proxy list (optional for better success rate)

### Step-by-Step Installation

1. **Clone this repository**
   ```bash
   git clone https://github.com/AirdropLaura/sui_testnet_claimer.git
   cd sui-faucet-claimer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Configuration Files**

   #### 📄 Edit config.json
   ```
   nano config.json
   ```
   Update `config.json` with your 2Captcha API key:
   ```json
   {
     "captchaKey": "YOUR_ACTUAL_2CAPTCHA_API_KEY",
     "proxyFile": "proxies.txt",
     "delay": 10000,
     "retryDelay": 60000,
     "requestsPerIp": 1,
     "maxRetries": 3
   }
   ```
   **ganti YOUR_ACTUAL_2CAPTCHA_API_KEY = API Captcha kalian
   #### 👛 Create wallets.txt
   Create a new file named `wallets.txt` and add your wallets (one per line):
   ```
   nano wallets.txt
   ```
   
   **Supported wallet formats:**
   - 12-word mnemonic phrases
   - 64-character hex private keys  
   - Sui private keys (starting with `suiprivkey1`)

   #### 🌐 Create proxies.txt (Optional)
   Create a new file named `proxies.txt` and add your proxies (one per line):
   ```
   http://username:password@proxy1.example.com:8080
   https://username:password@proxy2.example.com:3128
   socks5://username:password@proxy3.example.com:1080
   ```

5. **Run the script**
   ```bash
   node run.js
   ```

---

## 🚀 Usage

### Interactive Mode
```bash
npm start
```

The script will display an interactive menu with the following options:

1. **👛 Check Wallets** - Validate your wallet formats
2. **🌐 Check Proxies** - Test your proxy configurations  
3. **🤖 Check API Captcha** - Verify your 2Captcha API key
4. **🚀 Run Faucet Claimer** - Start the automated claiming process
5. **💰 Check Balance** - Check individual wallet balances
6. **🔄 Reset Configuration** - Reset configs to default
7. **❌ Exit** - Close the application

### Command Line Options
```bash
node run.js [options]

Options:
  -k, --2captcha-key    2Captcha API key
  -pf, --proxy-file     Proxy file path (default: proxies.txt)
  -d, --delay           Delay between requests in ms (default: 10000)
  -rd, --retry-delay    Delay after rate limit in ms (default: 60000)
  -r, --requests-per-ip Max requests per IP (default: 1)
  -m, --max-retries     Max retries per wallet (default: 3)
  -c, --config          Config file path (default: config.json)
  -h, --help            Show help
```

---

## 📁 Required Files Structure

After setup, your folder should look like this:
```
sui-faucet-claimer/
├── sui-faucet-claimer.js  # Main script (included)
├── package.json           # Dependencies (included)
├── config.json            # Your configuration (edit this)
├── wallets.txt            # Your wallets (create this)
├── proxies.txt            # Your proxies (create this)
└── README.md              # Documentation (included)
```

---

## ⚙️ Configuration Details

### config.json Parameters
- `captchaKey`: Your 2Captcha API key
- `proxyFile`: Path to proxy file
- `delay`: Milliseconds to wait between requests
- `retryDelay`: Milliseconds to wait after rate limit
- `requestsPerIp`: Maximum requests per proxy IP
- `maxRetries`: Maximum retry attempts per wallet

### Getting 2Captcha API Key
1. Register at [2captcha.com](https://2captcha.com)
2. Add funds to your account
3. Get your API key from the dashboard
4. Replace `your_2captcha_api_key_here` in config.json

### Proxy Recommendations
- Use premium proxies for better success rate
- Rotate proxies to avoid rate limiting
- Supports HTTP, HTTPS, and SOCKS5 proxies

---

## 🔐 Security Notes

- **Never share your private keys or seed phrases**
- Keep your `wallets.txt` and `config.json` files private
- Use strong passwords for proxy authentication
- The script automatically creates example files if they don't exist

---

## 🚨 Important Notes

1. **First Run**: The script will create example files if `wallets.txt` or `proxies.txt` don't exist
2. **API Key**: Without a 2Captcha API key, the script will try to bypass CAPTCHAs (lower success rate)
3. **Proxies**: Using proxies increases success rate and avoids IP bans
4. **Rate Limiting**: Built-in delays and retry mechanisms prevent server overload

---

## 🎮 Features

- ✅ Interactive menu system
- ✅ Multiple wallet format support
- ✅ Proxy rotation and validation
- ✅ 2Captcha integration
- ✅ Balance checking
- ✅ Error handling and retries
- ✅ Progress tracking
- ✅ Configuration validation

---

## 🐞 Troubleshooting

### Common Issues:

1. **"wallets.txt not found"**
   - Create the file manually and add your wallets

2. **"Invalid wallet format"**
   - Check wallet format (mnemonic/private key)
   - Ensure no extra spaces or characters

3. **"API key invalid"**
   - Verify your 2Captcha API key
   - Check account balance

4. **"Proxy connection failed"**
   - Verify proxy credentials
   - Test proxy connection manually

---

## 📞 Support

Need help? Join our community:

- 📢 **Channel**: [@AirdropLaura](https://t.me/AirdropLaura)
- 💬 **Discussion Group**: [@AirdropLauraDisc](https://t.me/AirdropLauraDisc)

---

## 🚨 Disclaimer

This tool is for educational purposes only. Use at your own risk. The developer is not responsible for any losses or damages. Always test with small amounts first.

---

## ❤️ Support the Project

If this tool helped you, consider:
- ⭐ Starring this repository
- 🔄 Sharing with friends
- 📢 Joining our Telegram channels

---

*Made with ❤️ by Bastiar - Airdrop Laura*
