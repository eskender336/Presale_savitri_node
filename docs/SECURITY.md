# Security Guide for Presale Savitri Node

## 🔒 Critical Security Issues Fixed

### 1. **MongoDB Port Exposure (FIXED)**
**Problem:** MongoDB port 27017 was exposed to the entire internet, allowing anyone to try to connect to your database.

**Fix Applied:** Changed docker-compose.yml to only bind MongoDB to localhost (127.0.0.1:27017:27017). Now only your server can access it, not the internet.

**Action Required:** Restart MongoDB container:
```bash
cd /home/ubuntu/Presale_savitri_node/Presale_savitri_node
docker-compose down
docker-compose up -d
```

---

## 🚨 Ports Status

### Ports Currently Open:
- **Port 22 (SSH)** - ✅ **KEEP OPEN** - Needed for remote access
- **Port 80 (HTTP)** - ✅ **KEEP OPEN** - Needed for web traffic
- **Port 443 (HTTPS)** - ✅ **KEEP OPEN** - Needed for secure web traffic
- **Port 27017 (MongoDB)** - ⚠️ **NOW SECURED** - Only accessible from localhost (not internet)

### Ports to Close (if any are open):
- Any other ports you don't recognize should be closed

---

## 🛡️ Firewall Setup (IMPORTANT!)

Your firewall (UFW) is currently **INACTIVE**. This means all ports are open to the internet. You need to set it up:

### Step 1: Install/Enable UFW (if not installed)
```bash
sudo apt update
sudo apt install ufw -y
```

### Step 2: Set Default Rules
```bash
# Deny all incoming, allow all outgoing
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

### Step 3: Allow Necessary Ports
```bash
# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH from your IP only (more secure - replace YOUR_IP with your actual IP)
# sudo ufw allow from YOUR_IP to any port 22
```

### Step 4: Enable Firewall
```bash
# Check what will be blocked/allowed
sudo ufw show added

# Enable the firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### Step 5: Verify MongoDB is NOT accessible from internet
```bash
# From another machine, try to connect (should fail):
# mongosh "mongodb://YOUR_SERVER_IP:27017" - This should NOT work
```

---

## 🔐 Other Security Issues Found

### 1. **HardhatAccounts.txt Contains Private Keys**
**Problem:** The file `HardhatAccounts.txt` contains private keys. Even though these are test keys, they shouldn't be in your repository.

**Fix Applied:** Added to .gitignore so it won't be committed to git.

**Action Required:**
- If this file is already in git, remove it:
  ```bash
  git rm --cached HardhatAccounts.txt
  git commit -m "Remove private keys from repository"
  ```
- Consider moving it to a secure location or deleting it if not needed

### 2. **API Endpoints Need Rate Limiting**
**Fix Applied:** Added basic rate limiting to:
- `/api/kyc` - 10 requests per minute
- `/api/voucher` - 5 requests per minute

**Note:** For production, consider using Redis-based rate limiting or a service like Cloudflare.

### 3. **Security Headers Added**
Added security headers to API endpoints:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

---

## 📋 Additional Security Recommendations

### 1. **Environment Variables**
- ✅ Make sure `.env` files are in `.gitignore` (already done)
- ⚠️ Never commit `.env` files to git
- ⚠️ Use strong passwords for MongoDB (MONGO_INITDB_ROOT_PASSWORD)
- ⚠️ Rotate API keys regularly

### 2. **MongoDB Security**
- ✅ MongoDB is now only accessible from localhost
- ⚠️ Make sure MongoDB has authentication enabled (check your .env file)
- ⚠️ Use strong passwords (at least 16 characters, mix of letters, numbers, symbols)
- ⚠️ Regularly backup your database

### 3. **SSH Security**
- ⚠️ Disable password authentication, use SSH keys only:
  ```bash
  sudo nano /etc/ssh/sshd_config
  # Set: PasswordAuthentication no
  # Set: PermitRootLogin no
  sudo systemctl restart sshd
  ```
- ⚠️ Change default SSH port (optional but recommended):
  ```bash
  # In /etc/ssh/sshd_config, change: Port 22 to Port 2222 (or another port)
  # Then: sudo ufw allow 2222/tcp
  # Then: sudo systemctl restart sshd
  ```

### 4. **Regular Updates**
```bash
# Update system packages regularly
sudo apt update
sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

### 5. **Monitoring**
- ⚠️ Set up log monitoring for failed login attempts
- ⚠️ Monitor MongoDB access logs
- ⚠️ Set up alerts for unusual activity

### 6. **Backups**
- ⚠️ Set up automated backups for:
  - MongoDB database
  - Environment files (.env)
  - Important configuration files

### 7. **SSL/TLS Certificate**
- ⚠️ Make sure you have a valid SSL certificate for HTTPS (port 443)
- ⚠️ Use Let's Encrypt for free certificates:
  ```bash
  sudo apt install certbot python3-certbot-nginx
  sudo certbot --nginx -d yourdomain.com
  ```

### 8. **API Security**
- ⚠️ Consider adding authentication tokens for sensitive API endpoints
- ⚠️ Validate all user inputs
- ⚠️ Use HTTPS only (no HTTP) in production

### 9. **Dependencies**
- ⚠️ Regularly update npm packages:
  ```bash
  npm audit
  npm audit fix
  ```
- ⚠️ Check for known vulnerabilities in dependencies

### 10. **File Permissions**
```bash
# Make sure sensitive files have correct permissions
chmod 600 .env
chmod 600 web3/.env
chmod 600 HardhatAccounts.txt  # If you keep it
```

---

## ✅ Quick Security Checklist

- [x] MongoDB port secured (localhost only)
- [ ] Firewall (UFW) enabled and configured
- [ ] SSH keys only (password auth disabled)
- [ ] Strong MongoDB passwords set
- [ ] Environment variables secured
- [ ] SSL certificate installed
- [ ] Regular backups configured
- [ ] System updates automated
- [ ] Log monitoring set up
- [ ] HardhatAccounts.txt removed from git (if it was committed)

---

## 🆘 If You Suspect a Breach

1. **Immediately change all passwords**
2. **Rotate all API keys**
3. **Check system logs for unauthorized access**
4. **Review MongoDB logs**
5. **Check for unauthorized changes in code**
6. **Consider taking the server offline temporarily**

---

## 📞 Need Help?

If you need help implementing any of these security measures, consult with a security professional or your system administrator.

