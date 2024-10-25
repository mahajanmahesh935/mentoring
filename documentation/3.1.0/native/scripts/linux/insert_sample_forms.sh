#!/bin/bash

sudo -u postgres psql -p 9700 -d mentoring -f forms.sql
