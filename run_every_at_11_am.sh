#!/bin/bash
# Absolute path to your virtual environment
source /root/whatsapp-bot-4evergaming/myenv/bin/activate

# Execute python scripts
cd /root/whatsapp-bot-4evergaming/whmcs && python3 invoice_unpaid.py
cd /root/whatsapp-bot-4evergaming/whmcs && python3 invoice_duedate.py
cd /root/whatsapp-bot-4evergaming/whmcs && python3 invoice_comingTerminate.py
cd /root/whatsapp-bot-4evergaming/whmcs && python3 order_pending.py


