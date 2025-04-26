
import { AlexaRequest, AlexaResponse } from '../types/alexa-types';
import { 
  createResponse,
  getUserData,
  getStatusInfo,
  handleAddDosage,
  getSessionStats
} from '../utils/alexaUtils';

// Main handler for Alexa requests
export const handleAlexaRequest = (request: AlexaRequest): AlexaResponse => {
  console.log('Received Alexa request:', request);

  // Get the request type
  const requestType = request.request.type;

  // LaunchRequest is when the user opens the skill without a specific intent
  if (requestType === 'LaunchRequest') {
    return createResponse(
      'Welcome to G-time. You can ask me to check your status, log a new dose, or get session information.',
      {},
      false
    );
  }

  // Intent requests are specific actions the user wants to take
  if (requestType === 'IntentRequest' && request.request.intent) {
    const intentName = request.request.intent.name;
    const slots = request.request.intent.slots || {};
    
    switch (intentName) {
      case 'StatusIntent':
        const userData = getUserData(request.session.user.userId);
        const statusInfo = getStatusInfo(userData);
        return createResponse(statusInfo, {}, false);

      case 'AddDosageIntent': {
        // Get dosage amount from slot or use default
        const amountSlot = slots['amount'];
        const amount = amountSlot && amountSlot.value 
          ? parseFloat(amountSlot.value) 
          : undefined;
        
        const responseText = handleAddDosage(amount);
        return createResponse(responseText, {}, false);
      }

      case 'SessionInfoIntent': {
        const userData = getUserData(request.session.user.userId);
        const sessionInfo = getSessionStats(userData);
        return createResponse(sessionInfo, {}, false);
      }

      case 'AMAZON.HelpIntent':
        return createResponse(
          'You can say: "check my status", "log a new dose", or "get session information".',
          {},
          false
        );

      case 'AMAZON.StopIntent':
      case 'AMAZON.CancelIntent':
        return createResponse('Goodbye!', {}, true);

      default:
        return createResponse(
          "I'm not sure how to help with that. You can say: check my status, log a new dose, or get session information.",
          {},
          false
        );
    }
  }

  // Handle session ended
  if (requestType === 'SessionEndedRequest') {
    // No response needed for SessionEndedRequest
    return createResponse('', {}, true);
  }

  // Default response for unhandled requests
  return createResponse(
    "I'm not sure how to help with that. You can say: check my status, log a new dose, or get session information.",
    {},
    false
  );
};
