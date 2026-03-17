#!/bin/bash
cd /home/luana/hermes/hermes/api
php bin/console dbal:run-sql "SELECT id, status, responsible_name, doc_cnpj_url, doc_photo_url, doc_residence_url, doc_activity_url FROM accreditations ORDER BY created_at DESC LIMIT 5"
