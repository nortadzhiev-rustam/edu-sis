#!/bin/bash

# Create the Google Service Account key file from the secret for submit
if [ -n "$GOOGLE_SERVICE_ACCOUNT_KEY" ]; then
  echo "Creating Google Service Account key file for submit..."
  echo "$GOOGLE_SERVICE_ACCOUNT_KEY" > google-service-account-key.json
  echo "Google Service Account key file created successfully"
else
  echo "Error: GOOGLE_SERVICE_ACCOUNT_KEY environment variable not found"
  exit 1
fi
