#!/bin/bash
# Absolute path to your virtual environment
source /root/whatsapp-bot-4evergaming/myenv/bin/activate

# Execute python scripts
cd /root/whatsapp-bot-4evergaming/whmcs && python3 invoice_paid.py
cd /root/whatsapp-bot-4evergaming/whmcs && python3 client_area_login.py

cd /root/whatsapp-bot-4evergaming/tcadmin && python3 user_login.py
cd /root/whatsapp-bot-4evergaming/tcadmin && python3 server_started.py