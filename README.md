# WhatsApp Bot
I am a Bot that sends notifications and reminders via WhatsApp.

# Installation
```bash
# Install linux dependencies
apt install git python3-venv python3-pip -y

# Clone my repository
cd /root
git clone https://github.com/stefanofabi/whatsapp-bot-4evergaming.git
cd whastapp-bot-4evergaming

# Enter the virtual environment
python3 -m venv myenv
source myenv/bin/activate

# Install python dependencies
pip install -r requirements.txt

# Configure the MySQL WhatsApp database
cp config.json.example config.json
nano config.json

# Import the mysql database
mysql -u whatsapp_messages -p whatsapp_messages < /root/whatsapp-bot-4evergaming/database.sql

# Install npm dependencies
npm install

# Configure the MySQL tcadmin and whmcs database
export DB_WHMCS_HOST='localhost'
export DB_WHMCS_NAME='whmcs'
export DB_WHMCS_USER='whmcs'
export DB_WHMCS_PASS=''

export DB_TCADMIN_HOST='localhost'
export DB_TCADMIN_NAME='tcadmin'
export DB_TCADMIN_USER='tcadmin'
export DB_TCADMIN_PASS=''

export DB_WHATSAPP_HOST='localhost'
export DB_WHATSAPP_NAME='whatsapp_messages'
export DB_WHATSAPP_USER='whatsapp_messages'
export DB_WHATSAPP_PASS=''

# Run the whatsapp bot
npm start
```

Then set up a cron every 5 minutes and set permissions:
```bash
chmod +x /root/whatsapp-bot-4evergaming/run_every_5_minutes.sh
chmod +x /root/whatsapp-bot-4evergaming/run_every_60_minutes.sh
chmod +x /root/whatsapp-bot-4evergaming/run_every_at_11_am.sh


crontab -e
@reboot sleep 5 && node /root/whatsapp-bot-4evergaming/index.js &

*/5 * * * * /root/whatsapp-bot-4evergaming/run_every_5_minutes.sh
*/60 * * * * /root/whatsapp-bot-4evergaming/run_every_60_minutes.sh

0 11 * * * /root/whatsapp-bot-4evergaming/run_every_at_11_am.sh
```

# Considerations
Set up daily tasks for after WHMCS cron has run