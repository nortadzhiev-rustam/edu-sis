#!/bin/bash

# Create the Google Service Account key file from the secret
if [ -n "$GOOGLE_SERVICE_ACCOUNT_KEY" ]; then
  echo "Creating Google Service Account key file..."
  echo "$GOOGLE_SERVICE_ACCOUNT_KEY" > google-service-account-key.json
  echo "Google Service Account key file created successfully"
else
  echo "Warning: GOOGLE_SERVICE_ACCOUNT_KEY environment variable not found"
fi
