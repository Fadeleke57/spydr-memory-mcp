#!/bin/bash

# Check if the .env file exists
if [ -f ".env" ]; then
    # Copy the contents of .env to .dev.vars
    # If .dev.vars exists, it will be overwritten
    cp ".env" ".dev.vars"
    echo "File .dev.vars created or updated with contents from .env"
else
    echo "File .env not found"
fi