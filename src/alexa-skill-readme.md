
# G-time Alexa Skill Setup Instructions

This document explains how to set up an Alexa skill that connects to your G-time application.

## Prerequisites

1. An Amazon Developer account (create one at [developer.amazon.com](https://developer.amazon.com))
2. A backend service to host your Alexa skill endpoint (AWS Lambda recommended)

## Setup Process

### 1. Create a new Alexa Skill in the Alexa Developer Console

1. Go to the [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)
2. Click "Create Skill"
3. Name your skill "G Time" (or whatever you prefer)
4. Choose "Custom" model
5. Select "Provision your own" for hosting
6. Click "Create skill"

### 2. Set up the Interaction Model

1. Choose "Start from scratch" template
2. In the Interaction Model section, click "JSON Editor"
3. Upload the `alexa-skill-model.json` file provided in this project
4. Click "Save Model" and then "Build Model"

### 3. Set up a Backend Service (AWS Lambda)

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda)
2. Create a new function
3. Select "Author from scratch"
4. Name your function (e.g., "g-time-alexa-skill")
5. Choose Node.js runtime
6. Create or assign an execution role with basic Lambda permissions
7. Click "Create function"

### 4. Deploy the Skill Code to Lambda

1. Add a trigger to your Lambda function: select "Alexa Skills Kit"
2. Paste your Alexa Skill ID (from the Alexa Developer Console)
3. Create a Node.js application that uses the `alexaHandler.ts` code from this project
4. Make sure to adapt the code to work with your user database (the current implementation uses localStorage as a demo)
5. Deploy your code to Lambda

### 5. Connect Your Alexa Skill to Your Lambda Function

1. Return to the Alexa Developer Console
2. Go to the "Endpoint" section
3. Select "AWS Lambda ARN"
4. Paste your Lambda function ARN
5. Click "Save Endpoints"

### 6. Test Your Skill

1. In the Alexa Developer Console, go to the "Test" tab
2. Enable testing
3. Type or say: "open g time"
4. Try commands like "check my status" or "log a new dose"

## Production Considerations

For a production version of this skill:

1. Replace the localStorage-based user data storage with a proper database
2. Implement user account linking to connect Alexa users to your app users
3. Add proper error handling and logging
4. Consider adding additional intents for more functionality
5. Implement proper security measures for sensitive data

## Limitations

- This demo implementation doesn't include actual data persistence
- User identification is not properly implemented (would need account linking)
- The skill cannot directly modify the app's state without a proper backend service
